import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { promises as fsp } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { DatabaseSync } from 'node:sqlite'
import { createNitro, createDevServer, prepare, build } from 'nitropack/core'
import nitroQuill from '../src/module'

let server: ReturnType<typeof createDevServer>
let url: string
let closed = false
const originalClose = DatabaseSync.prototype.close

const setupModule = (dbPath: string) => ({
  async setup(nitro: any) {
    await nitroQuill(nitro, { connection: { driver: 'sqlite', filename: dbPath } })
  }
})

describe('integration with nitro runtime', () => {
  beforeAll(async () => {
    DatabaseSync.prototype.close = function(this: any, ...args: any[]) {
      closed = true
      return originalClose.apply(this, args)
    }
    const root = await fsp.mkdtemp(join(tmpdir(), 'quill-'))
    const apiDir = join(root, 'api')
    await fsp.mkdir(apiDir)
    await fsp.writeFile(join(apiDir, 'listUsers.sql'), 'SELECT * FROM users ORDER BY id;')

    const dbPath = join(root, 'db.sqlite')
    const db = new DatabaseSync(dbPath)
    db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);')
    db.exec("INSERT INTO users (name) VALUES ('Alice'), ('Bob');")
    db.close()

    const nitro = await createNitro({
      rootDir: root,
      dev: true,
      preset: 'nitro-dev',
      modules: [setupModule(dbPath)]
    })
    await prepare(nitro)
    await build(nitro)
    server = createDevServer(nitro)
    const listener = await server.listen(0, { isTest: true })
    url = listener.url
  })

  afterAll(async () => {
    if (server) {
      await server.close()
    }
    DatabaseSync.prototype.close = originalClose
  })

  it('returns rows from sqlite', async () => {
    const res = await fetch(url + '/api/api/listUsers')
    const json = await res.json()
    expect(json).toEqual({ rows: [ { id: 1, name: 'Alice' }, { id: 2, name: 'Bob' } ] })
  })

  it('closes sqlite connection on shutdown', async () => {
    await server.close()
    expect(closed).toBe(true)
    // prevent afterAll from closing again
    server = undefined as any
  })
})
