import { defineNitroPlugin } from 'nitropack'
import mssql from 'mssql'
import connection from 'nitro-quill:options'

declare global {
  // eslint-disable-next-line no-var
  var __nitroQuillPool: mssql.ConnectionPool | undefined
}

export default defineNitroPlugin(async () => {
  if (Object.keys(connection).length) {
    const pool = new mssql.ConnectionPool(connection as any)
    await pool.connect()
    global.__nitroQuillPool = pool
  }
})
