// @flow

import {qlServer, iqlServer} from '../index.js';

import {StarWarsSchema} from './starWarsSchema.js';
import koa from 'koa';
const router = require('koa-router')();
const APP_PORT = 3001;
//const GRAPHQL_PORT = 8080;

const app = new koa();

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

async function ts() {
  const ql = qlServer({schema: StarWarsSchema});
  const iql = iqlServer({schema: StarWarsSchema});
  router.get('/', ql)
  .post('/', ql)
  .post('/iql', ql)
  .get('/iql', iql);
  app.use(router.routes());
  app.listen(APP_PORT);
}

ts().catch(e => {
  console.log(e);
});


/*
query{
  rebels{
    id
    name
    ships(after: "",first: 6) {
      pageInfo{
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      edges{
        cursor
        node{
          name
        }
      }
    }
  }
}

mutation($in: IntroduceShipInput!){
  introduceShip(input: $in){
    ship{
      id
      name
    },
    faction{
      id
      name
      ships{
        edges{
          node{
            id
            name
          }
        }
      }
    }
  }
}

*/
