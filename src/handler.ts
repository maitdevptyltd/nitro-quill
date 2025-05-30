import { defineEventHandler, getQuery, readBody, createError } from 'h3'
import type { ParamMeta } from './params'
import type { AuthMeta } from './auth'
import { createAuthStrategy } from './auth'
import type { QueryExecutor } from './query'
import { getGlobalPool, MssqlQueryExecutor, getGlobalExecutor } from './query'

export interface HandlerSpec {
  sqlFile: string
  sql: string
  countQuery?: string
  params: Record<string, ParamMeta>
  method: 'GET' | 'POST'
  auth: AuthMeta
}

function coerce(type: ParamMeta['type'] | undefined, value: string): any {
  switch (type) {
    case 'int': {
      const n = parseInt(value, 10)
      if (Number.isNaN(n)) throw new Error('Invalid int')
      return n
    }
    case 'float': {
      const n = parseFloat(value)
      if (Number.isNaN(n)) throw new Error('Invalid float')
      return n
    }
    case 'boolean':
      return value === 'true' || value === '1'
    case 'date': {
      const d = new Date(value)
      if (Number.isNaN(d.getTime())) throw new Error('Invalid date')
      return d
    }
    default:
      return value
  }
}

class ParameterResolver {
  constructor(private meta: Record<string, ParamMeta>, private method: 'GET' | 'POST') {}

  async resolve(event: any): Promise<Record<string, any>> {
    const source = this.method === 'GET' ? getQuery(event) : await readBody(event)
    const resolved: Record<string, any> = {}
    for (const [name, meta] of Object.entries(this.meta)) {
      let value: any = (source as any)[name]
      if (Array.isArray(value)) value = value[0]
      if (value === undefined) value = meta.default
      if (value !== undefined) {
        resolved[name] = coerce(meta.type, String(value))
      }
    }
    return resolved
  }
}

export function createHandler(spec: HandlerSpec, executor?: QueryExecutor) {
  const resolver = new ParameterResolver(spec.params, spec.method)
  const authenticator = createAuthStrategy(spec.auth)

  return defineEventHandler(async (event) => {
    const exec =
      executor ||
      getGlobalExecutor() ||
      new MssqlQueryExecutor(getGlobalPool())
    if (event.node.req.method?.toUpperCase() !== spec.method) {
      throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
    }

    await authenticator.check(event)
    const params = await resolver.resolve(event)

    let total: number | undefined
    if (spec.countQuery) {
      const rows = await exec.query(spec.countQuery, params)
      const first = rows[0]
      if (first) {
        const key = Object.keys(first)[0]
        total = first[key]
      }
    }

    const rows = await exec.query(spec.sql, params)

    if (total !== undefined) {
      const offset = typeof params.offset === 'number' ? params.offset : undefined
      const limit = typeof params.limit === 'number' ? params.limit : undefined
      return { meta: { offset, limit, totalCount: total }, rows }
    }
    return { rows }
  })
}
