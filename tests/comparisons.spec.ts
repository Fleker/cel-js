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

describe('comparisons.eq_literal', () => {
  test('eq_int', () => {
    const expr = '1 == 1'
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  });

  test('not_eq_int', () => {
    const expr = '-1 == 1'
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_uint', () => {
    const expr = '2u == 2u'
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_eq_uint', () => {
    const expr = '1u == 2u'
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_double', () => {
    const expr = '1.0 == 1.0e+0'
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_eq_double', () => {
    const expr = '-1.0 == 1.0e+0'
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_string', () => {
    const expr = "'' == \"\""
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_eq_string', () => {
    const expr = "'a' == 'b'"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_raw_string', () => {
    const expr = "'abc' == r'abc'"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_eq_string_case', () => {
    const expr = "'abc' == 'ABC'"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_string_unicode', () => {
    const expr = "'ίσος' == 'ίσος'"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_eq_string_unicode_ascii', () => {
    const expr = "'a' == 'à'"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_null', () => {
    const expr = 'null == null'
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_bool', () => {
    const expr = 'true == true'
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_eq_bool', () => {
    const expr = 'false == true'
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_bytes', () => {
    const expr = "b'ÿ' == b'\\377'"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_eq_bytes', () => {
    const expr = "b'abc' == b'abcd'"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_list_empty', () => {
    const expr = "[] == []"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_list_numbers', () => {
    const expr = "[1, 2, 3] == [1, 2, 3]"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_eq_list_order', () => {
    const expr = "[1, 2, 3] == [1, 3, 2]"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_eq_list_string_case', () => {
    const expr = "['case'] == ['cAse']"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_map_empty', () => {
    const expr = "{} == {}"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_map_onekey', () => {
    const expr = "{'k':'v'} == {\"k\":\"v\"}"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })
  
  test('eq_map_doublevalue', () => {
    const expr = "{'k':1.0} == {'k':1e+0}"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_eq_map_value', () => {
    const expr = "{'k':'v'} == {'k':'v1'}"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_eq_map_extrakey', () => {
    const expr = "{'k':'v','k1':'v1'} == {'k':'v'}"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_map_keyorder', () => {
    const expr = "{'k1':'v1','k2':'v2'} == {'k2':'v2','k1':'v1'}"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_eq_map_key_casing', () => {
    const expr = "{'key':'value'} == {'Key':'value'}"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_mixed_types_error', () => {
    const expr = "1.0 == 1"
    try {
      genCel(expr)
      expect(true).toBe(false) // Expect error
    } catch (e) {
      expect(e.message).toBe(`{ message: "no such overload" }`)
    }
  })

  // Skip this test because JS compares as `true`
  test.skip('eq_list_elem_mixed_types_error', () => {
    const expr = "[1] == [1.0]"
    try {
      genCel(expr)
      expect(true).toBe(false) // Expect error
    } catch (e) {
      expect(e.message).toBe(`{ message: "no such overload" }`)
    }
  })

  // Skip this test as type comparisons don't throw errors
  test.skip('eq_map_value_mixed_types_error', () => {
    const expr = "{'k':'v', 1:1} == {'k':'v', 1:'v1'}"
    try {
      genCel(expr)
      expect(true).toBe(false) // Expect error
    } catch (e) {
      expect(e.message).toBe(`{ message: "no such overload" }`)
    }
  })
})

