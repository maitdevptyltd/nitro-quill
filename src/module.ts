import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { promises as fsp } from 'fs'
import camelCase from 'camelcase'
import { globby } from 'globby'
import type { Nitro } from 'nitropack'
export { parseParams } from './params'
export { parseSql } from './parser'
import { parseSql, ParsedSql } from './parser'

export interface NitroQuillOptions {
  /** Directory containing SQL files relative to project root. Default: `api` */
  directory?: string
  /** Optional MSSQL connection options passed to handlers at runtime */
  connection?: Record<string, unknown>
}

/**
 * Nitro plugin that scans a directory for `.sql` files and registers basic
 * API routes. Real SQL execution is left for future implementation.
 */
export default function nitroQuill(nitro: Nitro, options: NitroQuillOptions = {}) {
  const scanDir = options.directory || 'api'

  nitro.options.virtual = nitro.options.virtual || {}
  nitro.options.handlers = nitro.options.handlers || []
  nitro.options.plugins = nitro.options.plugins || []
  nitro.options.virtual['nitro-quill:options'] = `export default ${JSON.stringify(options.connection || {})}`
  const dir = typeof __dirname !== 'undefined'
    ? __dirname
    : dirname(fileURLToPath(import.meta.url))
  nitro.options.plugins.push(join(dir, 'runtime'))

  nitro.hooks.hook('build:before', async () => {
    const base = join(nitro.options.rootDir, scanDir)
    const files = await globby('**/*.sql', { cwd: base })

    for (const file of files) {
      const routeName = file.replace(/\.sql$/, '')
      const segments = routeName.split(/[\\/]/).map((s) => camelCase(s))
      const routePath = '/' + [scanDir, ...segments].join('/')

      const handlerId = `nitro-quill:${file}`.replace(/[\\/]/g, '-')
      const virtualPath = `${handlerId}.ts`

      const fullPath = join(base, file)
      const sql = await fsp.readFile(fullPath, 'utf8')
      const meta = parseSql(sql)
      nitro.options.virtual![virtualPath] = createHandler({
        sqlFile: fullPath,
        ...meta
      })
      nitro.options.handlers.push({
        route: routePath,
        method: meta.method.toLowerCase(),
        handler: virtualPath
      })
    }
  })
}

function createHandler(meta: ParsedSql & { sqlFile: string }): string {
  const dir = typeof __dirname !== 'undefined'
    ? __dirname
    : dirname(fileURLToPath(import.meta.url))
  const handlerPath = join(dir, 'handler').replace(/\\/g, '/')
  return `import { createHandler } from '${handlerPath}'
export default createHandler(${JSON.stringify(meta)})
`
}
