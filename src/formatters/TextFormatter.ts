import { CelSpecOptions } from '../CelSpecOptions';
import { FormatterBase } from './FormatterBase';
import { NULL_VALUE } from '..';

type Compare = '==' | '!=' | '>' | '>=' | '<' | '<='

const evaluateComparison = (comp1: any, op: Compare, comp2: any): boolean => {
  switch (op) {
    case '==': return comp1 === comp2
    case '!=': return comp1 !== comp2
    case '>':  return comp1 > comp2
    case '>=': return comp1 >= comp2
    case '<':  return comp1 < comp2
    case '<=': return comp1 <= comp2
    default: return false
  }
}

const deepArrayEvaluateComparison = (comp1: any, op: Compare, comp2: any): boolean => {
  if (op === '<' || op === '<=' || op === '>' || op === '>=') {
    // Can't deep compare w/ ops
    throw new Error(`{ message: "no such overload" }`)
  }
  const vals1 = comp1.values
  const vals2 = comp2.values
  if (!vals1 || !vals2) {
    const empty1 = !vals1 || vals1.length === 0
    const empty2 = !vals2 || vals2.length === 0
    return op === '==' ? empty1 === empty2 : empty1 !== empty2
  }
  if (vals1.length !== vals2.length) {
    return op === '!='
  }
  return evaluateComparison(
    JSON.stringify(comp1),
    op,
    JSON.stringify(comp2)
  )
}

const deepObjEvaluateComparison = (comp1: any, op: Compare, comp2: any): boolean => {
  if (op === '<' || op === '<=' || op === '>' || op === '>=') {
    // Can't deep compare w/ ops
    throw new Error(`{ message: "no such overload" }`)
  }
  const entries1 = comp1.entries
  const entries2 = comp2.entries
  if (!entries1 || !entries2) {
    const empty1 = !entries1 || (Array.isArray(entries1) && entries1.length === 0)
    const empty2 = !entries2 || (Array.isArray(entries2) && entries2.length === 0)
    return op === '==' ? empty1 === empty2 : empty1 !== empty2
  }
  if (Array.isArray(entries1) && Array.isArray(entries2) && entries1.length !== entries2.length) {
    return op === '!='
  }
  // Convert our CEL object into a traditional map
  const map1: any = {}
  if (Array.isArray(entries1)) {
    for (let i = 0, len = entries1.length; i < len; i++) {
      const entry = entries1[i]
      map1[entry.key.string_value] = entry.value.string_value
    }
  } else {
    map1[entries1.key.string_value] = entries1.value.string_value
  }

  const map2: any = {}
  if (Array.isArray(entries2)) {
    for (let i = 0, len = entries2.length; i < len; i++) {
      const entry = entries2[i]
      map2[entry.key.string_value] = entry.value.string_value
    }
  } else {
    map2[entries2.key.string_value] = entries2.value.string_value
  }

  // Turn objects (and arrays) into Entry arrays
  // so that we can then sort the data
  // before stringifying them, to resolve order issues
  return evaluateComparison(
    JSON.stringify(Object.entries(map1).sort()),
    op,
    JSON.stringify(Object.entries(map2).sort())
  )
}

export class TextFormatter extends FormatterBase {
  bindings: any = {}

  constructor(protected options: CelSpecOptions, bindings: any) {
    super(options);
    this.bindings = bindings
  }

  public format(ast: any): any[] {
    const lines = this.formatFromAst(ast, []);

    if (lines.length === 0) {
      return undefined
    }
    if (lines.length === 1) {
      return lines[0]
    }
    return lines;
  }

