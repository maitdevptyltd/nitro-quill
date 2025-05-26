import { describe, it, expect } from 'vitest'
import { parseSql } from '../src/parser'

const sample = `-- @auth bearer foo,bar
-- @method POST
-- @param limit: int = 10
-- @countQuery
SELECT COUNT(*) FROM t;
SELECT * FROM t;`

describe('parseSql', () => {
  const parsed = parseSql(sample)
  it('parses directives', () => {
    expect(parsed.method).toBe('POST')
    expect(parsed.auth).toEqual({ bearer: ['foo', 'bar'] })
    expect(parsed.countQuery).toBe('SELECT COUNT(*) FROM t;')
    expect(parsed.sql).toBe('SELECT * FROM t;')
  })
})
