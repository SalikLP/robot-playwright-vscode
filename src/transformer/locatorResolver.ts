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
 * Translates Playwright locator chains into Robot Framework selectors.
 *
 * Handles single locators (getByRole, getByText, locator, …) and compound
 * chains joined with `>>`.
 */

import { stripQuotes, parseArgs, parseObjectLiteral, splitLastCall } from './parseHelpers';

export interface LocatorResult {
  /** Lines to prepend (e.g. Get Element By Role variable assignment) */
  prefixLines: string[];
  /** The final selector to use with the action keyword */
  selector: string;
}

/**
 * Prefix selectors starting with `#` with `css=` to prevent Robot Framework
 * from interpreting the `#` as an inline comment.
 */
export function escapeSelectorForRobot(selector: string): string {
  return selector.startsWith('#') ? `css=${selector}` : selector;
}

/**
 * Convert a single Playwright locator method call into a Playwright selector segment.
 * Returns null if the method is unrecognised.
 */
export function toSelectorSegment(methodName: string, argsStr: string): string | null {
  const args = parseArgs(argsStr);
  switch (methodName) {
    case 'locator':
      return stripQuotes(args[0]);
    case 'getByRole': {
      const role = stripQuotes(args[0]);
      let sel = `role=${role}`;
      if (args.length > 1) {
        const opts = parseObjectLiteral(args[1]);
        if (opts.name) sel += `[name="${stripQuotes(opts.name)}"]`;
        if (opts.exact) sel += `[exact=${stripQuotes(opts.exact)}]`;
      }
      return sel;
    }
    case 'getByText':
      return `text=${stripQuotes(args[0])}`;
    case 'getByLabel':
      return `css=[aria-label="${stripQuotes(args[0])}"]`;
    case 'getByPlaceholder':
      return `css=[placeholder="${stripQuotes(args[0])}"]`;
    case 'getByTestId':
      return `css=[data-testid="${stripQuotes(args[0])}"]`;
    case 'getByAltText':
      return `css=[alt="${stripQuotes(args[0])}"]`;
    case 'getByTitle':
      return `css=[title="${stripQuotes(args[0])}"]`;
    case 'nth':
      return `nth=${stripQuotes(args[0])}`;
    case 'first':
      return 'nth=0';
    case 'last':
      return 'nth=-1';
    default:
      return null;
  }
}

/**
 * Decompose an entire locator chain into a compound Playwright selector.
 * E.g. `page.getByRole('article', { name: '...' }).locator('img')`
 *       → `'role=article[name="..."] >> img'`
 */
export function resolveCompoundSelector(expr: string): string | null {
  const segments: string[] = [];
  let remaining = expr;

  while (remaining !== 'page' && remaining.length > 0) {
    const split = splitLastCall(remaining);
    if (!split) return null;

    const segment = toSelectorSegment(split.action, split.actionArgs);
    if (!segment) return null;

    segments.unshift(segment);
    remaining = split.target;
  }

  if (remaining !== 'page' || segments.length === 0)
    return null;

  return segments.join(' >> ');
}

/**
 * Resolve a Playwright locator chain to a Robot Framework selector.
 *
 * For chained locators (e.g. getByRole(...).locator('img')): uses a compound
 * Playwright selector joined with `>>`.
 * For single getByRole:  uses `Get Element By Role    role    name=...`
 * For single getByText, getByLabel, etc: uses `Get Element By    attribute    value`
 * For plain locator('sel'): returns the CSS/XPath selector directly.
 */
export function resolveLocator(expr: string): LocatorResult {
  // Detect chained locators — if the target (before last call) is more than just 'page',
  // we have a chain like page.getByRole(...).locator('img').
  const chainSplit = splitLastCall(expr);
  if (chainSplit && chainSplit.target !== 'page') {
    const compound = resolveCompoundSelector(expr);
    if (compound)
      return { prefixLines: [], selector: escapeSelectorForRobot(compound) };
  }

  // page.locator('sel')
  const locatorMatch = expr.match(/\.locator\((.+)\)$/s);
  if (locatorMatch)
    return { prefixLines: [], selector: escapeSelectorForRobot(stripQuotes(locatorMatch[1])) };

  // page.getByRole('role', { name: 'n' })
  const roleMatch = expr.match(/\.getByRole\((.+)\)$/s);
  if (roleMatch) {
    const args = parseArgs(roleMatch[1]);
    const role = stripQuotes(args[0]);
    const kwArgs: string[] = [];
    if (args.length > 1) {
      const opts = parseObjectLiteral(args[1]);
      if (opts.name)
        kwArgs.push(`name=${stripQuotes(opts.name)}`);
      if (opts.exact)
        kwArgs.push(`exact=${stripQuotes(opts.exact)}`);
    }
    const kwLine = kwArgs.length
        ? `\${element}=    Get Element By Role    ${role}    ${kwArgs.join('    ')}`
        : `\${element}=    Get Element By Role    ${role}`;
    return { prefixLines: [kwLine], selector: '${element}' };
  }

  // page.getByText('text')
  const textMatch = expr.match(/\.getByText\((.+)\)$/s);
  if (textMatch) {
    const args = parseArgs(textMatch[1]);
    const value = stripQuotes(args[0]);
    return {
      prefixLines: [`\${element}=    Get Element By    text    ${value}`],
      selector: '${element}',
    };
  }

  // page.getByLabel('label')
  const labelMatch = expr.match(/\.getByLabel\((.+)\)$/s);
  if (labelMatch) {
    const args = parseArgs(labelMatch[1]);
    const value = stripQuotes(args[0]);
    return {
      prefixLines: [`\${element}=    Get Element By    label    ${value}`],
      selector: '${element}',
    };
  }

  // page.getByPlaceholder('ph')
  const phMatch = expr.match(/\.getByPlaceholder\((.+)\)$/s);
  if (phMatch) {
    const args = parseArgs(phMatch[1]);
    const value = stripQuotes(args[0]);
    return {
      prefixLines: [`\${element}=    Get Element By    placeholder    ${value}`],
      selector: '${element}',
    };
  }

  // page.getByTestId('id')
  const testIdMatch = expr.match(/\.getByTestId\((.+)\)$/s);
  if (testIdMatch) {
    const args = parseArgs(testIdMatch[1]);
    const value = stripQuotes(args[0]);
    return {
      prefixLines: [`\${element}=    Get Element By    test-id    ${value}`],
      selector: '${element}',
    };
  }

  // page.getByAltText('alt')
  const altMatch = expr.match(/\.getByAltText\((.+)\)$/s);
  if (altMatch) {
    const args = parseArgs(altMatch[1]);
    const value = stripQuotes(args[0]);
    return {
      prefixLines: [`\${element}=    Get Element By    alt    ${value}`],
      selector: '${element}',
    };
  }

  // page.getByTitle('title')
  const titleMatch = expr.match(/\.getByTitle\((.+)\)$/s);
  if (titleMatch) {
    const args = parseArgs(titleMatch[1]);
    const value = stripQuotes(args[0]);
    return {
      prefixLines: [`\${element}=    Get Element By    title    ${value}`],
      selector: '${element}',
    };
  }

  // Fallback: return the expression itself as selector
  return { prefixLines: [], selector: expr };
}
