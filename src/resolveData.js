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

import type { GraphQLError } from 'graphql';
import type { Context, Request } from 'koa';
import { RD_Client_E, RD_Empty_Query, RD_Server_E,
  invariant } from './utils/tools.js';
import type { OptionsData } from './resolveOptions.js';
import type { GraphQLParams } from './resolveParams.js';

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


export {
  resolveData,
} ;

export type {
  ResolvedResult,
};
