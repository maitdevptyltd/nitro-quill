import mssql from 'mssql'

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

export function getGlobalPool(): mssql.ConnectionPool {
  const pool = (global as any).__nitroQuillPool as mssql.ConnectionPool
  if (!pool) throw new Error('MSSQL pool not configured')
  return pool
}
