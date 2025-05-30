import { defineNitroPlugin } from 'nitropack/runtime'
import mssql from 'mssql'
import { DatabaseSync } from 'node:sqlite'
import connection from 'nitro-quill:options'
import { SqliteQueryExecutor } from '../query'

declare global {
  // eslint-disable-next-line no-var
  var __nitroQuillPool: mssql.ConnectionPool | undefined
  // eslint-disable-next-line no-var
  var __nitroQuillExecutor: SqliteQueryExecutor | undefined
}

export default defineNitroPlugin(async () => {
  if ((connection as any).driver === 'sqlite') {
    const db = new DatabaseSync((connection as any).filename || ':memory:')
    global.__nitroQuillExecutor = new SqliteQueryExecutor(db)
  } else if (Object.keys(connection).length) {
    const pool = new mssql.ConnectionPool(connection as any)
    await pool.connect()
    global.__nitroQuillPool = pool
  }
})
