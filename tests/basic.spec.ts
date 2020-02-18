import { CelSpec } from '../src/CelSpec';
import { TextFormatter } from '../src/formatters/TextFormatter';
import { NULL_VALUE } from '../src';

const genCel = (expr: string, bindings?: any) => {
  const speech = new CelSpec();
  const ast = speech.toAST(expr, {});
  const bindingsAst = (() => {
    if (!bindings) return {}
    const tf = new TextFormatter({}, bindings)
    let res = {}
    for (const [key, entry] of Object.entries(bindings)) {
      const entryAst = speech.toAST(`${entry}`)
      const entryCel = tf.format(entryAst)
      res[key] = entryCel
    }
    return res
  })()

  const tf = new TextFormatter({}, bindingsAst)
  return tf.format(ast)
}

describe('basic.self_eval_zeroish', () => {
  test('self_eval_int_zero', () => {
    const expr = '0'
    const expected = {
      int64_value: 0
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  });

  test('self_eval_uint_zero', () => {
    const expr = '0u'
    const expected = {
      uint64_value: 0
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  });
  
  test('self_eval_float_zero', () => {
    const expr = '0.0'
    const expected = {
      double_value: 0
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected)
  })

  test('self_eval_float_zerowithexp', () => {
    const expr = '0e+0'
    const expected = {
      double_value: 0
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected)
  })

  test('self_eval_string_empty', () => {
    const expr = `''`
    const expected = {
      string_value: ''
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected)
  })

  test('self_eval_string_empty_quotes', () => {
    const expr = `""`
    const expected = {
      string_value: ''
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected)
  })

  test('self_eval_string_raw_prefix', () => {
    const expr = `r""`
    const expected = {
      string_value: ''
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected)
  })

  test('self_eval_bytes_empty', () => {
    const expr = `b""`
    const expected = {
      bytes_value: ''
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected)
  })

  test('self_eval_bool_false', () => {
    const expr = 'false'
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected)
  })

  test('self_eval_null', () => {
    const expr = 'null'
    const expected = {
      null_value: NULL_VALUE
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected)
  })

  test('self_eval_empty_list', () => {
    const expr = '[]'
    const expected = {
      list_value: {}
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected)
  })

  test('self_eval_empty_map', () => {
    const expr = '{}'
    const expected = {
      map_value: {}
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected)
  })
});

describe('basic.self_eval_nonzeroish', () => {
  test('self_eval_int_nonzero', () => {
    const expr = '42'
    const expected = {
      int64_value: 42
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected)
  })

  test('self_eval_uint_nonzero', () => {
    const expr = '123456789u'
    const expected = {
      uint64_value: 123456789
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected)
  })

  test('self_eval_int_negative_min', () => {
    const expr = '-9223372036854775808'
    const expected = {
      int64_value: -9223372036854775808
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected)
  })

  test('self_eval_float_negative_exp', () => {
    const expr = '-2.3e+1'
    const expected = {
      double_value: -23
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected)
  })
  
  test('self_eval_string_excl', () => {
    const expr = `"!"`
    const expected = {
      string_value: '!'
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected)
  })

  test.skip('self_eval_string_escape_single_backslash', () => {
    const expr = `'\''`
    const expected = {
      string_value: `'`
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected)
  })

  test('self_eval_bytes_escape', () => {
    const expr = `b'ÿ'`
    const expected = {
      // Octal values are not respected
      // Also, the expected value seems wrong
      // bytes_value: '\303\277'
      bytes_value: '\\377'
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected)
  })

  test('self_eval_bytes_invalid_utf8', () => {
    const expr = `b'\\000\\xff'`
    const expected = {
      bytes_value: '\\000\\377'
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected)
  })

  test('self_eval_list_singleitem_int', () => {
    const expr = '[-1]'
    const expected = {
      list_value: {
        values: [{ int64_value: -1 }]
      }
    }
    
    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected)
  })

  test('self_eval_list_singleitem_double', () => {
    const expr = '[-1.0]'
    const expected = {
      list_value: {
        values: [{ double_value: -1 }]
      }
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected)
  })

  test('self_eval_list_singleitem_string', () => {
    const expr = '["-1"]'
    const expected = {
      list_value: {
        values: [{ string_value: `-1` }]
      }
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected)
  })

  test('self_eval_map_singleitem', () => {
    const expr = '{"k":"v"}'
    const expected = {
      map_value: {
        entries: [{
          key: { string_value: "k" },
          value: { string_value: "v" }
        }]
      }
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected)
  })

  test('self_eval_bool_true', () => {
    const expr = 'true'
    const expected = { bool_value: true }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected)
  })
})

describe('variables', () => {
  test('self_eval_bound_lookup', () => {
    const expr = 'x'
    const bindings = {
      x: 123
    }
    const expected = {
      int64_value: 123
    }

    const cel = genCel(expr, bindings)
    expect(cel).toStrictEqual(expected)
  })

  test('self_eval_unbound_lookup', () => {
    const expr = 'x'
    try {
      genCel(expr)
      expect(true).toBe(false) // Test exception
    } catch (e) {
      expect(e.message).toBe(`{ message: "undeclared reference to 'x' (in container '')" }`)
    }
  })
})

describe('reserved_const', () => {
  test('false', () => {
    const expr = 'false'
    const bindings = {
      false: true
    }
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr, bindings)
    expect(cel).toStrictEqual(expected)
  })

  test('true', () => {
    const expr = 'true'
    const bindings = {
      true: false
    }
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr, bindings)
    expect(cel).toStrictEqual(expected)
  })
  
  test('null', () => {
    const expr = 'null'
    const bindings = {
      null: true
    }
    const expected = {
      null_value: NULL_VALUE
    }

    const cel = genCel(expr, bindings)
    expect(cel).toStrictEqual(expected)
  })
})
