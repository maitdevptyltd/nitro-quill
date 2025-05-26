import { join } from 'path'
import camelCase from 'camelcase'
import { globby } from 'globby'
import { readFileSync } from 'fs'
import { parseParams } from './params'
import type { Nitro } from 'nitropack'

export { parseParams } from './params'

export interface NitroQuillOptions {
  /** Directory containing SQL files relative to project root. Default: `api` */
  directory?: string
}

/**
 * Nitro plugin that scans a directory for `.sql` files and registers basic
 * API routes. Real SQL execution is left for future implementation.
 */
export default function nitroQuill(nitro: Nitro, options: NitroQuillOptions = {}) {
  const scanDir = options.directory || 'api'

  nitro.hooks.hook('nitro:build:before', async () => {
    const base = join(nitro.options.rootDir, scanDir)
    const files = await globby('**/*.sql', { cwd: base })

    nitro.options.virtual = nitro.options.virtual || {}
    nitro.options.handlers = nitro.options.handlers || []

    for (const file of files) {
      const routeName = file.replace(/\.sql$/, '')
      const segments = routeName.split(/[\\/]/).map((s) => camelCase(s))
      const routePath = '/' + [scanDir, ...segments].join('/')

      const handlerId = `nitro-quill:${file}`.replace(/[\\/]/g, '-')
      const virtualPath = `${handlerId}.ts`
      nitro.options.virtual![virtualPath] = createHandler(join(base, file))
      nitro.options.handlers.push({
        route: routePath,
        method: 'get',
        handler: virtualPath
      })
    }
  })
}

function createHandler(sqlFile: string): string {
  const sql = readFileSync(sqlFile, 'utf8')
  const meta = parseParams(sql)
  const metaJson = JSON.stringify(meta)
  return `import { defineEventHandler, getQuery } from 'h3'
export default defineEventHandler((event) => {
  const query = getQuery(event)
  const meta = ${metaJson}
  const params = {}
  for (const name in meta) {
    if (query[name] !== undefined) {
      const v = Array.isArray(query[name]) ? query[name][0] : query[name]
      params[name] = v
    } else if (meta[name].default !== undefined) {
      params[name] = meta[name].default
    }
  }
  return { file: ${JSON.stringify(sqlFile)}, params }
})`
}
