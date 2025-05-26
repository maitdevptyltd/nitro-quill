import { describe, it, expect } from 'vitest'
import { createAuthStrategy } from '../src/auth'

const event: any = { context: {}, node: { req: { headers: {} } } }

describe('auth strategies', () => {
  it('allows anon', async () => {
    const strat = createAuthStrategy('anon')
    await expect(strat.check(event)).resolves.toBeUndefined()
  })

  it('checks basic', async () => {
    const strat = createAuthStrategy('basic')
    await expect(strat.check(event)).rejects.toBeTruthy()
    event.context.session = {}
    await expect(strat.check(event)).resolves.toBeUndefined()
  })

  it('checks bearer', async () => {
    const strat = createAuthStrategy({ bearer: ['foo'] })
    await expect(strat.check(event)).rejects.toBeTruthy()
    event.node.req.headers.authorization = 'Bearer foo'
    await expect(strat.check(event)).resolves.toBeUndefined()
  })
})
