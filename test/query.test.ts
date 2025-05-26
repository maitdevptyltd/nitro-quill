import { describe, it, expect } from 'vitest'
import { MssqlQueryExecutor } from '../src/query'

const mockPool = {
  request() {
    return {
      inputs: {} as Record<string, any>,
      input(name: string, value: any) {
        this.inputs[name] = value
      },
      async query(sql: string) {
        return { recordset: [{ sql, ...this.inputs }] }
      }
    }
  }
} as any

describe('MssqlQueryExecutor', () => {
  it('passes parameters', async () => {
    const exec = new MssqlQueryExecutor(mockPool)
    const rows = await exec.query('SELECT 1', { a: 1 })
    expect(rows[0]).toEqual({ sql: 'SELECT 1', a: 1 })
  })
})
