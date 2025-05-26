import { DefaultParameterParser, ParameterParser, ParamMeta } from './params'
import type { AuthMeta } from './auth'

export interface ParsedSql {
  params: Record<string, ParamMeta>
  method: 'GET' | 'POST'
  auth: AuthMeta
  sql: string
  countQuery?: string
}

export interface SqlParser {
  parse(content: string): ParsedSql
}

export class DefaultSqlParser implements SqlParser {
  constructor(private paramParser: ParameterParser = new DefaultParameterParser()) {}

  parse(content: string): ParsedSql {
    const params = this.paramParser.parse(content)
    let method: ParsedSql['method'] = 'GET'
    let auth: AuthMeta = 'anon'

    const lines = content.split(/\r?\n/)
    const mainLines: string[] = []
    const countLines: string[] = []
    let inCount = false

    for (const line of lines) {
      const trimmed = line.trim()
      const directive = /^--\s*@([a-zA-Z]+)\s*(.*)$/i.exec(trimmed)
      if (directive) {
        const [, name, rest] = directive
        switch (name.toLowerCase()) {
          case 'method':
            method = rest.trim().toUpperCase() === 'POST' ? 'POST' : 'GET'
            continue
          case 'auth': {
            const arg = rest.trim()
            if (arg.toLowerCase().startsWith('basic')) {
              auth = 'basic'
            } else if (arg.toLowerCase().startsWith('bearer')) {
              const tokens = arg.slice(6).split(',').map((t) => t.trim()).filter(Boolean)
              auth = { bearer: tokens }
            } else {
              auth = 'anon'
            }
            continue
          }
          case 'countquery':
            inCount = true
            continue
          case 'param':
            continue
        }
      }

      if (inCount) {
        countLines.push(line)
        if (line.includes(';')) {
          inCount = false
        }
        continue
      }

      if (/^\s*DECLARE\b/i.test(line)) {
        continue
      }

      mainLines.push(line)
    }

    const sql = firstStatement(mainLines.join('\n'))
    const countQuery = countLines.length ? firstStatement(countLines.join('\n')) : undefined

    return { params, method, auth, sql, countQuery }
  }
}

export function parseSql(content: string): ParsedSql {
  return new DefaultSqlParser().parse(content)
}

function firstStatement(sql: string): string {
  const idx = sql.indexOf(';')
  return idx === -1 ? sql.trim() : sql.slice(0, idx + 1).trim()
}
