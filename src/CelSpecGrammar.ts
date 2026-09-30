/// <reference path="../node_modules/myna-parser/myna.ts" />
"use strict";

function isDigit(c: number): boolean {
  return c >= 48 && c <= 57;
}

function isIdentStart(c: number): boolean {
  return (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95;
}

function isIdentPart(c: number): boolean {
  return (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c >= 48 && c <= 57) || c === 95;
}

function isPrimitiveName(name: string): boolean {
  return (
    name === "int64" ||
    name === "string" ||
    name === "uint64" ||
    name === "double" ||
    name === "boolean"
  );
}

function isDeepObjName(name: string): boolean {
  return name === "map" || name === "concatObj" || name === "list";
}

function isNonLogicalStandalone(name: string): boolean {
  return (
    name === "rawString" ||
    name === "byteString" ||
    name === "null" ||
    name === "list" ||
    name === "map"
  );
}

function createFastLeafRule(m: any, lexerFn: (p: any) => boolean): any {
  const rule = new m.AstRule(new m.Predicate(lexerFn));
  rule.lexer = lexerFn;
  rule.parser = (p: any): boolean => {
    const start = p.index;
    if (!lexerFn(p)) {
      p.index = start;
      return false;
    }
    const node = new m.AstNode(rule, p.input, start, p.index);
    node.children = [];
    p.nodes.push(node);
    return true;
  };
  return rule;
}

function createFastCompositeRule(m: any, parserFn: (p: any, rule: any) => boolean): any {
  const rule = new m.AstRule(m.truePredicate);
  rule.parser = (p: any): boolean => parserFn(p, rule);
  rule.lexer = rule.parser;
  return rule;
}

// tslint:disable-next-line: max-func-body-length
export function celSpecGrammar(myna: any): any {
  const m = myna;
  // Override parenthesis function to not use `.guardedSeq`
  // This sequence is too assertive, and may cause exceptions rather than just returning null
  m.parenthesized = (rule: any): any => {
    return m.seq("(", m.ws, rule, m.ws, ")").setType("parenthesized");
  };

  // tslint:disable-next-line: typedef
  // tslint:disable-next-line: max-func-body-length
  const grammar = new function () {
    // https://github.com/google/cel-spec/blob/master/tests/simple/testdata/basic.textproto
    // .self_eval_zeroish
    this.int64 = createFastLeafRule(m, (p: any): boolean => {
      const s = p.input;
      const len = p.length;
      let i = p.index;
      if (i >= len) {
        return false;
      }
      if (s.charCodeAt(i) === 45) {
        i++;
      }
      if (i >= len || !isDigit(s.charCodeAt(i))) {
        return false;
      }
      i++;
      while (i < len && isDigit(s.charCodeAt(i))) {
        i++;
      }
      if (i < len) {
        const c = s.charCodeAt(i);
        // notAtChar('eu.')
        if (c === 101 || c === 117 || c === 46) {
          return false;
        }
      }
      p.index = i;
      return true;
    });

    // .self_eval_uint_zero
    this.uint64 = createFastLeafRule(m, (p: any): boolean => {
      const s = p.input;
      const len = p.length;
      let i = p.index;
      if (i >= len || !isDigit(s.charCodeAt(i))) {
        return false;
      }
      i++;
      while (i < len && isDigit(s.charCodeAt(i))) {
        i++;
      }
      if (i >= len || s.charCodeAt(i) !== 117) {
        return false;
      }
      p.index = i + 1;
      return true;
    });

    this.double = createFastLeafRule(m, (p: any): boolean => {
      const s = p.input;
      const len = p.length;
      let i = p.index;
      if (i >= len) {
        return false;
      }
      if (s.charCodeAt(i) === 45) {
        i++;
      }
      const digitStart = i;
      while (i < len && isDigit(s.charCodeAt(i))) {
        i++;
      }
      const hasLeadingDigits = i > digitStart;
      let afterFrac = -1;
      if (i < len && s.charCodeAt(i) === 46) {
        let j = i + 1;
        while (j < len && isDigit(s.charCodeAt(j))) {
          j++;
        }
        if (j > i + 1) {
          afterFrac = j;
          i = j;
        }
      }
      if (hasLeadingDigits && i + 2 < len && s.charCodeAt(i) === 101) {
        const sign = s.charCodeAt(i + 1);
        if (sign === 43 || sign === 45) {
          let k = i + 2;
          while (k < len && isDigit(s.charCodeAt(k))) {
            k++;
          }
          if (k > i + 2) {
            p.index = k;
            return true;
          }
        }
      }
      if (afterFrac !== -1) {
        p.index = afterFrac;
        return true;
      }
      return false;
    });

    this.string = createFastLeafRule(m, (p: any): boolean => {
      const s = p.input;
      const len = p.length;
      let i = p.index;
      if (i >= len) {
        return false;
      }
      const quote = s.charCodeAt(i);
      if (quote !== 39 && quote !== 34) {
        return false;
      }
      i++;
      while (i < len) {
        const c = s.charCodeAt(i);
        if (c === quote) {
          p.index = i + 1;
          return true;
        }
        if (c === 92) {
          i += 2;
          if (i > len) {
            return false;
          }
        } else {
          i++;
        }
      }
      return false;
    });

    this.rawString = createFastLeafRule(m, (p: any): boolean => {
      const s = p.input;
      const i = p.index;
      if (i + 2 > p.length || s.charCodeAt(i) !== 114) {
        return false;
      }
      const quote = s.charCodeAt(i + 1);
      if (quote !== 39 && quote !== 34) {
        return false;
      }
      const closeIdx = s.indexOf(quote === 39 ? "'" : '"', i + 2);
      if (closeIdx === -1) {
        return false;
      }
      p.index = closeIdx + 1;
      return true;
    });

    this.byteString = createFastLeafRule(m, (p: any): boolean => {
      const s = p.input;
      const len = p.length;
      let i = p.index;
      if (i + 2 > len || s.charCodeAt(i) !== 98) {
        return false;
      }
      const quote = s.charCodeAt(i + 1);
      if (quote !== 39 && quote !== 34) {
        return false;
      }
      i += 2;
      while (i < len) {
        const c = s.charCodeAt(i);
        if (c === quote) {
          p.index = i + 1;
          return true;
        }
        if (c === 92) {
          i += 2;
          if (i > len) {
            return false;
          }
        } else {
          i++;
        }
      }
      return false;
    });

    this.boolean = createFastLeafRule(m, (p: any): boolean => {
      const s = p.input;
      const i = p.index;
      if (i >= p.length) {
        return false;
      }
      const c = s.charCodeAt(i);
      if (c === 116 && s.startsWith("true", i)) {
        p.index = i + 4;
        return true;
      }
      if (c === 102 && s.startsWith("false", i)) {
        p.index = i + 5;
        return true;
      }
      return false;
    });

    this.null = createFastLeafRule(m, (p: any): boolean => {
      const s = p.input;
      const i = p.index;
      if (i >= p.length) {
        return false;
      }
      const c = s.charCodeAt(i);
      if ((c === 110 && s.startsWith("null", i)) || (c === 78 && s.startsWith("NULL", i))) {
        p.index = i + 4;
        return true;
      }
      return false;
    });

    this.variable = createFastLeafRule(m, (p: any): boolean => {
      const s = p.input;
      const len = p.length;
      let i = p.index;
      if (i >= len || !isIdentStart(s.charCodeAt(i))) {
        return false;
      }
      i++;
      while (i < len && isIdentPart(s.charCodeAt(i))) {
        i++;
      }
      p.index = i;
      return true;
    });

    const parseNumber = (p: any): boolean => {
      const s = p.input;
      const len = p.length;
      const start = p.index;
      let i = start;
      const hasMinus = s.charCodeAt(i) === 45;
      if (hasMinus) {
        i++;
      }
      const digitStart = i;
      while (i < len && isDigit(s.charCodeAt(i))) {
        i++;
      }
      const hasLeadingDigits = i > digitStart;
      if (hasLeadingDigits) {
        const nextCode = i < len ? s.charCodeAt(i) : 0;
        if (nextCode !== 46 && nextCode !== 101 && nextCode !== 117) {
          const node = new m.AstNode(this.int64, s, start, i);
          node.children = [];
          p.nodes.push(node);
          p.index = i;
          return true;
        }
        if (!hasMinus && nextCode === 117) {
          const node = new m.AstNode(this.uint64, s, start, i + 1);
          node.children = [];
          p.nodes.push(node);
          p.index = i + 1;
          return true;
        }
      }
      return this.double.parser(p);
    };

    const parsePrimitive = (p: any): boolean => {
      if (p.index >= p.length) {
        return false;
      }
      const c = p.input.charCodeAt(p.index);
      if (c === 39 || c === 34) {
        return this.string.parser(p);
      }
      if (c === 45 || c === 46 || (c >= 48 && c <= 57)) {
        return parseNumber(p);
      }
      if (c === 116 || c === 102) {
        return this.boolean.parser(p);
      }
      return false;
    };

    this.list = createFastCompositeRule(m, (p: any, rule: any): boolean => {
      const s = p.input;
      const len = p.length;
      const start = p.index;
      if (start >= len || s.charCodeAt(start) !== 91) {
        return false;
      }
      const savedNodes = p.nodes;
      const children: any[] = [];
      p.nodes = children;
      p.index = start + 1;
      while (p.index < len && parsePrimitive(p)) {
        if (p.index < len && s.charCodeAt(p.index) === 44) {
          p.index++;
        }
        if (p.index < len && s.charCodeAt(p.index) === 32) {
          p.index++;
        }
      }
      if (p.index >= len || s.charCodeAt(p.index) !== 93) {
        p.nodes = savedNodes;
        p.index = start;
        return false;
      }
      p.index++;
      p.nodes = savedNodes;
      const node = new m.AstNode(rule, s, start, p.index);
      node.children = children;
      savedNodes.push(node);
      return true;
    });

    this.map = createFastCompositeRule(m, (p: any, rule: any): boolean => {
      const s = p.input;
      const len = p.length;
      const start = p.index;
      if (start >= len || s.charCodeAt(start) !== 123) {
        return false;
      }
      const savedNodes = p.nodes;
      const children: any[] = [];
      p.nodes = children;
      p.index = start + 1;
      while (p.index < len) {
        const entryStart = p.index;
        const entryNodeCount = children.length;
        if (!parsePrimitive(p)) {
          break;
        }
        if (p.index >= len || s.charCodeAt(p.index) !== 58) {
          children.length = entryNodeCount;
          p.index = entryStart;
          break;
        }
        p.index++;
        if (p.index < len && s.charCodeAt(p.index) === 32) {
          p.index++;
        }
        if (!parsePrimitive(p)) {
          children.length = entryNodeCount;
          p.index = entryStart;
          break;
        }
        if (p.index < len && s.charCodeAt(p.index) === 44) {
          p.index++;
        }
        if (p.index < len && s.charCodeAt(p.index) === 32) {
          p.index++;
        }
      }
      if (p.index >= len || s.charCodeAt(p.index) !== 125) {
        p.nodes = savedNodes;
        p.index = start;
        return false;
      }
      p.index++;
      p.nodes = savedNodes;
      const node = new m.AstNode(rule, s, start, p.index);
      node.children = children;
      savedNodes.push(node);
      return true;
    });

    this.comparable = createFastLeafRule(m, (p: any): boolean => {
      const s = p.input;
      const i = p.index;
      if (i >= p.length) {
        return false;
      }
      const c1 = s.charCodeAt(i);
      const c2 = i + 1 < p.length ? s.charCodeAt(i + 1) : 0;
      if (c1 === 61 || c1 === 33) {
        if (c2 === 61) {
          p.index = i + 2;
          return true;
        }
        return false;
      }
      if (c1 === 62 || c1 === 60) {
        p.index = c2 === 61 ? i + 2 : i + 1;
        return true;
      }
      return false;
    });

    this.sizeOfObj = createFastCompositeRule(m, (p: any, rule: any): boolean => {
      const s = p.input;
      const start = p.index;
      if (start + 6 > p.length || s.charCodeAt(start) !== 115 || !s.startsWith("size(", start)) {
        return false;
      }
      const savedNodes = p.nodes;
      const children: any[] = [];
      p.nodes = children;
      p.index = start + 5;
      const c = s.charCodeAt(p.index);
      const ok =
        c === 91
          ? this.list.parser(p)
          : c === 123
          ? this.map.parser(p)
          : this.variable.parser(p);
      if (!ok || p.index >= p.length || s.charCodeAt(p.index) !== 41) {
        p.nodes = savedNodes;
        p.index = start;
        return false;
      }
      p.index++;
      p.nodes = savedNodes;
      const node = new m.AstNode(rule, s, start, p.index);
      node.children = children;
      savedNodes.push(node);
      return true;
    });

    this.comparisonInt64 = new m.AstRule(m.truePredicate);
    this.comparisonUint64 = new m.AstRule(m.truePredicate);
    this.comparisonDouble = new m.AstRule(m.truePredicate);
    this.comparisonString = new m.AstRule(m.truePredicate);
    this.comparisonByteString = new m.AstRule(m.truePredicate);
    this.comparisonBoolean = new m.AstRule(m.truePredicate);
    this.comparisonNull = new m.AstRule(m.truePredicate);
    this.comparisonTypeMismatch = new m.AstRule(m.truePredicate);
    this.elementInObj = new m.AstRule(m.truePredicate);
    this.indexOfObj = new m.AstRule(m.truePredicate);
    this.concatObj = new m.AstRule(m.truePredicate);
    this.ternary = new m.AstRule(m.truePredicate);
    this.ternaryTypeMismatch = new m.AstRule(m.truePredicate);
    this.deepCompareObj = new m.AstRule(m.truePredicate);

    const getComparisonRule = (ln: string, rn: string): any => {
      if ((ln === "null" && (rn === "null" || rn === "variable")) || (ln === "variable" && rn === "null")) {
        return this.comparisonNull;
      }
      if (
        ((ln === "string" || ln === "rawString") &&
          (rn === "string" || rn === "rawString" || rn === "variable")) ||
        (ln === "variable" && (rn === "string" || rn === "rawString"))
      ) {
        return this.comparisonString;
      }
      if (
        ((ln === "int64" || ln === "sizeOfObj" || ln === "variable") &&
          (rn === "int64" || rn === "sizeOfObj")) ||
        ((ln === "int64" || ln === "sizeOfObj") && rn === "variable")
      ) {
        return this.comparisonInt64;
      }
      if ((ln === "uint64" && (rn === "uint64" || rn === "variable")) || (ln === "variable" && rn === "uint64")) {
        return this.comparisonUint64;
      }
      if ((ln === "double" && (rn === "double" || rn === "variable")) || (ln === "variable" && rn === "double")) {
        return this.comparisonDouble;
      }
      if (
        (ln === "byteString" && (rn === "byteString" || rn === "variable")) ||
        (ln === "variable" && rn === "byteString")
      ) {
        return this.comparisonByteString;
      }
      if ((ln === "boolean" && (rn === "boolean" || rn === "variable")) || (ln === "variable" && rn === "boolean")) {
        return this.comparisonBoolean;
      }
      if ((isDeepObjName(ln) && (isDeepObjName(rn) || rn === "variable")) || (ln === "variable" && isDeepObjName(rn))) {
        return this.deepCompareObj;
      }
      if (isPrimitiveName(ln) && isPrimitiveName(rn)) {
        return this.comparisonTypeMismatch;
      }
      return null;
    };

    const tryParseIndexSuffix = (p: any, start: number): boolean => {
      const s = p.input;
      const len = p.length;
      if (p.index < len && s.charCodeAt(p.index) === 91) {
        const afterBase = p.index;
        p.index++;
        if (this.int64.parser(p)) {
          if (p.index < len && s.charCodeAt(p.index) === 93) {
            p.index++;
            const idxNode = p.nodes.pop();
            const baseNode = p.nodes.pop();
            const indexObjNode = new m.AstNode(this.indexOfObj, s, start, p.index);
            indexObjNode.children = [baseNode, idxNode];
            p.nodes.push(indexObjNode);
            return true;
          }
          p.nodes.pop();
        }
        p.index = afterBase;
      }
      return false;
    };

    // tslint:disable-next-line: max-func-body-length
    const parseAtom = (p: any, allowIndexSuffix: boolean): boolean => {
      const s = p.input;
      const len = p.length;
      const start = p.index;
      if (start >= len) {
        return false;
      }
      const c = s.charCodeAt(start);
      if (c === 39 || c === 34) {
        return this.string.parser(p);
      }
      if (c === 45 || c === 46 || (c >= 48 && c <= 57)) {
        return parseNumber(p);
      }
      if (c === 91) {
        if (!this.list.parser(p)) {
          return false;
        }
        let idx = p.index;
        if (idx < len && s.charCodeAt(idx) === 32) {
          idx++;
        }
        if (idx < len && s.charCodeAt(idx) === 43) {
          const afterFirstList = p.index;
          idx++;
          if (idx < len && s.charCodeAt(idx) === 32) {
            idx++;
          }
          p.index = idx;
          if (this.list.parser(p)) {
            const rightList = p.nodes.pop();
            const leftList = p.nodes.pop();
            const concatNode = new m.AstNode(this.concatObj, s, start, p.index);
            concatNode.children = [leftList, rightList];
            p.nodes.push(concatNode);
            return true;
          }
          p.index = afterFirstList;
        }
        if (allowIndexSuffix) {
          tryParseIndexSuffix(p, start);
        }
        return true;
      }
      if (c === 123) {
        return this.map.parser(p);
      }
      if (c === 114) {
        const c2 = start + 1 < len ? s.charCodeAt(start + 1) : 0;
        if (c2 === 39 || c2 === 34) {
          return this.rawString.parser(p);
        }
      } else if (c === 98) {
        const c2 = start + 1 < len ? s.charCodeAt(start + 1) : 0;
        if (c2 === 39 || c2 === 34) {
          return this.byteString.parser(p);
        }
      } else if (c === 115 && s.startsWith("size(", start)) {
        if (this.sizeOfObj.parser(p)) {
          return true;
        }
      } else if (c === 116 && s.startsWith("true", start) && (start + 4 >= len || !isIdentPart(s.charCodeAt(start + 4)))) {
        return this.boolean.parser(p);
      } else if (c === 102 && s.startsWith("false", start) && (start + 5 >= len || !isIdentPart(s.charCodeAt(start + 5)))) {
        return this.boolean.parser(p);
      } else if (
        ((c === 110 && s.startsWith("null", start)) || (c === 78 && s.startsWith("NULL", start))) &&
        (start + 4 >= len || !isIdentPart(s.charCodeAt(start + 4)))
      ) {
        return this.null.parser(p);
      }
      if (!this.variable.parser(p)) {
        return false;
      }
      if (allowIndexSuffix) {
        tryParseIndexSuffix(p, start);
      }
      return true;
    };

    // tslint:disable-next-line: max-func-body-length
    const parseOperand = (p: any, allowStandaloneNonLogical: boolean): boolean => {
      const s = p.input;
      const len = p.length;
      const start = p.index;
      if (start >= len) {
        return false;
      }
      const c = s.charCodeAt(start);
      if (c === 40) {
        return this.parenthesized.parser(p);
      }
      if (c === 33) {
        if (start + 1 < len && s.charCodeAt(start + 1) === 61) {
          return false;
        }
        return this.logicalNot.parser(p);
      }

      if (!parseAtom(p, true)) {
        return false;
      }

      const lhs = p.nodes[p.nodes.length - 1];
      const lhsName = lhs.name;
      if (lhsName === "indexOfObj") {
        return true;
      }

      const afterLhs = p.index;
      if (afterLhs < len) {
        // Check for comparison: opt(space) comparable opt(space) rhs
        let opIdx = s.charCodeAt(afterLhs) === 32 ? afterLhs + 1 : afterLhs;
        if (opIdx < len) {
          const oc = s.charCodeAt(opIdx);
          if (oc === 61 || oc === 33 || oc === 62 || oc === 60) {
            p.index = opIdx;
            if (this.comparable.parser(p)) {
              if (p.index < len && s.charCodeAt(p.index) === 32) {
                p.index++;
              }
              if (parseAtom(p, false)) {
                const rhs = p.nodes[p.nodes.length - 1];
                const compRule = getComparisonRule(lhsName, rhs.name);
                if (compRule) {
                  p.nodes.pop();
                  const compOpNode = p.nodes.pop();
                  p.nodes.pop();
                  const compNode = new m.AstNode(compRule, s, start, p.index);
                  compNode.children = [lhs, compOpNode, rhs];
                  p.nodes.push(compNode);
                  return true;
                }
                p.nodes.pop();
              }
              p.nodes.pop();
            }
            p.index = afterLhs;
          }
        }

        // Check for ' in ' or ' ? ' when lhs is a primitive
        if (isPrimitiveName(lhsName) && s.charCodeAt(afterLhs) === 32) {
          if (s.startsWith(" in ", afterLhs)) {
            p.index = afterLhs + 4;
            if (p.index < len) {
              const rc = s.charCodeAt(p.index);
              const ok =
                rc === 91
                  ? this.list.parser(p)
                  : rc === 123
                  ? this.map.parser(p)
                  : this.variable.parser(p);
              if (ok) {
                const rhs = p.nodes.pop();
                p.nodes.pop();
                const inNode = new m.AstNode(this.elementInObj, s, start, p.index);
                inNode.children = [lhs, rhs];
                p.nodes.push(inNode);
                return true;
              }
            }
            p.index = afterLhs;
          } else if (s.startsWith(" ? ", afterLhs)) {
            p.index = afterLhs + 3;
            if (parsePrimitive(p)) {
              if (s.startsWith(" : ", p.index)) {
                p.index += 3;
                if (parsePrimitive(p)) {
                  const falseVal = p.nodes.pop();
                  const trueVal = p.nodes.pop();
                  p.nodes.pop();
                  const ternRule = lhsName === "boolean" ? this.ternary : this.ternaryTypeMismatch;
                  const ternNode = new m.AstNode(ternRule, s, start, p.index);
                  ternNode.children = [lhs, trueVal, falseVal];
                  p.nodes.push(ternNode);
                  return true;
                }
              }
              p.nodes.pop();
            }
            p.index = afterLhs;
          }
        }
      }

      if (!allowStandaloneNonLogical && isNonLogicalStandalone(lhsName)) {
        p.nodes.pop();
        p.index = start;
        return false;
      }
      return true;
    };

    this.parenthesized = createFastCompositeRule(m, (p: any, rule: any): boolean => {
      const s = p.input;
      const len = p.length;
      const start = p.index;
      if (start >= len || s.charCodeAt(start) !== 40) {
        return false;
      }
      const savedNodes = p.nodes;
      const children: any[] = [];
      p.nodes = children;
      p.index = start + 1;
      m.ws.lexer(p);
      if (!this.expr.parser(p)) {
        p.nodes = savedNodes;
        p.index = start;
        return false;
      }
      m.ws.lexer(p);
      if (p.index >= len || s.charCodeAt(p.index) !== 41) {
        p.nodes = savedNodes;
        p.index = start;
        return false;
      }
      p.index++;
      p.nodes = savedNodes;
      const node = new m.AstNode(rule, s, start, p.index);
      node.children = children;
      savedNodes.push(node);
      return true;
    });

    this.logicalNot = createFastCompositeRule(m, (p: any, rule: any): boolean => {
      const s = p.input;
      const start = p.index;
      if (start >= p.length || s.charCodeAt(start) !== 33) {
        return false;
      }
      const savedNodes = p.nodes;
      const children: any[] = [];
      p.nodes = children;
      p.index = start + 1;
      if (!parseOperand(p, false)) {
        p.nodes = savedNodes;
        p.index = start;
        return false;
      }
      p.nodes = savedNodes;
      const node = new m.AstNode(rule, s, start, p.index);
      node.children = children;
      savedNodes.push(node);
      return true;
    });

    const parseAndChain = (p: any, allowStandaloneNonLogical: boolean): boolean => {
      const s = p.input;
      const len = p.length;
      const start = p.index;
      const nodeStart = p.nodes.length;
      if (!parseOperand(p, allowStandaloneNonLogical)) {
        return false;
      }
      if (isNonLogicalStandalone(p.nodes[nodeStart].name)) {
        return true;
      }
      while (p.index < len) {
        const savedIdx = p.index;
        let idx = s.charCodeAt(savedIdx) === 32 ? savedIdx + 1 : savedIdx;
        if (idx + 1 < len && s.charCodeAt(idx) === 38 && s.charCodeAt(idx + 1) === 38) {
          idx += 2;
          if (idx < len && s.charCodeAt(idx) === 32) {
            idx++;
          }
          p.index = idx;
          if (parseOperand(p, false)) {
            continue;
          }
          p.index = savedIdx;
        }
        break;
      }
      if (p.nodes.length > nodeStart + 1) {
        const children = p.nodes.slice(nodeStart);
        p.nodes.length = nodeStart;
        const andNode = new m.AstNode(this.logicalAnd, s, start, p.index);
        andNode.children = children;
        p.nodes.push(andNode);
      }
      return true;
    };

    const parseOrChain = (p: any, allowStandaloneNonLogical: boolean): boolean => {
      const s = p.input;
      const len = p.length;
      const start = p.index;
      const nodeStart = p.nodes.length;
      if (!parseAndChain(p, allowStandaloneNonLogical)) {
        return allowStandaloneNonLogical ? this.comparable.parser(p) : false;
      }
      if (isNonLogicalStandalone(p.nodes[nodeStart].name)) {
        return true;
      }
      while (p.index < len) {
        const savedIdx = p.index;
        let idx = s.charCodeAt(savedIdx) === 32 ? savedIdx + 1 : savedIdx;
        if (idx + 1 < len && s.charCodeAt(idx) === 124 && s.charCodeAt(idx + 1) === 124) {
          idx += 2;
          if (idx < len && s.charCodeAt(idx) === 32) {
            idx++;
          }
          p.index = idx;
          if (parseAndChain(p, false)) {
            continue;
          }
          p.index = savedIdx;
        }
        break;
      }
      if (p.nodes.length > nodeStart + 1) {
        const children = p.nodes.slice(nodeStart);
        p.nodes.length = nodeStart;
        const orNode = new m.AstNode(this.logicalOr, s, start, p.index);
        orNode.children = children;
        p.nodes.push(orNode);
      }
      return true;
    };

    this.logicalAnd = new m.AstRule(m.truePredicate);
    this.logicalOr = new m.AstRule(m.truePredicate);

    this.expr = new m.Predicate((p: any): boolean => {
      const start = p.index;
      const nodeStart = p.nodes.length;
      if (!parseOrChain(p, true)) {
        p.index = start;
        return false;
      }
      while (p.index < p.length) {
        const prevIndex = p.index;
        if (!parseOrChain(p, true) || p.index === prevIndex) {
          break;
        }
      }
      if (p.nodes.length === nodeStart) {
        p.index = start;
        return false;
      }
      return true;
    });
  }();

  const registered = m.registerGrammar("cel-spec", grammar, grammar.expr);
  const rootAstRule = grammar.expr.ast;
  m.parsers["cel-spec"] = (text: string): any => {
    const nodes: any[] = [];
    const p = new m.ParseState(text, 0, nodes);
    if (!grammar.expr.parser(p)) {
      return null;
    }
    const node = new m.AstNode(rootAstRule, text, 0, p.index);
    node.children = nodes;
    return node;
  };
  return registered;
}
