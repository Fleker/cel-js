import { Formatter } from '../Interfaces';
import { CelSpecOptions } from '../CelSpecOptions';

export abstract class FormatterBase implements Formatter {

  protected constructor(protected options: CelSpecOptions) {
    this.options = options;
  }

  public abstract format(ast: any): any[];

  // Adds each element of the array as markdown
  protected addArray(ast: any, lines: string[]): string[] {
    for (const child of ast) {
      this.formatFromAst(child, lines);
    }
    return lines;
  }

  protected processAst(ast: any, lines: string[]): void {
    if (ast instanceof Array) {
      this.addArray(ast, lines);
    } else {
      this.formatFromAst(ast, lines);
    }
  }

  protected abstract formatFromAst(ast: any, lines: string[]): string[];
}
