import { defineEventHandler, getQuery } from 'h3'
import type { ParamMeta } from './params'

export function createHandler(sqlFile: string, params: Record<string, ParamMeta>) {
  return defineEventHandler(async (event) => {
    const query = getQuery(event)
    const resolved: Record<string, string> = {}
    for (const [name, meta] of Object.entries(params)) {
      let value = query[name]
      if (Array.isArray(value)) {
        value = value[0]
      }
      if (value !== undefined) {
        resolved[name] = String(value)
      } else if (meta.default !== undefined) {
        resolved[name] = meta.default
      }
    }
    return { file: sqlFile, params: resolved }
  })
}
