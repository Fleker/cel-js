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

    this.variable = m.seq(
      m.letterLower.oneOrMore,
      m.seq(
        m.letterUpper,
        m.letterLower.zeroOrMore,
      ).zeroOrMore,
      m.digits.zeroOrMore
    ).ast
    
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
      primitive,
      ':',
      m.opt(m.space),
      primitive,
      m.opt(','),
      m.opt(m.space)
    )
    this.map = m.seq(
      '{',
      entry.zeroOrMore,
      '}'
    ).ast

    this.comparable = m.choice(
      '==',
      '!=',
      '>=',
      '<=',
      '>',
      '<',
    ).ast

    this.sizeOfObj = m.seq(
      'size(',
      m.choice(this.list, this.map, this.variable),
      ')'
    ).ast

    this.comparisonInt64 = m.choice(
      // x < 123
      m.seq(
        m.choice(this.int64, this.sizeOfObj, this.variable),
        m.opt(m.space),
        this.comparable,
        m.opt(m.space),
        m.choice(this.int64, this.sizeOfObj)
      ),
      // 123 > x
      m.seq(
        m.choice(this.int64, this.sizeOfObj),
        m.opt(m.space),
        this.comparable,
        m.opt(m.space),
        m.choice(this.int64, this.variable)
      )
    ).ast

    this.comparisonUint64 = m.choice(
      m.seq(
        m.choice(this.uint64, this.variable),
        m.opt(m.space),
        this.comparable,
        m.opt(m.space),
        this.uint64
      ),
      m.seq(
        this.uint64,
        m.opt(m.space),
        this.comparable,
        m.opt(m.space),
        m.choice(this.uint64, this.variable)
      )
    ).ast

    this.comparisonDouble = m.choice(
      m.seq(
        m.choice(this.double, this.variable),
        m.opt(m.space),
        this.comparable,
        m.opt(m.space),
        this.double
      ),
      m.seq(
        this.double,
        m.opt(m.space),
        this.comparable,
        m.opt(m.space),
        m.choice(this.double, this.variable)
      )
    ).ast

    this.comparisonString = m.choice(
      m.seq(
        m.choice(this.string, this.rawString, this.variable),
        m.opt(m.space),
        this.comparable,
        m.opt(m.space),
        m.choice(this.string, this.rawString)
      ),
      m.seq(
        m.choice(this.string, this.rawString),
        m.opt(m.space),
        this.comparable,
        m.opt(m.space),
        m.choice(this.string, this.rawString, this.variable)
      )
    ).ast

    this.comparisonByteString = m.choice(
      // x < b'\x00'
      m.seq(
        m.choice(this.byteString, this.variable),
        m.opt(m.space),
        this.comparable,
        m.opt(m.space),
        this.byteString
      ),
      // b'\x00' > x
      m.seq(
        this.byteString,
        m.opt(m.space),
        this.comparable,
        m.opt(m.space),
        m.choice(this.byteString, this.variable)
      )
    ).ast
    
    this.comparisonBoolean = m.choice(
      m.seq(
        m.choice(this.boolean, this.variable),
        m.opt(m.space),
        this.comparable,
        m.opt(m.space),
        this.boolean
      ),
      m.seq(
        this.boolean,
        m.opt(m.space),
        this.comparable,
        m.opt(m.space),
        m.choice(this.boolean, this.variable)
      )
    ).ast

    this.comparisonNull = m.choice(
      m.seq(
        m.choice(this.null, this.variable),
        m.opt(m.space),
        this.comparable,
        m.opt(m.space),
        this.null
      ),
      m.seq(
        this.null,
        m.opt(m.space),
        this.comparable,
        m.opt(m.space),
        m.choice(this.null, this.variable)
      )
    ).ast

    // This will catch primitive comparisons not matched above
    this.comparisonTypeMismatch = m.seq(
      primitive,
      m.opt(m.space),
      this.comparable,
      m.opt(m.space),
      primitive
    ).ast

    this.elementInObj = m.seq(
      primitive,
      m.space,
      'in',
      m.space,
      m.choice(this.list, this.map, this.variable)
    ).ast

    this.indexOfObj = m.seq(
      m.choice(this.list, this.variable),
      '[',
      this.int64,
      ']'
    ).ast

    this.concatObj = m.seq(
      this.list,
      m.opt(m.space),
      '+',
      m.opt(m.space),
      this.list
    ).ast

    this.deepCompareObj = m.choice(
      m.seq(
        m.choice(this.map, this.concatObj, this.list, this.variable),
        m.opt(m.space),
        this.comparable,
        m.opt(m.space),
        m.choice(this.map, this.concatObj, this.list),
      ),
      m.seq(
        m.choice(this.map, this.concatObj, this.list),
        m.opt(m.space),
        this.comparable,
        m.opt(m.space),
        m.choice(this.map, this.concatObj, this.list, this.variable),
      )
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
      // Collections
      this.elementInObj,
      this.sizeOfObj,
      this.indexOfObj,
      this.concatObj,
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
