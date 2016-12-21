// @flow
import type {
  DocumentNode,
  GraphQLError,
  GraphQLSchema,
} from 'graphql';

import { RD_Server_E, invariant } from './utils/tools.js';
import type { Context, Request } from 'koa';
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

export {
  resolveOptions,
};
export type {
  RequestInfo,
  Options,
  OptionsData,
};
