# Common Expression Language - JS

## Supported functionality (subset)
[x] Basic types and primitives
[x] Comparisons
[x] Lists
[~] Logic - Ternary conditional, logical AND, logical OR
[ ] etc

## Usage

```
npm install @fleker/cel-js
```

### Create a list

```javascript
const expr = '["-1"]'
const expected = {
    list_value: {
        values: { string_value: `-1` }
    }
}

const celSpec = new CelSpec();
const ast = celSpec.toAST(expr, {});
const tf = new TextFormatter({}, {})

const cel = tf.format(ast)
expect(cel).toStrictEqual(expected) // Returns `true`
```

### Pass-in variables through a JSON object

```javascript
const expr = 'x'
const bindings = {
    x: 123
}
const expected = {
    int64_value: 123
}
const celSpec = new CelSpec();
const ast = celSpec.toAST(expr, {});
const bindingsAst = (() => {
    if (!bindings) return {}
    const tf = new TextFormatter({}, bindings)
    let res = {}
    for (const [key, entry] of Object.entries(bindings)) {
        const entryAst = celSpec.toAST(`${entry}`)
        const entryCel = tf.format(entryAst)
        res[key] = entryCel
    }
    return res
})()
const tf = new TextFormatter({}, bindingsAst)

const cel = tf.format(ast)
expect(cel).toStrictEqual(expected) // Returns `true`
```
