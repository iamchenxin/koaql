// @flow
import type { Context } from 'koa';
import zlib from 'zlib';
// import { invariant } from './tools.js';
const querystring = require('querystring');

const allowed_type: Array<string> = ['application/graphql',
  'application/json', 'application/x-www-form-urlencoded'];
const allowed_charsets = ['utf-8'];

function parseBody(ctx: Context): Promise<{[key: string]: mixed}> {
  return new Promise(async (resolve, reject) => {
    if ( ctx.req.body != null ) {

    }
    const type = ctx.accepts( allowed_type );
    if ( type === false) {
      throw new Error(`wrong header type. ${ctx.header['Content-Type']}`);
    }
    const encoding = ctx.acceptsCharsets(allowed_charsets);
    if (encoding === false ) {
      throw new Error('un encoding');
    }

    const body = decompressBody(ctx);
    const buf = await getRawBody(body);
    const content = buf.toString(encoding);

    switch ( type ) {
      case 'application/graphql':
        return resolve({ query: content});
      case 'application/json':
        return resolve(JSON.parse(content));
      case 'application/x-www-form-urlencoded':
        return resolve(querystring.parse(content));
      default:
        reject(`should not be here. ${ctx.header['Content-Type']}`);
    }
    return undefined;
  });
}

function decompressBody(ctx: Context): stream$Readable {
  // Get content-encoding (e.g. gzip)
  const contentEncoding = ctx.headers['content-encoding'];
  const encoding = typeof contentEncoding === 'string' ?
    contentEncoding.toLowerCase() :
    'identity';
  switch ( encoding ) {
    case 'gzip':
      return ctx.req.pipe( zlib.createUnzip());
    case 'deflate':
      return ctx.req.pipe( zlib.createInflate());
    case 'identity':
      return ctx.req;
  }
  throw new Error(
    `Unsupported content-encoding "${ctx.header['Content-Encoding']}".`);
}

function getRawBody(req: stream$Readable): Promise<Buffer> {
  return new Promise(function(resolve, reject) {
    const buffs = [];
    req.on('data', trunk => {
      buffs.push(trunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(buffs));
    });
    req.on('error', reject);
  });
}

export {
  parseBody,
};
