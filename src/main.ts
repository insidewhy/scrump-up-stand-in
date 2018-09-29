import * as Koa from 'koa'
import * as bodyParser from 'koa-bodyparser'
import * as Router from 'koa-router'
import * as Redis from 'ioredis'
import axios from 'axios'

const shuffle = require('lodash.shuffle')
const port = 9500

const redis = new Redis({ host: 'redis', password: process.env.REDIS_PASSWORD })
redis.addListener('connect', () => {
  console.debug('connected to redis')
})

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

const bodyToHashKey = ({ team_id, channel_id }: any, suffix: string) =>
  `${team_id}:${channel_id}:${suffix}`

const startStandup = async (body: any) => {
  const resp = await axios.get('https://slack.com/api/conversations.members', {
    params: {
      token: accessToken,
      channel: body.channel_id,
    },
  })

  const members = resp.data && resp.data.members
  if (!members || !Array.isArray(members)) {
    console.warn('could not get members %j', resp.data)
    return {
      response_type: 'in_channel',
      text: 'Could not get members',
    }
  }

  const excludeKey = bodyToHashKey(body, 'excluded')
  const excludesArray = await redis.smembers(excludeKey)
  const excludes = new Set(excludesArray)
  const includedMembers = members.filter(member => !excludes.has(member))

  // console.log('got members %j', members, includedMembers)
  return {
    response_type: 'in_channel',
    text:
      shuffle(includedMembers.map(id => `<@${id}>`)).join(' ') +
      ' Good morning cats, for your voot you must scrum.',
  }
}

const parseHandles = (text: string) => {
  const re = /<@([A-Z0-9]+)(?:\|[^>]+)>?/g
  const matches = []
  for (;;) {
    const match = re.exec(text)
    if (!match) break
    matches.push(match[1])
  }

  return matches
}

const excludeCmd = 'exclude '
const includeCmd = 'include '

const switchInclusion = async (body: any, include: boolean) => {
  const { text } = body
  const handles = parseHandles(text.substr(include ? includeCmd.length : excludeCmd.length))
  if (!handles) return 'Problem parsing handles'
  const { team_id, channel_id } = body
  const hashKey = bodyToHashKey(body, 'excluded')
  const nChanges = await (include ? redis.srem(hashKey, handles) : redis.sadd(hashKey, handles))
  return {
    response_type: 'in_channel',
    text: `${nChanges} new users ${include ? 'included' : 'excluded'}`,
  }
}

const interpretCommand = async (body: any) => {
  const { text } = body
  if (text.startsWith(excludeCmd)) {
    return switchInclusion(body, false)
  } else if (text.startsWith(includeCmd)) {
    return switchInclusion(body, true)
  } else {
    return "Unknown command, try 'include' or 'exclude'"
  }
}

const getRouter = (app: Koa): Router => {
  const router = new Router()

  router.post('/standup', async (ctxt, next) => {
    const body = ctxt.request.body as any
    // console.log('got body %j', body)
    const { text } = body
    if (text) {
      ctxt.body = await interpretCommand(body)
    } else {
      ctxt.body = await startStandup(body)
    }
  })

  return router
}
