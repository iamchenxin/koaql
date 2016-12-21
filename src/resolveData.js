// @flow
// import url from 'url';
import {
  Source,
  parse,
  validate,
  execute,
  ExecutionResult,
//  formatError,
  getOperationAST,
  specifiedRules,
} from 'graphql';

import { parseBody } from './parseBody';
// import { renderGraphiQL } from './renderGraphiQL';

import type {
  DocumentNode,
  GraphQLError,
  GraphQLSchema,
} from 'graphql';
import type { Context, Request } from 'koa';
import { invariant, HttpError } from './tools.js';

/**
 * All information about a GraphQL request.
 */
type RequestInfo = {
  /**
   * The parsed GraphQL document.
   */
  document: DocumentNode,

  /**
   * The variable values used at runtime.
   */
  variables: ?{[name: string]: mixed},

  /**
   * The (optional) operation name requested.
   */
  operationName: ?string,

  /**
   * The result of executing the operation.
   */
  result: ?mixed,
};

/**
 * Used to configure the graphqlHTTP middleware by providing a schema
 * and other configuration options.
 *
 * Options can be provided as an Object, a Promise for an Object, or a Function
 * that returns an Object or a Promise for an Object.
 */
type Options = ((request: Request) => OptionsResult) | OptionsResult;
type OptionsResult = OptionsData | Promise<OptionsData>;

type OptionsData = {
  /**
   * A GraphQL schema from graphql-js.
   */
  schema: GraphQLSchema,

  /**
   * A value to pass as the context to the graphql() function.
   */
  context?: mixed,

  /**
   * An object to pass as the rootValue to the graphql() function.
   */
  rootValue?: mixed,

  /**
   * A boolean to configure whether the output should be pretty-printed.
   */
  pretty?: boolean,

  /**
   * An optional function which will be used to format any errors produced by
   * fulfilling a GraphQL operation. If no function is provided, GraphQL's
   * default spec-compliant `formatError` function will be used.
   */
  formatError?: (error: GraphQLError) => mixed,

  /**
   * An optional array of validation rules that will be applied on the document
   * in additional to those defined by the GraphQL spec.
   */
  validationRules?: Array<mixed>,

  /**
   * An optional function for adding additional metadata to the GraphQL response
   * as a key-value object. The result will be added to "extensions" field in
   * the resulting JSON. This is often a useful place to add development time
   * info such as the runtime of a query or the amount of resources consumed.
   *
   * Information about the request is provided to be used.
   *
   * This function may be async.
   */
  extensions?: (info: RequestInfo) => {[key: string]: mixed},

  /**
   * A boolean to optionally enable GraphiQL mode.
   */
  graphiql?: ?boolean,
};

class ResolveData_E extends HttpError {}
class RD_Client_E extends ResolveData_E {}
class RD_Empty_Query extends RD_Client_E {}
class RD_Server_E extends ResolveData_E {}

async function resolveOptions(options: Options, ctx: Context): Promise<OptionsData> {
  // init ....
  const optionsResult: OptionsResult = (typeof options === 'function')
    ? options(ctx.request) : options;
  const optionsData: OptionsData = await optionsResult;
  invariant(optionsData !== null && typeof optionsData === 'object',
    new RD_Server_E( 500,
      'GraphQL middleware option function must return an options ' +
      'object or a promise which will be resolved to an options object.'));

  invariant(!(optionsData.schma), new RD_Server_E( 500,
    'GraphQL middleware options must contain a schema.'
  ));
  return optionsData;
}

type ResolvedResult = {
  data?: {[key: string]: mixed},
  errors?: Array<GraphQLError>,
  extensions?: Object,
};

