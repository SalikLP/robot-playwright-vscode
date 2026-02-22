/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Low-level string parsing utilities used throughout the transformer pipeline.
 * These functions have no domain knowledge — they operate purely on syntax.
 */

/** Strip outer quotes from a string literal, handling single, double and backtick. */
export function stripQuotes(s: string): string {
  s = s.trim();
  if ((s.startsWith("'") && s.endsWith("'")) ||
      (s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith('`') && s.endsWith('`')))
    return s.slice(1, -1);
  return s;
}

/**
 * Parse the arguments portion of a function call.
 * Handles nested parens, quoted strings, object literals, etc.
 * Returns an array of top-level argument strings (untrimmed).
 */
export function parseArgs(argsStr: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let current = '';
  let inString: string | null = null;
  let escape = false;

  for (const ch of argsStr) {
    if (escape) {
      current += ch;
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      current += ch;
      continue;
    }
    if (inString) {
      current += ch;
      if (ch === inString)
        inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch;
      current += ch;
      continue;
    }
    if (ch === '(' || ch === '{' || ch === '[') {
      depth++;
      current += ch;
      continue;
    }
    if (ch === ')' || ch === '}' || ch === ']') {
      depth--;
      current += ch;
      continue;
    }
    if (ch === ',' && depth === 0) {
      result.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim())
    result.push(current);
  return result;
}

/**
 * Given an object-literal string like `{ name: 'foo', exact: true }`,
 * return a map of key-value pairs where keys are unquoted and values are raw strings.
 */
export function parseObjectLiteral(obj: string): Record<string, string> {
  const result: Record<string, string> = {};
  obj = obj.trim();
  if (obj.startsWith('{'))
    obj = obj.slice(1);
  if (obj.endsWith('}'))
    obj = obj.slice(0, -1);

  const pairs = parseArgs(obj);
  for (const pair of pairs) {
    const colonIdx = pair.indexOf(':');
    if (colonIdx === -1)
      continue;
    const key = pair.slice(0, colonIdx).trim();
    const value = pair.slice(colonIdx + 1).trim();
    result[key] = value;
  }
  return result;
}

/**
 * Split a chained expression like `page.locator('sel').click()` into
 * { target: "page.locator('sel')", action: "click", actionArgs: "" }.
 */
export function splitLastCall(expr: string): { target: string; action: string; actionArgs: string } | null {
  let depth = 0;
  let i = expr.length - 1;

  if (expr[i] !== ')')
    return null;

  for (; i >= 0; i--) {
    if (expr[i] === ')')
      depth++;
    else if (expr[i] === '(')
      depth--;
    if (depth === 0)
      break;
  }
  const argsStart = i;
  const dotMethod = expr.slice(0, argsStart);
  const lastDot = dotMethod.lastIndexOf('.');
  if (lastDot === -1)
    return null;

  return {
    target: expr.slice(0, lastDot),
    action: expr.slice(lastDot + 1, argsStart),
    actionArgs: expr.slice(argsStart + 1, expr.length - 1),
  };
}
