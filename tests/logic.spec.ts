import { CelSpec } from '../src/CelSpec';
import { TextFormatter } from '../src/formatters/TextFormatter';
import { NULL_VALUE } from '../src';

const genCel = (expr: string, bindings?: any, debug?: boolean) => {
  const speech = new CelSpec();
  const ast = speech.toAST(expr, {});
  if (debug) console.log(expr, ast)
  if (debug) console.log(ast.children)
  if (debug) console.log(ast.children.map(child => child.children))
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

describe('logic.conditional', () => {
  test('true_case', () => {
    const expr = "true ? 1 : 2"
    const expected = { int64_value: 1 }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('false_case', () => {
    const expr = "false ? 'foo' : 'bar'"
    const expected = { string_value: 'bar' }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  // Should throw error `{ message: "division by zero" }`
  // but parser does not support mathematical operations right now
  test.skip('error_case', () => {
    const expr = "2 / 0 > 4 ? 'baz' : 'quux'"
  })
  
  test('mixed_type', () => {
    const expr = "true ? 'cows' : 17"
    const expected = { string_value: 'cows' }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('bad_type', () => {
    const expr = "'cows' ? false : 17"
    try {
      genCel(expr)
      expect(true).toBe(false) // Should fail
    } catch(e) {
      expect(e.message).toBe(`{ message: "no such overload" }`)
    }
  })
})

describe('logic.AND', () => {
  test('all_true', () => {
    const expr = "true && true"
    const expected = { bool_value: true }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('all_false', () => {
    const expr = "false && false"
    const expected = { bool_value: false }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })
  
  test('false_left', () => {
    const expr = "false && true"
    const expected = { bool_value: false }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('false_right', () => {
    const expr = "true && false"
    const expected = { bool_value: false }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('short_circuit_type_left', () => {
    const expr = "false && 32"
    const expected = { bool_value: false }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('short_circuit_type_right', () => {
    const expr = "'horses' && false"
    const expected = { bool_value: false }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  // Skip arithmetic
  test.skip('short_circuit_error_left', () => {
    const expr = "false && (2 / 0 > 3 ? false : true)"
    const expected = { bool_value: false }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test.skip('short_circuit_error_right', () => {
    const expr = "(2 / 0 > 3 ? false : true) && false"
    const expected = { bool_value: false }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test.skip('error_right', () => {
    const expr = "true && 1/0 != 0"
    try {
      genCel(expr)
      expect(true).toBe(false) // Should fail
    } catch (e) {
      expect(e.message).toBe(`{ message: "no matching overload" }`)
    }
  })

  test.skip('error_left', () => {
    const expr = "1/0 != 0 && true"
    try {
      genCel(expr)
      expect(true).toBe(false) // Should fail
    } catch (e) {
      expect(e.message).toBe(`{ message: "no matching overload" }`)
    }
  })

  test.skip('no_overload', () => {
    const expr = "'less filling' && 'tastes great'"
    try {
      genCel(expr)
      expect(true).toBe(false) // Should fail
    } catch (e) {
      expect(e.message).toBe(`{ message: "no matching overload" }`)
    }
  })
})

describe('logic.OR', () => {
  test('all_true', () => {
    const expr = "true || true"
    const expected = { bool_value: true }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('all_false', () => {
    const expr = "false || false"
    const expected = { bool_value: false }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('false_left', () => {
    const expr = "false || true"
    const expected = { bool_value: true }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('false_right', () => {
    const expr = "true || false"
    const expected = { bool_value: true }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('short_circuit_type_left', () => {
    const expr = "true || 32"
    const expected = { bool_value: true }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('short_circuit_type_right', () => {
    const expr = "'horses' || true"
    const expected = { bool_value: true }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  // No support for arithmetic
  test.skip('short_circuit_error_left', () => {
    const expr = "true || (2 / 0 > 3 ? false : true)"
    const expected = { bool_value: true }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test.skip('short_circuit_error_right', () => {
    const expr = "(2 / 0 > 3 ? false : true) || true"
    const expected = { bool_value: true }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test.skip('error_right', () => {
    const expr = "false || 1/0 != 0"
    try {
      genCel(expr)
      expect(true).toBe(false) // Should fail
    } catch (e) {
      expect(e.message).toBe(`{ message: "no matching overload" }`)
    }
  })

  test.skip('error_left', () => {
    const expr = "1/0 != 0 || false"
    try {
      genCel(expr)
      expect(true).toBe(false) // Should fail
    } catch (e) {
      expect(e.message).toBe(`{ message: "no matching overload" }`)
    }
  })

  test.skip('no_overload', () => {
    const expr = "'less filling' || 'tastes great'"
    try {
      genCel(expr)
      expect(true).toBe(false) // Should fail
    } catch (e) {
      expect(e.message).toBe(`{ message: "no matching overload" }`)
    }
  })
})

describe.skip('logic.NOT', () => {
  test('not_true', () => {
    const expr = "!true"
    const expected = { bool_value: false }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })
})
