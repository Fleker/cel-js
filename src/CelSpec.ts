import { Parser } from './Interfaces';
import { CelSpecParser } from "./CelSpecParser";
import { CelSpecOptions } from "./CelSpecOptions";

export class CelSpec {

  private parser: Parser;

  private readonly defaults: CelSpecOptions = {};

  constructor(private options?: CelSpecOptions) {
      this.options = {
        ... this.defaults,
        ... options
      };
  }

  get Parser(): Parser {
    if (!this.parser) {
      this.parser = new CelSpecParser();
    }

    return this.parser;
  }

  public toText(speechmarkdown: string, options?: CelSpecOptions): string {
    const methodOptions = {
      ... this.options,
      ... options
    };

    const ast = this.Parser.parse(speechmarkdown);
    // const formatter = factory.createTextFormatter(methodOptions);

    return ast
  }

  public toSSML(speechmarkdown: string, options?: CelSpecOptions): string {
    const methodOptions = {
      ... this.options,
      ... options
    };

    const ast = this.Parser.parse(speechmarkdown);
    // console.log(`AST: ${ast}`);
    // const formatter = factory.createFormatter(methodOptions);

    return ast
  }

  public toAST(speechmarkdown: string, options?: CelSpecOptions): any {
    return this.Parser.parse(speechmarkdown);
  }

  public toASTString(speechmarkdown: string, options?: CelSpecOptions): string {
    const ast = this.Parser.parse(speechmarkdown);
    return ast.toString();
  }
}
