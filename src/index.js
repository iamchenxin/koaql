// @flow

import type { Context, Middleware } from 'koa';
import { resolveOptions, resolveData, getGraphQLParams,
  RD_Client_E} from './resolveData.js';
import { formatError } from 'graphql';
import { renderGraphiQL } from './renderGraphiQL';
import type { Options, OptionsData } from './resolveData.js';
import type { ExecutionResult } from 'graphql';

function qlServer(options: Options): Middleware {

  return async function middleware(ctx: Context, next: () => Promise<void>): Promise<void> {
    let output: ExecutionResult = {};
    let optionsData: OptionsData|null = null;
    let params = null;
    try {
      optionsData = await resolveOptions(options, ctx);
      params = await getGraphQLParams(ctx);
      const result = await resolveData(optionsData, params, ctx);
      output = {
        data: result.data,
        errors: result.errors,
        extensions: result.extensions,
      };
    } catch (e) {
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

    const payload = JSON.stringify(output, null, options.pretty ? 2 : 0);
    ctx.set('Content-Type', 'application/json; charset=utf-8');
    ctx.body = payload;
  };

}

function iqlServer(options: Options): Middleware {

  return async function middleware(ctx: Context, next: () => Promise<void>): Promise<void> {
    let output: ExecutionResult = {};
    let optionsData = null;
    let params = null;
    try {
      optionsData = await resolveOptions(options, ctx);
      params = await getGraphQLParams(ctx);
      try {
        const result = await resolveData(optionsData, params, ctx);
        output = {
          data: result.data,
          errors: result.errors,
          extensions: result.extensions,
        };
      } catch (e) {
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

    } catch (e) {
      const formatErrorFn = (optionsData && optionsData.formatError != null) ?
        optionsData.formatError : formatError;
      output.errors = [formatErrorFn(e)];
    }
    let query = null;
    let variables = null;
    let operationName = null;
    if (params) {
      query = params.query;
      variables = params.variables;
      operationName = params.operationName;
    }
    const payload = renderGraphiQL({
      query: query,
      variables: variables,
      operationName:operationName,
      result:output,
    });
    ctx.set('Content-Type', 'text/html; charset=utf-8');
    ctx.body = payload;
  };

}

export {
  qlServer,
  iqlServer,
};
