A bit like [express-graphql](https://github.com/graphql/express-graphql), but separated `qlServer` and `iqlServer`, Makes the code flow more clear.

Simple usage:
```
import {qlServer, iqlServer} from 'graphql-koa';
import koa from 'koa';
const router = require('koa-router')();
import {StarWarsSchema} from './starWarsSchema.js';
const APP_PORT = 3001;
const app = new koa();

const ql = qlServer({schema: StarWarsSchema});
const iql = iqlServer({schema: StarWarsSchema});
router.get('/', ql)
.post('/', ql)
.post('/iql', ql)
.get('/iql', iql);
app.use(router.routes());
app.listen(APP_PORT);
```

A full example is in `./src/example`.
