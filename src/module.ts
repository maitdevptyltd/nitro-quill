import { join } from 'path'
import camelCase from 'camelcase'
import globby from 'globby'
import type { Nitro } from 'nitropack'

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
  return `import { defineEventHandler } from 'h3'
import { promises as fsp } from 'fs'
export default defineEventHandler(async () => {
  // TODO: parse directives and execute SQL against MSSQL
  // placeholder simply returns the SQL file path
  return { ok: true, file: ${JSON.stringify(sqlFile)} }
})`
}
