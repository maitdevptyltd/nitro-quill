import { join } from 'path'
import { promises as fsp } from 'fs'
import camelCase from 'camelcase'
import { globby } from 'globby'
import type { Nitro } from 'nitropack'
export { parseParams } from './params'
import { parseParams } from './params'

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

      const fullPath = join(base, file)
      const sql = await fsp.readFile(fullPath, 'utf8')
      const params = parseParams(sql)
      nitro.options.virtual![virtualPath] = createHandler(fullPath, params)
      nitro.options.handlers.push({
        route: routePath,
        method: 'get',
        handler: virtualPath
      })
    }
  })
}

function createHandler(sqlFile: string, params: Record<string, unknown>): string {
  return `import { createHandler } from 'nitro-quill/handler'
export default createHandler(${JSON.stringify(sqlFile)}, ${JSON.stringify(params)})
`
}
