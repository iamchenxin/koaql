// @flow
const Koa = require('koa');
import type {
  Middleware,
  Context,
  Request,
  Response,
  ServerType,
  ApplicationJSON,
  ResponseJSON,
  ResponseInspect,
  SimpleHeader,
  RequestJSON,
  RequestInspect,
} from 'koa';

function test_Application() {
  const app = new Koa();
  const context: Context = app.context;
  //const _context: number = app.context;
  const env: string = app.env;
  const keys: void|Array<string>|Object = app.keys;
  const middleware: Array<Middleware> = app.middleware;
  const name: void|string = app.name;
  const proxy: boolean = app.proxy;
  const request: Request = app.request;
  const response: Response = app.response;
  const server: ServerType = app.server;
  const subdomainOffset: number = app.subdomainOffset;
  const listen: $PropertyType<ServerType, 'listen'> = app.listen;
  const toJSON: () => ApplicationJSON = app.toJSON;
  const inspect: () => ApplicationJSON = app.inspect;
  app.use( (ctx, next) => {
    const ctx1: Context = ctx;
    const next1: () => Promise<void> = next;
    return ;
  });
}

function test_response() {
  declare var response:Response;
  const req: http$IncomingMessage = response.req;
  const res: http$ServerResponse = response.res;
  const ctx: Context = response.ctx;
  const request: Request = response.request;


  const body: string|Buffer|stream$Stream|Object|null = response.body;
  const etag: string = response.etag;
  const header: SimpleHeader = response.header;
  const headers: SimpleHeader = response.headers;
  const headerSent: boolean = response.headerSent;

  const lastModified: Date = response.lastModified;
  const message: string = response.message;
  const socket: net$Socket = response.socket;
  const status: number = response.status;
  const type: string = response.type;
  const writable: boolean = response.writable;

  const length: number|void = response.length;
  const append: (field: string, val: string | string[]) => void = response.append;
  const attachment: (filename?: string) => void = response.attachment;
  const get: (field: string) => string = response.get;
  const mimeType: string = response.is();
  const mimeOrFalse1: string|false = response.is('html');
  const mimeOrFalse2: string|false = response.is(['html']);
  const redirect: (url: string, alt?: string) => void = response.redirect;
  const remove: (field: string) => void = response.remove;
  response.set({
    'Etag': '1234',
    'Last-Modified': 'date',
  });
  response.set('Etag', '1234');
  const vary: (field: string) => void = response.vary;
  const toJSON: () => ResponseJSON = response.toJSON;
  const inspect: () => ResponseInspect = response.inspect;
}

function test_request() {
  declare var request:Request;
  const req: http$IncomingMessage = request.req;
  const res: http$ServerResponse = request.res;
  const ctx: Context = request.ctx;
  const response: Response = request.response;
  const fresh: boolean = request.fresh;
  const header: SimpleHeader = request.header;
  const headers: SimpleHeader = request.headers;
  const host: string = request.host;
  const hostname: string = request.hostname;
  const href: string = request.href;
  const idempotent: boolean = request.idempotent;
  const ip: string = request.ip;
  const ips: string[] = request.ips;
  const method: string = request.method;
  const origin: string = request.origin;
  const originalUrl: string = request.originalUrl;
  const path: string = request.path;
  const protocol: string = request.protocol;
  const query: {[key: string]: string} = request.query;
  const querystring: string = request.querystring;
  const search: string = request.search;
  const secure: boolean = request.secure;
  const socket: net$Socket = request.socket;
  const stale: boolean = request.stale;
  const subdomains: string[] = request.subdomains;
  const type: string = request.type;
  const url: string = request.url;

  const charset: string|void = request.charset;
  const length: number|void = request.length;

  const type_: string[] = request.accepts();
  const typeOrFalse1: string|false = request.accepts('text/html');
  const typeOrFalse2: string|false = request.accepts('json', 'text');
  // ToDo: https://github.com/facebook/flow/issues/3009
  const typeOrFalse3: string|false = request.accepts((['json', 'text']:Array<string>));

  const charsets: string[] = request.acceptsCharsets();
  const charset1: buffer$Encoding|false =
    request.acceptsCharsets('gzip', 'deflate', 'identity');
  // ToDo: https://github.com/facebook/flow/issues/3009
  const charset2: buffer$Encoding|false =
    request.acceptsCharsets((['gzip', 'deflate', 'identity']:Array<string>));

  const languages: string[] = request.acceptsLanguages();
  const language1: string|false = request.acceptsLanguages('es', 'en');
  const language2: string|false = request.acceptsLanguages((['es', 'en']:string[]));

  const get: (field: string) => string = request.get;

  const mimeType: string = request.is();
  const mimeOrFalse1: string|false|null = request.is('html');
  const mimeOrFalse2: string|false|null = request.is(['html']);
  const toJSON: () => RequestJSON = request.toJSON;
  const inspect: () => RequestInspect = request.inspect;
}

/*
 * simple test
 * pick from koa's api docs
 * https://github.com/koajs/koa/blob/v2.x/docs/api/index.md
*/
function test_index_md() {
  const app:Koa = new Koa();
  // $ExpectError
  //const app:number = new Koa();
  app.use((ctx) => {
    ctx.body = 'Hello World';
    // $ExpectError
  //  ctx.body = 1;
  });
  app.listen(3000);
  // $ExpectError
//  app.listen(true);

  function test_cascading() {
    // x-response-time
    app.use(async function(ctx, next) {
      const start = new Date();
      await next();
      const ms = new Date() - start;
      ctx.set('X-Response-Time', `${ms}ms`);
      // ctx.set(ms, `${ms}ms`);
      // ctx.set(`${ms}ms`);
    });

    // logger
    app.use(async function (ctx, next) {
      const start = new Date();
      await next();
      const ms = new Date() - start;
      console.log(`${ctx.method} ${ctx.url} - ${ms}`);
    });

    // response
    app.use(ctx => {
      ctx.body = 'Hello World';
      // $ExpectError
    //  ctx.body = 1;
    });

    app.listen(3000);
    //  app.listen(true);
  }
}
