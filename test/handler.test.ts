import { describe, it, expect } from 'vitest'
import { createHandler } from '../src/handler'
import { createEvent } from 'h3'
import { IncomingMessage, ServerResponse } from 'node:http'
import { PassThrough } from 'node:stream'

describe('createHandler', () => {
  it('returns parsed query params with defaults', async () => {
    const handler = createHandler('file.sql', {
      id: { name: 'id' },
      limit: { name: 'limit', type: 'int', default: '10' }
    })
    const req = new IncomingMessage(new PassThrough() as any)
    req.url = '/?id=7'
    const res = new ServerResponse(req)
    const event = createEvent(req, res)
    const result = await handler(event)
    expect(result).toEqual({ file: 'file.sql', params: { id: '7', limit: '10' } })
  })
})
