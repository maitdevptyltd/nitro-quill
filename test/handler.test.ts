import { describe, it, expect, beforeEach } from 'vitest'
import { createHandler } from '../src/handler'
import type { HandlerSpec } from '../src/handler'
import { createEvent } from 'h3'
import { IncomingMessage, ServerResponse } from 'node:http'
import { PassThrough } from 'node:stream'

const mockPool = {
  request() {
    return {
      input() {},
      async query(sql: string) {
        if (sql.includes('COUNT')) return { recordset: [{ total: 5 }] }
        return { recordset: [{ ok: true }] }
      }
    }
  }
}

declare global {
  var __nitroQuillPool: any
}

beforeEach(() => {
  global.__nitroQuillPool = mockPool as any
})

describe('createHandler', () => {
  it('executes sql and returns rows', async () => {
    const spec: HandlerSpec = {
      sqlFile: 'test.sql',
      sql: 'SELECT 1;',
      params: { id: { name: 'id', type: 'int' } },
      method: 'GET',
      auth: 'anon'
    }
    const handler = createHandler(spec)
    const req = new IncomingMessage(new PassThrough() as any)
    req.url = '/?id=7'
    req.method = 'GET'
    const res = new ServerResponse(req)
    const event = createEvent(req, res)
    const result = await handler(event)
    expect(result).toEqual({ rows: [{ ok: true }] })
  })

  it('includes meta when countQuery present', async () => {
    const spec: HandlerSpec = {
      sqlFile: 'test.sql',
      sql: 'SELECT 1;',
      countQuery: 'SELECT COUNT(*) as total FROM x;',
      params: { offset: { name: 'offset', type: 'int', default: '0' } },
      method: 'GET',
      auth: 'anon'
    }
    const handler = createHandler(spec)
    const req = new IncomingMessage(new PassThrough() as any)
    req.url = '/'
    req.method = 'GET'
    const res = new ServerResponse(req)
    const event = createEvent(req, res)
    const result = await handler(event)
    expect(result).toEqual({ meta: { offset: 0, limit: undefined, totalCount: 5 }, rows: [{ ok: true }] })
  })
})
