/// <reference path="../node_modules/myna-parser/myna.ts" />
"use strict";

// tslint:disable-next-line: max-func-body-length
export function celSpecGrammar(myna: any): any {
  const m = myna;
  // Override parenthesis function to not use `.guardedSeq`
  // This sequence is too assertive, and may cause exceptions rather than just returning null
  m.parenthesized = (rule: any) => {
    return m.seq("(", m.ws, rule, m.ws, ")").setType("parenthesized");
  }

  // tslint:disable-next-line: typedef
  // tslint:disable-next-line: max-func-body-length
  const grammar = new function () {
    // https://github.com/google/cel-spec/blob/master/tests/simple/testdata/basic.textproto
    // .self_eval_zeroish
    this.int64 = m.seq(
      m.opt('-'),
      m.digits,
      m.notAtChar('eu.'), // Does not advance parser
    ).ast
    // .self_eval_uint_zero
    this.uint64 = m.seq(m.digits, 'u').ast
    this.double = m.choice(
      // -2.3e+1
      // -2e-3
      m.seq(m.opt('-'), m.digits.oneOrMore, m.opt(m.seq(m.char('.'), m.digits.oneOrMore)), m.char('e'), m.char('+-'), m.digits.oneOrMore),
      // -2.3
      // 2.0
      m.seq(m.opt('-'), m.digits.oneOrMore, m.char('.'), m.digits.oneOrMore),
    ).ast
    
    const character = m.choice(
      m.letters,
      m.digits,
      m.char('+-!\\[]()'),
      m.char('ÿ')
    )
    this.string = m.choice(
      m.seq(`'`, character.zeroOrMore, m.seq(`'`)),
      m.seq(`"`, character.zeroOrMore, m.seq(`"`))
    ).ast
    this.rawString = m.choice(
      m.seq(`r'`, character.zeroOrMore, m.seq(`'`)),
      m.seq(`r"`, character.zeroOrMore, m.seq(`"`))
    ).ast
    this.byteString = m.choice(
      m.seq(`b'`, character.zeroOrMore, m.seq(`'`)),
      m.seq(`b"`, character.zeroOrMore, m.seq(`"`))
    ).ast
    this.boolean = m.choice(
      'false', 'true'
    ).ast
    this.null = m.choice('null', 'NULL').ast
    
    const primitive = m.choice(
      this.int64,
      this.string,
      this.uint64,
      this.double,
      this.boolean,
    )
    this.list = m.seq(
      '[',
      primitive.zeroOrMore,
      ']'
    ).ast

    const entry = m.seq(
      this.string,
      ':',
      primitive,
      m.opt(',')
    )
    this.map = m.seq(
      '{',
      entry.zeroOrMore,
      '}'
    ).ast

    this.variable = m.seq(m.letterLower.oneOrMore).ast

    this.expr = m.choice(
      this.int64,
      this.uint64,
      this.double,
      this.string,
      this.rawString,
      this.byteString,
      this.boolean,
      this.null,
      this.list,
      this.map,
      this.variable
    ).oneOrMore
  }

  // Register the grammar, providing a name and the default parse rule
  return m.registerGrammar("cel-spec", grammar, grammar.expr);
}
