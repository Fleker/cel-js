import { CelSpecOptions } from '../CelSpecOptions';
import { FormatterBase } from './FormatterBase';
import { NULL_VALUE } from '..';

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
        if (sublines.length) {
          // Does not work for >1 item
          lines.push({
            list_value: {
              values: sublines[0]
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
        if (sublines.length) {
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
      default: {
        // console.log('Default', ast)
        // Check for condition int64
        // if (ast.input == parseInt(ast.input)) {
        //   if (ast.input.length == 
        //       parseInt(ast.input).toString().length) {
        //     lines.push({
        //       int64_value: parseInt(ast.input)
        //     })
        //     return lines
        //   }
        // }
        this.processAst(ast.children, lines);
        return lines;
      }
    }
  }
}
