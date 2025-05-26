import { describe, it, expect } from 'vitest'
import path from 'path'
import fs from 'fs'
import os from 'os'
import nitroQuill from '../src/module'
import { pathToFileURL } from 'url'

async function loadModule(code: string, file: string) {
  fs.writeFileSync(file, code)
  return await import(pathToFileURL(file).href)
}

describe('generated handler', () => {
  it('exposes query params', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'quill-'))
    fs.mkdirSync(path.join(tmp, 'api'))
    fs.writeFileSync(path.join(tmp, 'api', 'test.sql'), '-- @param foo: string = bar\nSELECT 1')

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

    const id = Object.keys(nitro.options.virtual)[0]
    const code = (nitro.options.virtual as any)[id]
    const mod = await loadModule(code, path.join(tmp, 'handler.mjs'))
    const handler = mod.default

    const res = await handler({ path: '/?foo=baz', context: {} } as any)
    expect(res.params).toEqual({ foo: 'baz' })
  })
})
