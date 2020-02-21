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

describe('lists.concatentation', () => {
  test('list_append', () => {
    const expr = "[0, 1, 2] + [3, 4, 5] == [0, 1, 2, 3, 4, 5]"
    const expected = { bool_value: true }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('list_not_commutative', () => {
    const expr = "[0, 1, 2] + [3, 4, 5] == [3, 4, 5, 0, 1, 2]"
    const expected = { bool_value: false }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('list_repeat', () => {
    const expr = "[2] + [2]"
    const expected = {
      list_value: {
        values: [{
          int64_value: 2
        }, {
          int64_value: 2
        }]
      }
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('empty_empty', () => {
    const expr = "[] + []"
    const expected = { list_value: {} }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('left_unit', () => {
    const expr = "[] + [3, 4]"
    const expected = { 
      list_value: {
        values: [{
          int64_value: 3
        }, {
          int64_value: 4
        }]
      }
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('right_unit', () => {
    const expr = "[1, 2] + []"
    const expected = { 
      list_value: {
        values: [{
          int64_value: 1
        }, {
          int64_value: 2
        }]
      }
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })
})

describe('lists.index', () => {
  test('zero_based', () => {
    const expr = "[7, 8, 9][0]"
    const expected = { int64_value: 7 }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('singleton', () => {
    const expr = "[0, 1, 1, 2, 3, 5, 8, 13][4]"
    const expected = { int64_value: 3 }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('last', () => {
    const expr = "['George', 'John', 'Paul', 'Ringo'][3]"
    const expected = { string_value: 'Ringo' }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })
  
  test('range', () => {
    const expr = "[1, 2, 3][3]"
    try {
      genCel(expr)
      expect(true).toBe(false) // Should fail
    } catch (e) {
      expect(e.message).toBe('{ message: "invalid_argument" }')
    }
  })
})

describe('lists.in', () => {
  test('empty', () => {
    const expr = "7 in []"
    const expected = {
      bool_value: false
    }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('singleton', () => {
    const expr = "4u in [4u]"
    const expected = { bool_value: true }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('first', () => {
    const expr = "'alpha' in ['alpha', 'beta', 'gamma']"
    const expected = { bool_value: true }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('middle', () => {
    const expr = "3 in [5, 4, 3, 2, 1]"
    const expected = { bool_value: true }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('last', () => {
    const expr = "20u in [4u, 6u, 8u, 12u, 20u]"
    const expected = { bool_value: true }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('missing', () => {
    const expr = "'hawaiian' in ['meat', 'veggie', 'margarita', 'cheese']"
    const expected = { bool_value: false }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })
})

describe('lists.size', () => {
  test('list_empty', () => {
    const expr = "size([])"
    const expected = { int64_value: 0 }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('list', () => {
    const expr = "size([1, 2, 3])"
    const expected = { int64_value: 3 }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('map_empty', () => {
    const expr = "size({})"
    const expected = { int64_value: 0 }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })

  test('map', () => {
    const expr = "size({1: 'one', 2: 'two', 3: 'three'})"
    const expected = { int64_value: 3 }

    const cel = genCel(expr)
    expect(cel).toStrictEqual(expected);
  })
})
