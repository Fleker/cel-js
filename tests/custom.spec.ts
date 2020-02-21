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

describe('custom.box', () => {
  test('grass_only', () => {
    const expr = "'Grass' in boxTypes1"
    const bindings = {
      boxTypes1: ['Grass', 'Water']
    }

    const expected = {
      bool_value: true
    }

    const cel = genCel(expr, bindings)
    expect(cel).toStrictEqual(expected);
  })

  test('poison_only', () => {
    const expr = "'Poison' in boxTypes1"
    const bindings = {
      boxTypes1: ['Grass', 'Water']
    }

    const expected = {
      bool_value: false
    }

    const cel = genCel(expr, bindings)
    expect(cel).toStrictEqual(expected);
  })
})

describe('custom.gts', () => {
  test('One Unown', () => {
    const expr = 'id == 201'
    const bindings = {
      id: 201,
      form: 'F',
      species: 'Unown',
      type1: 'Psychic'
    }
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr, bindings)
    expect(cel).toStrictEqual(expected);
  })

  test('Unown', () => {
    const expr = '201 in offerIds'
    const bindings = {
      offerIds: [6, 201, 201, 8]
    }
    const expected = {
      bool_value: true
    }

    const cel = genCel(expr, bindings)
    expect(cel).toStrictEqual(expected);
  })
})
