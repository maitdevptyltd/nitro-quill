import { createError, getRequestHeaders } from 'h3'

export type AuthMeta = 'anon' | 'basic' | { bearer: string[] }

export interface AuthStrategy {
  check(event: any): Promise<void>
}

export class AnonAuthStrategy implements AuthStrategy {
  async check(): Promise<void> {}
}

export class BasicAuthStrategy implements AuthStrategy {
  async check(event: any): Promise<void> {
    if (!event.context?.session) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
  }
}

export class BearerAuthStrategy implements AuthStrategy {
  constructor(private tokens: string[]) {}

  async check(event: any): Promise<void> {
    const header = getRequestHeaders(event)['authorization'] || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : undefined
    if (!token || !this.tokens.includes(token)) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
  }
}

export function createAuthStrategy(meta: AuthMeta): AuthStrategy {
  if (meta === 'anon') return new AnonAuthStrategy()
  if (meta === 'basic') return new BasicAuthStrategy()
  return new BearerAuthStrategy(meta.bearer)
}