async function resolveData(optionsData: OptionsData, params: GraphQLParams,
  ctx: Context): Promise<ResolvedResult> {
  // Collect information from the options data object.
  const schema = optionsData.schema;
  const context: Request|mixed = optionsData.context || ctx.request;
  const rootValue = optionsData.rootValue;
  const extensionsFn = optionsData.extensions;
  const validationRules = optionsData.validationRules ?
    specifiedRules.concat(optionsData.validationRules) :
    specifiedRules;

  // begin process data ...
  const { query, variables, operationName} = params;
  invariant( query != null, new RD_Empty_Query(400, 'Must provide query string.'));

  const source = new Source(query, 'GraphQL request');
  let documentAST = null;
  try {
    documentAST = parse(source); // parse do not have a custom error type?
  } catch (e) {
    throw new RD_Client_E(400, e);
  }
  // Validate AST, reporting any errors.
  const validationErrors = validate(schema, documentAST, validationRules);
  invariant(validationErrors.length == 0, // no errors.
    new RD_Client_E(400, validationErrors));

  // Only query operations are allowed on GET requests.
  if (ctx.method === 'GET') {
    // Determine if this GET request will perform a non-query.
    const operationAST = getOperationAST(documentAST, operationName);
    if (operationAST && operationAST.operation !== 'query') {
      // If GraphiQL can be shown, do not perform this query, but
      // provide it to GraphiQL so that the requester may perform it
      // themselves if desired.
    //  if (showGraphiQL) {  return null; }

      // Otherwise, report a 405: Method Not Allowed error.
//      response.setHeader('Allow', 'POST');
      throw new RD_Client_E(
        405,
        `Can only perform a ${operationAST.operation} operation ` +
        'from a POST request.'
      );
    }
  }
  let result: ExecutionResult|null = null;
  try {
    result = await execute(
      schema,
      documentAST,
      rootValue,
      context,
      variables,
      operationName
    );
  } catch ( contextError ) {
    // ToDo: !
    throw new RD_Client_E(400, 'contextError');
  }

  // Collect and apply any metadata extensions if a function was provided.
  // http://facebook.github.io/graphql/#sec-Response-Format
  if ( result && extensionsFn ) {
    try {
      const extensions = await extensionsFn({document: documentAST,
        variables, operationName, result});
      if (extensions && typeof extensions === 'object') {
        result.extensions = extensions;
      }
    } catch ( e ) {
      throw new RD_Server_E(500, e);
    }
  }
  const output: ResolvedResult = {
    data: result.data,
    errors: result.errors,
    extensions: result.extensions,
  };
  return output;

}



type GraphQLParams = {
  query: string | null,
  variables: {[name: string]: mixed} | null,
  operationName: string | null,
  raw: boolean,
};

/**
 * Provided a "Request" provided by express or connect (typically a node style
 * HTTPClientRequest), Promise the GraphQL request parameters.
 */
async function getGraphQLParams(ctx: Context): Promise<GraphQLParams> {
  const bodyData = await parseBody(ctx);
  return parseGraphQLParams(ctx.query, bodyData);
}

/**
 * Helper function to get the GraphQL params from the request.
 */
function parseGraphQLParams(
  urlData: {[param: string]: string},
  bodyData: {[param: string]: mixed}
): GraphQLParams {
  // GraphQL Query string.
  let query = urlData.query || bodyData.query;
  if (typeof query !== 'string') {
    query = null;
  }

  // Parse the variables if needed.
  let variables = urlData.variables || bodyData.variables;
  if (typeof variables === 'string') {
    try {
      variables = JSON.parse(variables);
    } catch (error) {
      throw new RD_Client_E(400, 'Variables are invalid JSON.');
    }
  } else if (typeof variables !== 'object') {
    variables = null;
  }

  // Name of GraphQL operation to execute.
  let operationName = urlData.operationName || bodyData.operationName;
  if (typeof operationName !== 'string') {
    operationName = null;
  }

  const raw = urlData.raw !== undefined || bodyData.raw !== undefined;

  return { query, variables, operationName, raw };
}

export {
  resolveOptions,
  resolveData,
  getGraphQLParams,
  RD_Client_E,
  RD_Server_E,
  RD_Empty_Query,
} ;

export type {
  GraphQLParams,
  Options,
  OptionsData,
} ;
