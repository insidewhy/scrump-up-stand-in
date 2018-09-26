import * as Koa from 'koa'
import * as bodyParser from 'koa-bodyparser'
import * as Router from 'koa-router'
import axios from 'axios'

const shuffle = require('lodash.shuffle')
const port = process.env.API_PORT || 4000

const accessToken = process.env.ACCESS_TOKEN
if (!accessToken) {
  console.warn('must set ACCESS_TOKEN')
  process.exit(1)
}

export default () => {
  const app = new Koa()
  const router = getRouter(app)

  app.use(bodyParser())
  app.use(router.routes())
  app.use(router.allowedMethods())

  app.listen(port)
  console.log('started server on port', port)
}

const getRouter = (app: Koa): Router => {
  const router = new Router()

  router.post('/standup', async (ctxt, next) => {
    const body = ctxt.request.body as any
    // console.log('got body %j', body)

    const resp = await axios.get('https://slack.com/api/conversations.members', {
      params: {
        token: accessToken,
        channel: body.channel_id,
      },
    })

    const members = resp.data && resp.data.members
    if (!members || !Array.isArray(members)) {
      console.warn('could not get members %j', resp.data)
      ctxt.body = {
        response_type: 'in_channel',
        text: 'Could not get members',
      }
      return
    }

    // console.log('got members %j', members)
    ctxt.body = {
      response_type: 'in_channel',
      text: 'slack list man: ' + shuffle(members.map(id => `<@${id}>`)).join(', '),
    }
  })

  return router
}
