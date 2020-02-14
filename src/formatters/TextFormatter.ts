import { CelSpecOptions } from '../CelSpecOptions';
import { FormatterBase } from './FormatterBase';
import { NULL_VALUE } from '..';

type Compare = '==' | '!=' | '>' | '>=' | '<' | '<='

const evaluateComparison = (comp1: any, op: Compare, comp2: any) => {
  if (op === '==') return comp1 === comp2
  if (op === '!=') return comp1 !== comp2
  if (op === '>')  return comp1 > comp2
  if (op === '>=') return comp1 >= comp2
  if (op === '<')  return comp1 < comp2
  if (op === '<=') return comp1 <= comp2
}

const deepArrayEvaluateComparison = (comp1: any[], op: Compare, comp2: any[]) => {
  if (op === '<' || op === '<=' || op === '>' || op === '>=') {
    // Can't deep compare w/ ops
    throw new Error(`{ message: "no such overload" }`)
  }
  return evaluateComparison(
    JSON.stringify(comp1),
    op,
    JSON.stringify(comp2)
  )
}

const deepObjEvaluateComparison = (comp1: any, op: Compare, comp2: any) => {
  if (op === '<' || op === '<=' || op === '>' || op === '>=') {
    // Can't deep compare w/ ops
    throw new Error(`{ message: "no such overload" }`)
  }
  // Convert our CEL object into a traditional map
  let map1 = {}
  if (Array.isArray(comp1.entries)) {
    comp1.entries.forEach(entry => {
      map1[entry.key.string_value] = entry.value.string_value
    })
  } else if (comp1.entries) {
    map1[comp1.entries.key.string_value] =
      comp1.entries.value.string_value
  }

  let map2 = {}
  if (Array.isArray(comp2.entries)) {
    comp2.entries.forEach(entry => {
      map2[entry.key.string_value] = entry.value.string_value
    })
  } else if (comp2.entries) {
    map2[comp2.entries.key.string_value] =
      comp2.entries.value.string_value
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
  bindings = {}

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

  protected formatFromAst(ast: any, lines: any[] = []): any[] {
    // console.log('AST', ast)
    switch (ast.name) {
      case 'document': {
        this.processAst(ast.children, lines);
        return lines;
      }
      case 'int64': {
        lines.push({
          int64_value: parseInt(ast.allText)
        })
        return lines
      }
      case 'uint64': {
        lines.push({
          uint64_value: parseInt(ast.allText)
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
        // console.log('str', ast.input, ast.allText)
        lines.push({
          string_value: new String(ast.allText.substring(1, ast.allText.length - 1)).valueOf()
        })
        return lines
      }
      case 'rawString': {
        lines.push({
          string_value: ast.allText.substring(2, ast.allText.length - 1)
        })
        return lines
      }
      case 'byteString': {
        const byteStr = ast.allText.substring(2, ast.allText.length - 1) as string
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
        const sublines = []
        this.processAst(ast.children, sublines);
        if (sublines.length === 1) {
          lines.push({
            list_value: {
              values: sublines[0]
            }
          })
          return lines
        }
        if (sublines.length > 1) {
          lines.push({
            list_value: {
              values: [...sublines]
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
        const sublines = []
        this.processAst(ast.children, sublines);
        if (sublines.length === 2) {
          // Does not work for >1 entry
          lines.push({
            map_value: {
              entries: {
                key: sublines[0],
                value: sublines[1]
              }
            }
          })
          return lines
        }
        if (sublines.length > 2) {
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
        if (!this.bindings[ast.allText]) {
          throw new Error(`{ message: "undeclared reference to '${ast.allText}' (in container '')" }`)
        }
        lines.push(this.bindings[ast.allText])
        return lines
      }
      case 'comparisonInt64': 
      case 'comparisonUint64': {
        // This should include three children
        // [int64, comparable, int64]
        const sublines = []
        // console.log(ast.children)
        this.processAst(ast.children, sublines)
        // console.log(sublines)
        const int1 = (() => {
          if ('int64_value' in sublines[0]) {
            return sublines[0].int64_value
          }
          if ('uint64_value' in sublines[0]) {
            return sublines[0].uint64_value
          }
          return undefined
        })()
        const int2 = (() => {
          if ('int64_value' in sublines[1]) {
            return sublines[1].int64_value
          }
          if ('uint64_value' in sublines[1]) {
            return sublines[1].uint64_value
          }
          return undefined
        })()
        lines.push({
          boolean_value: evaluateComparison(
            int1,
            ast.children[1].allText,
            int2
          )
        })
        return lines
      }
      case 'comparisonDouble': {
        const sublines = []
        this.processAst(ast.children, sublines)
        lines.push({
          boolean_value: evaluateComparison(
            sublines[0].double_value,
            ast.children[1].allText,
            sublines[1].double_value
          )
        })
        return lines
      }
      case 'comparisonString': {
        const sublines = []
        this.processAst(ast.children, sublines)
        lines.push({
          boolean_value: evaluateComparison(
            sublines[0].string_value,
            ast.children[1].allText,
            sublines[1].string_value
          )
        })
        return lines
      }
      case 'comparisonByteString': {
        const sublines = []
        this.processAst(ast.children, sublines)
        lines.push({
          boolean_value: evaluateComparison(
            sublines[0].bytes_value,
            ast.children[1].allText,
            sublines[1].bytes_value
          )
        })
        return lines
      }
      case 'comparisonBoolean': {
        const sublines = []
        this.processAst(ast.children, sublines)
        lines.push({
          boolean_value: evaluateComparison(
            sublines[0].bool_value,
            ast.children[1].allText,
            sublines[1].bool_value
          )
        })
        return lines
      }
      case 'comparisonNull': {
        if (ast.children[1].allText !== '==' &&
            ast.children[1].allText !== '!=') {
          throw new Error(`{ message: "no such overload" }`)
        }
        const sublines = []
        this.processAst(ast.children, sublines)
        lines.push({
          boolean_value: evaluateComparison(
            sublines[0].null_value,
            ast.children[1].allText,
            sublines[1].null_value
          )
        })
        return lines
      }
      case 'deepCompareObj': {
        const sublines = []
        this.processAst(ast.children, sublines)
        if (sublines[0].list_value) {
          // List eval
          lines.push({
            boolean_value: deepArrayEvaluateComparison(
              sublines[0].list_value,
              ast.children[1].allText,
              sublines[1].list_value
            )
          })
          return lines
        }

        // Object eval
        lines.push({
          boolean_value: deepObjEvaluateComparison(
            sublines[0].map_value,
            ast.children[1].allText,
            sublines[1].map_value
          )
        })
        return lines
      }
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
