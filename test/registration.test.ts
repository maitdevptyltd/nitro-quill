import { describe, it, expect } from 'vitest'
import path from 'path'
import fs from 'fs'
import os from 'os'
import nitroQuill from '../src/module'

describe('nitro-quill', () => {
  it('registers routes for SQL files', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'quill-'))
    fs.mkdirSync(path.join(tmp, 'api'))
    fs.writeFileSync(path.join(tmp, 'api', 'get_users.sql'), 'SELECT 1;')
    fs.mkdirSync(path.join(tmp, 'api', 'admin'))
    fs.writeFileSync(path.join(tmp, 'api', 'admin', 'get_admin.sql'), 'SELECT 1;')

    const nitro: any = {
      options: { rootDir: tmp, virtual: {}, handlers: [] },
      hooks: {
        cb: undefined as any,
        hook(event: string, fn: Function) {
          if (event === 'nitro:build:before') this.cb = fn
        }
      }
    }

    nitroQuill(nitro, {})
    await nitro.hooks.cb()

    expect(nitro.options.handlers.length).toBe(2)
    const routes = nitro.options.handlers.map((h: any) => h.route).sort()
    expect(routes).toEqual(['/api/admin/getAdmin', '/api/getUsers'])
  })
})
