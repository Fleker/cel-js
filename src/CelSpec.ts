import { Parser } from './Interfaces';
import { CelSpecParser } from "./CelSpecParser";
import { CelSpecOptions } from "./CelSpecOptions";

let sharedParser: Parser;

export class CelSpec {

  private parser: Parser;

  private readonly defaults: CelSpecOptions = {};

  constructor(private options?: CelSpecOptions) {
      this.options = options ? {
        ... this.defaults,
        ... options
      } : this.defaults;
  }

  get Parser(): Parser {
    if (!this.parser) {
      if (!sharedParser) {
        sharedParser = new CelSpecParser();
      }
      this.parser = sharedParser;
    }

    return this.parser;
  }

  public toText(speechmarkdown: string, options?: CelSpecOptions): string {
    return this.Parser.parse(speechmarkdown);
  }

  public toSSML(speechmarkdown: string, options?: CelSpecOptions): string {
    return this.Parser.parse(speechmarkdown);
  }

  public toAST(speechmarkdown: string, options?: CelSpecOptions): any {
    return this.Parser.parse(speechmarkdown);
  }

  public toASTString(speechmarkdown: string, options?: CelSpecOptions): string {
    const ast = this.Parser.parse(speechmarkdown);
    return ast.toString();
  }
}
