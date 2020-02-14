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
      // .99
      m.seq(m.opt('-'), m.digits.zeroOrMore, m.char('.'), m.digits.oneOrMore),
    ).ast
    
    const character = m.choice(
      m.letters,
      m.digits,
      m.char('+-!\\[]()'),
      m.char('áàéίασςιδοτÿ'),
      m.char('\x00\x01'),
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
    const primitiveArray = m.seq(
      primitive, m.opt(','), m.opt(m.space)
    )
    this.list = m.seq(
      '[',
      primitiveArray.zeroOrMore,
      ']'
    ).ast

    const entry = m.seq(
      m.choice(this.string, this.int64),
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

    this.comparable = m.choice(
      '==',
      '!=',
      '>=',
      '<=',
      '>',
      '<',
    ).ast

    this.comparisonInt64 = m.seq(
      this.int64,
      m.opt(m.space),
      this.comparable,
      m.opt(m.space),
      this.int64
    ).ast

    this.comparisonUint64 = m.seq(
      this.uint64,
      m.opt(m.space),
      this.comparable,
      m.opt(m.space),
      this.uint64
    ).ast

    this.comparisonDouble = m.seq(
      this.double,
      m.opt(m.space),
      this.comparable,
      m.opt(m.space),
      this.double
    ).ast

    this.comparisonString = m.seq(
      m.choice(this.string, this.rawString),
      m.opt(m.space),
      this.comparable,
      m.opt(m.space),
      m.choice(this.string, this.rawString)
    ).ast

    this.comparisonByteString = m.seq(
      this.byteString,
      m.opt(m.space),
      this.comparable,
      m.opt(m.space),
      this.byteString
    ).ast

    this.comparisonBoolean = m.seq(
      this.boolean,
      m.opt(m.space),
      this.comparable,
      m.opt(m.space),
      this.boolean
    ).ast

    this.comparisonNull = m.seq(
      this.null,
      m.opt(m.space),
      this.comparable,
      m.opt(m.space),
      this.null
    ).ast

    this.deepCompareObj = m.seq(
      m.choice(this.list, this.map),
      m.opt(m.space),
      this.comparable,
      m.opt(m.space),
      m.choice(this.list, this.map),
    ).ast

    this.comparisonTypeMismatch = m.seq(
      primitive,
      m.opt(m.space),
      this.comparable,
      m.opt(m.space),
      primitive
    ).ast

    this.expr = m.choice(
      // Groups
      this.comparisonInt64,
      this.comparisonUint64,
      this.comparisonDouble,
      this.comparisonString,
      this.comparisonByteString,
      this.comparisonBoolean,
      this.comparisonNull,
      this.deepCompareObj,
      this.comparisonTypeMismatch, // Catch rest
      // Individuals
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
      this.variable,
      this.comparable,
    ).oneOrMore
  }

  // Register the grammar, providing a name and the default parse rule
  return m.registerGrammar("cel-spec", grammar, grammar.expr);
}