  // tslint:disable-next-line: max-func-body-length
  protected formatFromAst(ast: any, lines: any[] = []): any[] {
    switch (ast.name) {
      case 'document': {
        this.processAst(ast.children, lines);
        return lines;
      }
      case 'int64': {
        lines.push({
          int64_value: parseInt(ast.allText, 10)
        })
        return lines
      }
      case 'uint64': {
        lines.push({
          uint64_value: parseInt(ast.allText, 10)
        })
        return lines
      }
      case 'double': {
        lines.push({
          double_value: parseFloat(ast.allText)
        })
        return lines
      }
      case 'string': {
        const strVal = ast.input !== undefined
          ? ast.input.slice(ast.start + 1, ast.end - 1)
          : ast.allText.substring(1, ast.allText.length - 1)
        lines.push({
          string_value: strVal
        })
        return lines
      }
      case 'rawString': {
        const rawVal = ast.input !== undefined
          ? ast.input.slice(ast.start + 2, ast.end - 1)
          : ast.allText.substring(2, ast.allText.length - 1)
        lines.push({
          string_value: rawVal
        })
        return lines
      }
      case 'byteString': {
        const byteStr = (ast.input !== undefined
          ? ast.input.slice(ast.start + 2, ast.end - 1)
          : ast.allText.substring(2, ast.allText.length - 1)) as string
        // If the values are already in octal, why convert?
        if (byteStr.charAt(0) === '\\') {
          const octsArr = byteStr.split('\\')
          const bytesArr = []
          for (let i = 1; i < octsArr.length; i++) {
            const oct = octsArr[i]
            if (oct.charAt(0) === 'x') {
              // Hex > Octal
              bytesArr.push('\\' + parseInt(`0${oct}`, 16).toString(8))
            } else {
              bytesArr.push('\\' + oct)
            }
          }
          lines.push({
            bytes_value: bytesArr.join('')
          })
          return lines
        }
        // Turn each character into an octal
        const bytesArr = []
        for (let i = 0; i < byteStr.length; i++) {
          bytesArr.push('\\' + byteStr.charCodeAt(i).toString(8))
        }
        lines.push({
          bytes_value: bytesArr.join('')
        })
        return lines
      }
      case 'boolean': {
        lines.push({
          bool_value: ast.allText === 'true'
        })
        return lines
      }
      case 'null': {
        lines.push({
          null_value: NULL_VALUE
        })
        return lines
      }
      case 'list': {
        const sublines: any[] = []
        this.processAst(ast.children, sublines);
        if (sublines.length >= 1) {
          lines.push({
            list_value: {
              values: sublines
            }
          })
          return lines
        }
        lines.push({
          list_value: {}
        })
        return lines
      }
      case 'map': {
        const sublines: any[] = []
        this.processAst(ast.children, sublines);
        if (sublines.length >= 2) {
          const entries = []
          // Iterate through processed elements in pairs
          for (let i = 0; i < sublines.length; i += 2) {
            entries.push({
              key: sublines[i],
              value: sublines[i + 1]
            })
          }

          lines.push({
            map_value: { entries }
          })
          return lines
        }

        lines.push({
          map_value: {}
        })
        return lines
      }
      case 'variable': {
        // Perform variable lookup from our mapping
        const varName = ast.allText
        const boundVal = this.bindings[varName]
        if (!boundVal) {
          if (this.options && this.options.allowMissingVariables) {
            lines.push({ null_value: NULL_VALUE })
            return lines
          }
          throw new Error(`{ message: "undeclared reference to '${varName}' (in container '')" }`)
        }
        lines.push(boundVal)
        return lines
      }
      case 'comparisonInt64': 
      case 'comparisonUint64': {
        // This should include three children
        // [int64, comparable, int64]
        const sublines: any[] = []
        this.formatFromAst(ast.children[0], sublines)
        this.formatFromAst(ast.children[2], sublines)
        const left = sublines[0]
        const right = sublines[1]
        const int1 = left.int64_value !== undefined ? left.int64_value : left.uint64_value
        const int2 = right.int64_value !== undefined ? right.int64_value : right.uint64_value
        lines.push({
          bool_value: evaluateComparison(
            int1,
            ast.children[1].allText,
            int2
          )
        })
        return lines
      }
      case 'comparisonDouble': {
        const sublines: any[] = []
        this.formatFromAst(ast.children[0], sublines)
        this.formatFromAst(ast.children[2], sublines)
        lines.push({
          bool_value: evaluateComparison(
            sublines[0].double_value,
            ast.children[1].allText,
            sublines[1].double_value
          )
        })
        return lines
      }
      case 'comparisonString': {
        const sublines: any[] = []
        this.formatFromAst(ast.children[0], sublines)
        this.formatFromAst(ast.children[2], sublines)
        lines.push({
          bool_value: evaluateComparison(
            sublines[0].string_value,
            ast.children[1].allText,
            sublines[1].string_value
          )
        })
        return lines
      }
      case 'comparisonByteString': {
        const sublines: any[] = []
        this.formatFromAst(ast.children[0], sublines)
        this.formatFromAst(ast.children[2], sublines)
        lines.push({
          bool_value: evaluateComparison(
            sublines[0].bytes_value,
            ast.children[1].allText,
            sublines[1].bytes_value
          )
        })
        return lines
      }
      case 'comparisonBoolean': {
        const sublines: any[] = []
        this.formatFromAst(ast.children[0], sublines)
        this.formatFromAst(ast.children[2], sublines)
        lines.push({
          bool_value: evaluateComparison(
            sublines[0].bool_value,
            ast.children[1].allText,
            sublines[1].bool_value
          )
        })
        return lines
      }
      case 'comparisonNull': {
        const op = ast.children[1].allText as Compare
        if (op !== '==' && op !== '!=') {
          throw new Error(`{ message: "no such overload" }`)
        }
        const sublines: any[] = []
        this.formatFromAst(ast.children[0], sublines)
        this.formatFromAst(ast.children[2], sublines)
        lines.push({
          bool_value: evaluateComparison(
            sublines[0].null_value,
            op,
            sublines[1].null_value
          )
        })
        return lines
      }
      case 'deepCompareObj': {
        const sublines: any[] = []
        this.formatFromAst(ast.children[0], sublines)
        this.formatFromAst(ast.children[2], sublines)
        if (sublines[0].list_value) {
          // List eval
          lines.push({
            bool_value: deepArrayEvaluateComparison(
              sublines[0].list_value,
              ast.children[1].allText,
              sublines[1].list_value
            )
          })
          return lines
        }

        // Object eval
        lines.push({
          bool_value: deepObjEvaluateComparison(
            sublines[0].map_value,
            ast.children[1].allText,
            sublines[1].map_value
          )
        })
        return lines
      }
      case 'elementInObj': {
        const sublines: any[] = []
        this.processAst(ast.children, sublines)
        const elem = sublines[0]
        const container = sublines[1]
        const key = elem.string_value !== undefined
          ? 'string_value'
          : elem.int64_value !== undefined
          ? 'int64_value'
          : elem.uint64_value !== undefined
          ? 'uint64_value'
          : elem.double_value !== undefined
          ? 'double_value'
          : 'bool_value'
        const value = elem[key]
        if (container.list_value) {
          const values = container.list_value.values
          let found = false
          if (values) {
            for (let i = 0, len = values.length; i < len; i++) {
              if (values[i][key] === value) {
                found = true
                break
              }
            }
          }
          lines.push({
            bool_value: found
          })
          return lines
        }

        // Is a map
        const entries = container.map_value.entries
        let found = false
        if (entries) {
          for (let i = 0, len = entries.length; i < len; i++) {
            if (entries[i].key.string_value === value) {
              found = true
              break
            }
          }
        }
        lines.push({
          bool_value: found
        })
        return lines
      }
      case 'sizeOfObj': {
        const sublines: any[] = []
        this.processAst(ast.children, sublines)
        if (sublines[0].list_value) {
          // List length
          const values = sublines[0].list_value.values
          lines.push({
            int64_value: values ? values.length : 0
          })
          return lines
        }

        // Is a map
        const entries = sublines[0].map_value.entries
        lines.push({
          int64_value: entries ? entries.length : 0
        })
        return lines
      }
      case 'indexOfObj': {
        const sublines: any[] = []
        this.processAst(ast.children, sublines)
        const [array, index] = sublines
        if (array.list_value.values.length <= index.int64_value) {
          throw new Error('{ message: "invalid_argument" }')
        }

        lines.push( array.list_value.values[index.int64_value] )
        return lines
      }
      case 'concatObj': {
        const sublines: any[] = []
        this.processAst(ast.children, sublines)
        const [arrayLeft, arrayRight] = sublines
        const values = []
        if (arrayLeft.list_value.values) {
          values.push(...arrayLeft.list_value.values)
        }
        if (arrayRight.list_value.values) {
          values.push(...arrayRight.list_value.values)
        }

        if (values.length === 0) {
          lines.push({
            list_value: {}
          })
          return lines
        }

        lines.push({
          list_value: {
            values
          }
        })
        return lines
      }
      case 'ternary': {
        const sublines: any[] = []
        this.formatFromAst(ast.children[0], sublines)
        const cond = sublines[0]
        this.formatFromAst(cond.bool_value ? ast.children[1] : ast.children[2], lines)
        return lines
      }
      case 'logicalAnd': {
        const children = ast.children
        const sublines: any[] = []
        let booleanMerge = true
        for (let i = 0, len = children.length; i < len; i++) {
          const prevLen = sublines.length
          this.formatFromAst(children[i], sublines)
          for (let j = prevLen; j < sublines.length; j++) {
            const val = sublines[j]
            const truthy = val && val.bool_value !== undefined
              ? val.bool_value
              : (val && val.null_value !== undefined ? false : Boolean(val))
            if (!truthy) {
              booleanMerge = false
              break
            }
          }
          if (!booleanMerge) {
            break
          }
        }

        lines.push({
          bool_value: booleanMerge
        })
        return lines
      }
      case 'logicalOr': {
        const children = ast.children
        const sublines: any[] = []
        let booleanMerge = false
        for (let i = 0, len = children.length; i < len; i++) {
          const prevLen = sublines.length
          this.formatFromAst(children[i], sublines)
          for (let j = prevLen; j < sublines.length; j++) {
            const val = sublines[j]
            const truthy = val && val.bool_value !== undefined
              ? val.bool_value
              : (val && val.null_value !== undefined ? false : Boolean(val))
            if (truthy) {
              booleanMerge = true
              break
            }
          }
          if (booleanMerge) {
            break
          }
        }

        lines.push({
          bool_value: booleanMerge
        })
        return lines
      }
      case 'parenthesized': {
        this.processAst(ast.children, lines)
        return lines
      }
      case 'logicalNot': {
        const sublines: any[] = []
        this.processAst(ast.children, sublines)
        const [condition] = sublines
        if (!('bool_value' in condition)) {
          throw new Error('{ message: "no matching overload" }')
        }

        lines.push({
          bool_value: !condition.bool_value
        })
        return lines
      }
      case 'ternaryTypeMismatch':
      case 'comparisonTypeMismatch': {
        throw new Error(`{ message: "no such overload" }`)
      }
      default: {
        this.processAst(ast.children, lines);
        return lines;
      }
    }
  }
}
