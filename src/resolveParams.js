// @flow

import { RD_Client_E } from './utils/tools.js';
import { parseBody } from './utils/parseBody';
import type { Context } from 'koa';

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
  getGraphQLParams,
};

export type {
  GraphQLParams,
};
