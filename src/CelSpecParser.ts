import { Myna } from 'myna-parser';
import { Parser } from './Interfaces';
import { celSpecGrammar } from './CelSpecGrammar';

export class CelSpecParser implements Parser {
  private parser: any;
  private myna: any;

  constructor() {
    this.myna = Myna;
    celSpecGrammar(this.myna)
    this.parser = this.myna.parsers['cel-spec'];
  }

  public parse(speechmarkdown: string): any {
    // if (speechmarkdown.length ==÷)
// tslint:disable-next-line: no-unnecessary-local-variable
    return this.parser(speechmarkdown);
  }
}
