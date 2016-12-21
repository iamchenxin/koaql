// @flow

import type { Context, Middleware } from 'koa';
import { resolveData } from './resolveData.js';
import { resolveOptions } from './resolveOptions.js';
import { getGraphQLParams } from './resolveParams.js';
import { RD_Client_E, RD_Empty_Query } from './utils/tools.js';
import { formatError } from 'graphql';
import { renderGraphiQL } from './renderGraphiQL';

import type { Options, OptionsData } from './resolveOptions.js';
import type { ExecutionResult } from 'graphql';


function qlServer(options: Options): Middleware {

  return middleware;

  async function middleware(ctx: Context, next: () => Promise<void>): Promise<void> {
    await next();
    // init ...
    let output: ExecutionResult = {};
    let optionsData: OptionsData|null = null;
    let params = null;
    try {
    // logic ...
      optionsData = await resolveOptions(options, ctx);
      params = await getGraphQLParams(ctx);
      const result = await resolveData(optionsData, params, ctx);
      output = result;
    } catch (e) {
    // error process ...
      const formatErrorFn = (optionsData && optionsData.formatError != null) ?
        optionsData.formatError : formatError;
      if ( e instanceof RD_Client_E) {
        ctx.status = e.code;
        output.errors = [formatErrorFn(e)];
      } else { // server error ..
        ctx.status = 500;
        output.errors = ['internal server error.'];
        console.log(formatErrorFn(e));
      }
    }
    // send to client
    const payload = JSON.stringify(output, null, options.pretty ? 2 : 0);
    ctx.set('Content-Type', 'application/json; charset=utf-8');
    ctx.body = payload;
    return;
  }
}

function iqlServer(options: Options): Middleware {

  return middleware;

  async function middleware(ctx: Context, next: () => Promise<void>): Promise<void> {
    await next();
    let output: ExecutionResult = {};
    let optionsData = null;
    let params = null;
    try {
    // logic ... it is as the same as qlServer, but
      optionsData = await resolveOptions(options, ctx);
      params = await getGraphQLParams(ctx);
      const result = await resolveData(optionsData, params, ctx);
      output = result;
    } catch (e) {
    // has a little different in error process ...
      const formatErrorFn = (optionsData && optionsData.formatError != null) ?
        optionsData.formatError : formatError;
      if ( e instanceof RD_Client_E) {
        // here, a empty query is not a error in iql server
        // it returns a empty result for empty query.
        if ( e instanceof RD_Empty_Query ) {
          output = {
            data: {}, // not a error, so do not set errors field.
          };
        } else {
          ctx.status = e.code;
          output.errors = [formatErrorFn(e)];
        }
      } else { // server error ..
        ctx.status = 500;
        output.errors = ['internal server error.'];
        console.log(formatErrorFn(e));
      }
    }

    const payload = renderGraphiQL({
      query: params ? params.query : null,
      variables: params ? params.variables : null,
      operationName:params ? params.operationName : null,
      result:output,
    });
    ctx.set('Content-Type', 'text/html; charset=utf-8');
    ctx.body = payload;
    return;

  }
}

export {
  qlServer,
  iqlServer,
};
