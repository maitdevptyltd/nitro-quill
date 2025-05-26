import { describe, it, expect } from 'vitest'
import { parseParams } from '../src/params'

describe('parseParams', () => {
  it('detects placeholders', () => {
    const sql = 'SELECT * FROM t WHERE id = @id AND status = :status'
    const params = parseParams(sql)
    expect(params).toEqual({
      id: { name: 'id' },
      status: { name: 'status' }
    })
  })

  it('parses param directives', () => {
    const sql = `-- @param limit: int = 10\n-- @param offset: int = 0\nSELECT * FROM test WHERE id > 0`
    const params = parseParams(sql)
    expect(params).toEqual({
      limit: { name: 'limit', type: 'int', default: '10' },
      offset: { name: 'offset', type: 'int', default: '0' }
    })
  })

  it('parses declare statements', () => {
    const sql = `DECLARE @foo INT;\nDECLARE @bar VARCHAR(20) = 'baz';\nSELECT 1`
    const params = parseParams(sql)
    expect(params).toEqual({
      foo: { name: 'foo', type: 'int' },
      bar: { name: 'bar', type: 'string', default: "'baz'" }
    })
  })

  it('directive overrides declare', () => {
    const sql = `DECLARE @id INT = 1;\n-- @param id: string\nSELECT 1`
    const params = parseParams(sql)
    expect(params).toEqual({ id: { name: 'id', type: 'string' } })
  })
})
