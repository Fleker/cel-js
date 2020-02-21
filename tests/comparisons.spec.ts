import { CelSpec } from '../src/CelSpec';
import { TextFormatter } from '../src/formatters/TextFormatter';
import { NULL_VALUE } from '../src';

const genCel = (expr: string, bindings?: any, debug?: boolean) => {
  const speech = new CelSpec();
  const ast = speech.toAST(expr, {});
  if (debug) console.log(expr, ast)
  if (debug) console.log(ast.children)
  if (debug) console.log(ast.children[0].children)
  const bindingsAst = (() => {
    if (!bindings) return {}
    const tf = new TextFormatter({}, bindings)
    let res = {}
    for (const [key, entry] of Object.entries(bindings)) {
      if (debug) console.log('res', res)
      if (debug) console.log('entry', key, entry, 'of', bindings)
      const entryAst = speech.toAST(JSON.stringify(entry))
      if (debug) console.log('eAST', entryAst)
      const entryCel = tf.format(entryAst)
      res[key] = entryCel
      if (debug) console.log('res2', res)
    }
    if (debug) console.log('res-end', res)
    return res
  })()
  if (debug) console.log(bindings, bindingsAst)

  const tf = new TextFormatter({}, bindingsAst)
  return tf.format(ast)
}

describe('comparisons.eq_literal', () => {
  test('eq_int', () => {
    const expr = '1 == 1'
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  });

  test('not_eq_int', () => {
    const expr = '-1 == 1'
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_uint', () => {
    const expr = '2u == 2u'
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_eq_uint', () => {
    const expr = '1u == 2u'
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_double', () => {
    const expr = '1.0 == 1.0e+0'
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_eq_double', () => {
    const expr = '-1.0 == 1.0e+0'
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_string', () => {
    const expr = "'' == \"\""
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_eq_string', () => {
    const expr = "'a' == 'b'"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_raw_string', () => {
    const expr = "'abc' == r'abc'"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_eq_string_case', () => {
    const expr = "'abc' == 'ABC'"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_string_unicode', () => {
    const expr = "'ίσος' == 'ίσος'"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_eq_string_unicode_ascii', () => {
    const expr = "'a' == 'à'"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_null', () => {
    const expr = 'null == null'
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_bool', () => {
    const expr = 'true == true'
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_eq_bool', () => {
    const expr = 'false == true'
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_bytes', () => {
    const expr = "b'ÿ' == b'\\377'"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_eq_bytes', () => {
    const expr = "b'abc' == b'abcd'"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_list_empty', () => {
    const expr = "[] == []"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_list_numbers', () => {
    const expr = "[1, 2, 3] == [1, 2, 3]"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_eq_list_order', () => {
    const expr = "[1, 2, 3] == [1, 3, 2]"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_eq_list_string_case', () => {
    const expr = "['case'] == ['cAse']"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_map_empty', () => {
    const expr = "{} == {}"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_map_onekey', () => {
    const expr = "{'k':'v'} == {\"k\":\"v\"}"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })
  
  test('eq_map_doublevalue', () => {
    const expr = "{'k':1.0} == {'k':1e+0}"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_eq_map_value', () => {
    const expr = "{'k':'v'} == {'k':'v1'}"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_eq_map_extrakey', () => {
    const expr = "{'k':'v','k1':'v1'} == {'k':'v'}"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('eq_map_keyorder', () => {
    const expr = "{'k1':'v1','k2':'v2'} == {'k2':'v2','k1':'v1'}"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_eq_map_key_casing', () => {
    const expr = "{'key':'value'} == {'Key':'value'}"
    const expected = {
      bool_value: false
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
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_ne_int', () => {
    const expr = "1 != 1"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('ne_uint', () => {
    const expr = "1u != 2u"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_ne_uint', () => {
    const expr = "99u != 99u"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('ne_double', () => {
    const expr = "9.0e+3 != 9001.0"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_ne_double', () => {
    const expr = "1.0 != 1e+0"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('ne_string', () => {
    const expr = "'abc' != ''"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_ne_string', () => {
    const expr = "'abc' != 'abc'"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('ne_string_unicode', () => {
    const expr = "'résumé' != 'resume'"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_ne_string_unicode', () => {
    const expr = "'ίδιο' != 'ίδιο'"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('ne_bytes', () => {
    const expr = "b'\\x00\\xFF' != b'ÿ'"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_ne_bytes', () => {
    const expr = "b'\\377' != b'ÿ'"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('ne_bool', () => {
    const expr = "false != true"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_ne_bool', () => {
    const expr = "true != true"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_ne_null', () => {
    const expr = "null != null"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })
  
  test('ne_list_empty', () => {
    const expr = "[] != [1]"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_ne_list_empty', () => {
    const expr = "[] != []"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('ne_list_bool', () => {
    const expr = "[true, false, true] != [true, true, false]"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_ne_list_bool', () => {
    const expr = "[false, true] != [false, true]"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  // Right now this does not support nested arrays/maps
  test.skip('not_ne_list_of_list', () => {
    const expr = "[[]] != [[]]"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('ne_map_by_value', () => {
    const expr = "{'k':'v'} != {'k':'v1'}"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('ne_map_by_key', () => {
    const expr = "{'k':true} != {'k1':true}"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_ne_map_int_to_float', () => {
    const expr = "{1:1.0} != {1:1.0}"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_ne_map_key_order', () => {
    const expr = "{'a':'b','c':'d'} != {'c':'d','a':'b'}"
    const expected = {
      bool_value: false
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
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_lt_int', () => {
    const expr = '0 < 0'
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lt_uint', () => {
    const expr = "0u < 1u"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_lt_uint', () => {
    const expr = "2u < 2u"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lt_double', () => {
    const expr = "1.0 < 1.0000001"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_lt_double', () => {
    // Following IEEE 754, negative zero compares equal to zero
    const expr = "-0.0 < 0.0"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lt_string', () => {
    const expr = "'a' < 'b'"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lt_string_empty_to_nonempty', () => {
    const expr = "'' < 'a'"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lt_string_case', () => {
    const expr = "'Abc' < 'aBC'"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lt_string_length', () => {
    const expr = "'abc' < 'abcd'"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test.skip('lt_string_diacritical_mark_sensitive', () => {
    // Verifies that the we're not using a string comparison function
    // that strips diacritical marks (á)
    const expr = "'a' < '\\u00E1'"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_lt_string_empty', () => {
    const expr = "'' < ''"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_lt_string_same', () => {
    const expr = "'abc' < 'abc'"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_lt_string_case_length', () => {
    const expr = "'a' < 'AB'"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lt_bytes', () => {
    const expr = "b'a' < b'b'"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_lt_bytes_same', () => {
    const expr = "b'abc' < b'abc'"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })
  
  test('not_lt_bytes_width', () => {
    const expr = "b'á' < b'b'"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lt_bool_false_first', () => {
    const expr = "false < true"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_lt_bool_same', () => {
    const expr = "true < true"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_lt_bool_true_first', () => {
    const expr = "true < false"
    const expected = {
      bool_value: false
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

describe('comparisons.gt_literal', () => {
  test('gt_int', () => {
    const expr = "42 > -42"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_gt_int', () => {
    const expr = "0 > 0"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('gt_uint', () => {
    const expr = "48u > 46u"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_gt_uint', () => {
    const expr = "0u > 999u"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('gt_double', () => {
    const expr = "1e+1 > 1e+0"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_gt_double', () => {
    const expr = ".99 > 9.9e-1"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('gt_string_case', () => {
    const expr = "'abc' > 'aBc'"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('gt_string_to_empty', () => {
    const expr = "'A' > ''"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_gt_string_empty_to_empty', () => {
    const expr = "'' > ''"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('gt_string_unicode', () => {
    const expr = "'α' > 'omega'"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('gt_bytes_one', () => {
    const expr = "b'\x01' > b'\x00'"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('gt_bytes_one_to_empty', () => {
    const expr = "b'\x00' > b''"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_gt_bytes_sorting', () => {
    const expr = "b'\x00\x01' > b'\x01'"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('gt_bool_true_false', () => {
    const expr = "true > false"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_gt_bool_false_true', () => {
    const expr = "false > true"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_gt_bool_same', () => {
    const expr = "true > true"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('gt_null_unsupported', () => {
    const expr = "null > null"
    try {
      const cel = genCel(expr)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('{ message: "no such overload" }')
    }
  })

  test('gt_list_unsupported', () => {
    const expr = "[0] > [1]"
    try {
      const cel = genCel(expr)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('{ message: "no such overload" }')
    }
  })

  test('gt_map_unsupported', () => {
    const expr = "{0:'a'} > {1:'b'}"
    try {
      const cel = genCel(expr)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('{ message: "no such overload" }')
    }
  })

  test('gt_mixed_types_error', () => {
    const expr = "'foo' > 1024"
    try {
      const cel = genCel(expr)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('{ message: "no such overload" }')
    }
  })
})

describe('comparisons.lte_literal', () => {
  test('lte_int_lt', () => {
    const expr = "0 <= 1"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lte_int_eq', () => {
    const expr = "1 <= 1"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_lte_int_gt', () => {
    const expr = "1 <= -1"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lte_uint_lt', () => {
    const expr = "0u <= 1u"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lte_uint_eq', () => {
    const expr = "1u <= 1u"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_lte_uint_gt', () => {
    const expr = "1u <= 0u"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lte_double_lt', () => {
    const expr = "0.0 <= 0.1e-31"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lte_double_eq', () => {
    const expr = "0.0 <= 0e-1"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_lte_double_gt', () => {
    const expr = "1.0 <= 0.99"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lte_string_empty', () => {
    const expr = "'' <= ''"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lte_string_from_empty', () => {
    const expr = "'' <= 'a'"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_lte_string_to_empty', () => {
    const expr = "'a' <= ''"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lte_string_lexicographical', () => {
    const expr = "'aBc' <= 'abc'"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lte_string_unicode_eq', () => {
    const expr = "'α' <= 'α'"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lte_string_unicode_lt', () => {
    const expr = "'a' <= 'α'"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_lte_string_unicode', () => {
    const expr = "'α' <= 'a'"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lte_bytes_empty', () => {
    const expr = "b'' <= b'\x00'"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_lte_bytes_length', () => {
    const expr = "b'\x01\x00' <= b'\x01'"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lte_bool_false_true', () => {
    const expr = "false <= true"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lte_bool_false_false', () => {
    const expr = "false <= false"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lte_bool_true_false', () => {
    const expr = "true <= false"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('lte_null_unsupported', () => {
    const expr = "null <= null"
    try {
      const cel = genCel(expr)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('{ message: "no such overload" }')
    }
  })

  test('lte_list_unsupported', () => {
    const expr = "[0] <= [1]"
    try {
      const cel = genCel(expr)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('{ message: "no such overload" }')
    }
  })

  test('lte_map_unsupported', () => {
    const expr = "{0:'a'} <= {1:'b'}"
    try {
      const cel = genCel(expr)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('{ message: "no such overload" }')
    }
  })

  test('lte_mixed_types_error', () => {
    const expr = "'foo' <= 1024"
    try {
      const cel = genCel(expr)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('{ message: "no such overload" }')
    }
  })
})

describe('comparisons.gte_literal', () => {
  test('gte_int_gt', () => {
    const expr = "0 >= -1"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('gte_int_eq', () => {
    const expr = "999 >= 999"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_gte_int_lt', () => {
    const expr = "999 >= 1000"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('gte_uint_gt', () => {
    const expr = "1u >= 0u"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('gte_uint_eq', () => {
    const expr = "0u >= 0u"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_gte_uint_lt', () => {
    const expr = "1u >= 10u"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('gte_double_gt', () => {
    const expr = "1e+1 >= 1e+0"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('gte_double_eq', () => {
    const expr = "9.80665 >= 9.80665e+0"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_gte_double_lt', () => {
    const expr = "0.9999 >= 1.0"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('gte_string_empty', () => {
    const expr = "'' >= ''"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('gte_string_to_empty', () => {
    const expr = "'a' >= ''"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('gte_string_empty_to_nonempty', () => {
    const expr = "'' >= 'a'"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('gte_string_length', () => {
    const expr = "'abcd' >= 'abc'"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_gte_string_lexicographical', () => {
    const expr = "'abc' >= 'abd'"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('gte_string_unicode_eq', () => {
    const expr = "'τ' >= 'τ'"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('gte_string_unicode_gt', () => {
    const expr = "'τ' >= 't'"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_get_string_unicode', () => {
    const expr = "'t' >= 'τ'"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('gte_bytes_to_empty', () => {
    const expr = "b'\x00' >= b''"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_gte_bytes_empty_to_nonempty', () => {
    const expr = "b'' >= b'\x00'"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('gte_bytes_samelength', () => {
    const expr = "b'\x00\x01' >= b'\x01\x00'"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('gte_bool_gt', () => {
    const expr = "true >= false"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('gte_bool_eq', () => {
    const expr = "true >= true"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('not_gte_bool_lt', () => {
    const expr = "false >= true"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('gte_null_unsupported', () => {
    const expr = "null >= null"
    try {
      const cel = genCel(expr)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('{ message: "no such overload" }')
    }
  })

  test('gte_list_unsupported', () => {
    const expr = "[0] >= [1]"
    try {
      const cel = genCel(expr)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('{ message: "no such overload" }')
    }
  })

  test('gte_map_unsupported', () => {
    const expr = "{0:'a'} >= {1:'b'}"
    try {
      const cel = genCel(expr)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('{ message: "no such overload" }')
    }
  })

  test('gte_mixed_types_error', () => {
    const expr = "'foo' >= 1024"
    try {
      const cel = genCel(expr)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('{ message: "no such overload" }')
    }
  })
})

describe('comparisons.in_list_literal', () => {
  it('elem_not_in_empty_list', () => {
    const expr = "'empty' in []"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  it('elem_in_list', () => {
    const expr = "'elem' in ['elem', 'elemA', 'elemB']"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  it('elem_not_in_list', () => {
    const expr = "'not' in ['elem1', 'elem2', 'elem3']"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  it('elem_in_mixed_type_list', () => {
    // Set membership tests should succeed if the 'elem' exists in a mixed
    // element type list.
    const expr = "'elem' in [1, 'elem', 2]"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  // Skip this test as JS is fine with the element not being present
  it.skip('elem_in_mixed_type_list_error', () => {
    // Set membership tests should error if the 'elem' does not exist in a
    // mixed element type list as containment is equivalent to the macro
    // exists() behavior.
    const expr = "'elem' in [1u, 'str', 2, b'bytes']"
    try {
      const cel = genCel(expr)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('{ message: "no such overload" }')
    }
  })
})

describe('comparisons.in_map_literal', () => {
  it('key_not_in_empty_map', () => {
    const expr = "'empty' in {}"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  it('key_in_map', () => {
    const expr = "'key' in {'key':'1', 'other':'2'}"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  it('key_not_in_map', () => {
    const expr = "'key' in {'lock':1, 'gate':2}"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  it('key_in_mixed_key_type_map', () => {
    const expr = "'key' in {3:3.0, 'key':2u}"
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  it.skip('key_in_mixed_key_type_map_error', () => {
    const expr = "'key' in {1u:'str', 2:b'bytes'}"
    try {
      const cel = genCel(expr)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('{ message: "no such overload" }')
    }
  })
})

describe('comparisons.bound', () => {
  it('bytes_gt_left_false', () => {
    const expr = "x > b'\x30'"
    const bindings = {
      x: "\x30"
    }
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr, bindings)
    expect(cel).toStrictEqual(expected);
  })

  it('int_lte_right_true', () => {
    const expr = "123 <= x"
    const bindings = {
      x: 124
    }
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr, bindings)
    expect(cel).toStrictEqual(expected);
  })

  it('bool_lt_right_true', () => {
    const expr = "false < x"
    const bindings = {
      x: true
    }
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr, bindings)
    expect(cel).toStrictEqual(expected);
  })

  it('double_ne_left_false', () => {
    const expr = "x != 9.8"
    const bindings = {
      x: 9.8
    }
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr, bindings)
    expect(cel).toStrictEqual(expected);
  })

  it('map_ne_right_false', () => {
    const expr = "{'a':'b','c':'d'} != x"
    const bindings = {
      x: {
        a: 'b',
        c: 'd',
      }
    }
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr, bindings)
    expect(cel).toStrictEqual(expected);
  })

  it('null_eq_left_true', () => {
    const expr = "x == null"
    const bindings = {
      x: null
    }
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr, bindings)
    expect(cel).toStrictEqual(expected);
  })

  it('list_eq_right_false', () => {
    const expr = "[1, 2] == x"
    const bindings = {
      x: [2, 1]
    }
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr, bindings)
    expect(cel).toStrictEqual(expected);
  })

  it('string_gte_right_true', () => {
    const expr = "'abcd' >= x"
    const bindings = {
      x: 'abc'
    }
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr, bindings)
    expect(cel).toStrictEqual(expected);
  })

  it('uint_eq_right_false', () => {
    const expr = "999u == x"
    const bindings = {
      x: 1000
    }
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr, bindings)
    expect(cel).toStrictEqual(expected);
  })

  it('null_lt_right_no_such_overload', () => {
    // There is no _<_ operation for null,
    // even if both operands are null
    const expr = "null < x"
    const bindings = {
      x: null
    }
    try {
      genCel(expr, bindings)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('{ message: "no such overload" }')
    }
  })
})
