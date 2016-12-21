/* @flow
 *
 */

// Error
import {
  inspect,
} from 'util';

class ExtendableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(message)).stack;
    }
  }
}

class HttpError extends ExtendableError {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}

class ResolveData_E extends HttpError {}
class RD_Client_E extends ResolveData_E {}
class RD_Empty_Query extends RD_Client_E {}
class RD_Server_E extends ResolveData_E {}

// wrap errors for those libs which does not have a custom Error Type!
// function rethrow<Fuc: Function>(fn: Fuc, error: Error): Fuc {
//   return function warper(...args) {
//     try {
//       return fn(args);
//     } catch (e) {
//       throw error;
//     }
//   };
// }

function eFormat(v: mixed): string {
  return inspect(v,
    { showHidden: true, depth: null });
}

export default function invariant(condition: mixed, message: string|Error) {
  if (!condition) {
    const err = (message instanceof Error) ? message : new Error(message);
    throw err;
  }
}

export {
  eFormat,
  invariant,

  ResolveData_E,
  RD_Client_E,
  RD_Empty_Query,
  RD_Server_E,
};
