import mssql from 'mssql'
import type { DatabaseSync } from 'node:sqlite'

export interface QueryExecutor {
  query(sql: string, params: Record<string, any>): Promise<any[]>
}

export class MssqlQueryExecutor implements QueryExecutor {
  constructor(private pool: mssql.ConnectionPool) {}

  async query(sql: string, params: Record<string, any>): Promise<any[]> {
    const request = this.pool.request()
    for (const [name, value] of Object.entries(params)) {
      request.input(name, value as any)
    }
    const result = await request.query(sql)
    return result.recordset || []
  }
}

export class SqliteQueryExecutor implements QueryExecutor {
  constructor(private db: DatabaseSync) {}

  async query(sql: string, params: Record<string, any>): Promise<any[]> {
    const stmt = this.db.prepare(sql)
    return stmt.all(params as any) as any[]
  }
}

export function getGlobalPool(): mssql.ConnectionPool {
  const pool = (global as any).__nitroQuillPool as mssql.ConnectionPool
  if (!pool) throw new Error('MSSQL pool not configured')
  return pool
}

export function getGlobalExecutor(): QueryExecutor | undefined {
  return (global as any).__nitroQuillExecutor as QueryExecutor | undefined
}
