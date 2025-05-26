export interface ParamMeta {
  name: string
  type?: 'string' | 'int' | 'float' | 'boolean' | 'date'
  default?: string
}

function mapType(t: string): ParamMeta['type'] | undefined {
  const type = t.toLowerCase()
  if (type.includes('int')) return 'int'
  if (type.includes('char') || type.includes('text') || type.includes('string')) return 'string'
  if (type.includes('float') || type.includes('real') || type.includes('decimal') || type.includes('numeric')) return 'float'
  if (type.includes('bit') || type.includes('bool')) return 'boolean'
  if (type.includes('date') || type.includes('time')) return 'date'
  return undefined
}

export interface ParameterParser {
  parse(sql: string): Record<string, ParamMeta>
}

export class DefaultParameterParser implements ParameterParser {
  parse(sql: string): Record<string, ParamMeta> {
    const params: Record<string, ParamMeta> = {}
    const lines = sql.split(/\r?\n/)

    const directiveRe = /^\s*--\s*@param\s+(\w+)(?:\s*:\s*(\w+))?(?:\s*=\s*(.+))?$/i
    for (const line of lines) {
      const m = directiveRe.exec(line)
      if (m) {
        const [, name, typ, def] = m
        params[name] = { name, type: typ ? (typ.toLowerCase() as ParamMeta['type']) : undefined, default: def?.trim() }
      }
    }

    const declareRe = /^\s*DECLARE\s+@(\w+)\s+([^=;]+)(?:\s*=\s*([^;]+))?/i
    for (const line of lines) {
      const m = declareRe.exec(line)
      if (m) {
        const [, name, typ, def] = m
        if (!params[name]) {
          params[name] = { name, type: mapType(typ), default: def?.trim() }
        }
      }
    }

    const noCommentSql = lines.map((l) => l.replace(/--.*$/, '')).join('\n')
    const placeholderRe = /[@:](\w+)/g
    let match: RegExpExecArray | null
    while ((match = placeholderRe.exec(noCommentSql))) {
      const name = match[1]
      if (!params[name]) {
        params[name] = { name }
      }
    }

    return params
  }
}

export function parseParams(sql: string): Record<string, ParamMeta> {
  return new DefaultParameterParser().parse(sql)
}