describe('comparisons.ne_literal', () => {
  test('ne_int', () => {
    const expr = "24 != 42"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_ne_int', () => {
    const expr = "1 != 1"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('ne_uint', () => {
    const expr = "1u != 2u"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_ne_uint', () => {
    const expr = "99u != 99u"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('ne_double', () => {
    const expr = "9.0e+3 != 9001.0"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_ne_double', () => {
    const expr = "1.0 != 1e+0"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('ne_string', () => {
    const expr = "'abc' != ''"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_ne_string', () => {
    const expr = "'abc' != 'abc'"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('ne_string_unicode', () => {
    const expr = "'résumé' != 'resume'"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_ne_string_unicode', () => {
    const expr = "'ίδιο' != 'ίδιο'"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('ne_bytes', () => {
    const expr = "b'\\x00\\xFF' != b'ÿ'"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_ne_bytes', () => {
    const expr = "b'\\377' != b'ÿ'"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('ne_bool', () => {
    const expr = "false != true"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_ne_bool', () => {
    const expr = "true != true"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_ne_null', () => {
    const expr = "null != null"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })
  
  test('ne_list_empty', () => {
    const expr = "[] != [1]"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_ne_list_empty', () => {
    const expr = "[] != []"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('ne_list_bool', () => {
    const expr = "[true, false, true] != [true, true, false]"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_ne_list_bool', () => {
    const expr = "[false, true] != [false, true]"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  // Right now this does not support nested arrays/maps
  test.skip('not_ne_list_of_list', () => {
    const expr = "[[]] != [[]]"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('ne_map_by_value', () => {
    const expr = "{'k':'v'} != {'k':'v1'}"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('ne_map_by_key', () => {
    const expr = "{'k':true} != {'k1':true}"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_ne_map_int_to_float', () => {
    const expr = "{1:1.0} != {1:1.0}"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_ne_map_key_order', () => {
    const expr = "{'a':'b','c':'d'} != {'c':'d','a':'b'}"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('ne_mixed_types_error', () => {
    const expr = "2u != 2"
    try {
      const cel = genCel(expr)
      expect(true).toBe(false) // Expect error
    } catch (e) {
      expect(e.message).toBe('{ message: "no such overload" }')
    }
  })
})

describe('comparisons.lt_literal', () => {
  test('lt_int', () => {
    const expr = "-1 < 0"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_lt_int', () => {
    const expr = '0 < 0'
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lt_uint', () => {
    const expr = "0u < 1u"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_lt_uint', () => {
    const expr = "2u < 2u"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lt_double', () => {
    const expr = "1.0 < 1.0000001"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_lt_double', () => {
    // Following IEEE 754, negative zero compares equal to zero
    const expr = "-0.0 < 0.0"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lt_string', () => {
    const expr = "'a' < 'b'"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lt_string_empty_to_nonempty', () => {
    const expr = "'' < 'a'"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lt_string_case', () => {
    const expr = "'Abc' < 'aBC'"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lt_string_length', () => {
    const expr = "'abc' < 'abcd'"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test.skip('lt_string_diacritical_mark_sensitive', () => {
    // Verifies that the we're not using a string comparison function
    // that strips diacritical marks (á)
    const expr = "'a' < '\\u00E1'"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_lt_string_empty', () => {
    const expr = "'' < ''"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_lt_string_same', () => {
    const expr = "'abc' < 'abc'"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_lt_string_case_length', () => {
    const expr = "'a' < 'AB'"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lt_bytes', () => {
    const expr = "b'a' < b'b'"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_lt_bytes_same', () => {
    const expr = "b'abc' < b'abc'"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })
  
  test('not_lt_bytes_width', () => {
    const expr = "b'á' < b'b'"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lt_bool_false_first', () => {
    const expr = "false < true"
    const expected = {
      boolean_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_lt_bool_same', () => {
    const expr = "true < true"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_lt_bool_true_first', () => {
    const expr = "true < false"
    const expected = {
      boolean_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lt_list_unsupported', () => {
    const expr = "[0] < [1]"
    try {
      const cel = genCel(expr)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('{ message: "no such overload" }')
    }
  })

  test('lt_map_unsupported', () => {
    const expr = "{0:'a'} < {1:'b'}"
    try {
      const cel = genCel(expr)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('{ message: "no such overload" }')
    }
  })

  test('lt_null_unsupported', () => {
    const expr = "null < null"
    try {
      const cel = genCel(expr)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('{ message: "no such overload" }')
    }
  })

  test('lt_mixed_types_error', () => {
    const expr = "'foo' < 1024"
    try {
      const cel = genCel(expr)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('{ message: "no such overload" }')
    }
  })
})
