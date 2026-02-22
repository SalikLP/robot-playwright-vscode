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
 * Transforms a Playwright TypeScript action string into Robot Framework
 * Browser library keyword syntax.
 *
 * Uses Browser library keywords:
 *   - Get Element By Role — for getByRole locators
 *   - Get Element By      — for getByText / getByLabel / getByPlaceholder / getByTestId
 *   - Set Selector Prefix — for iframe handling (with >>> ending)
 */

import { stripQuotes, parseArgs, splitLastCall } from './transformer/parseHelpers';
import { resolveLocator } from './transformer/locatorResolver';
import { mapActionToKeyword } from './transformer/actionMapper';
import { mapAssertionToKeyword } from './transformer/assertionMapper';
import { extractFrameChain } from './transformer/iframeHandler';

// ─── glue utilities ─────────────────────────────────────────────────────────

/** Strip `await` prefix and trailing semicolon from a Playwright action. */
function cleanAction(action: string): string {
  const line = action.trim();
  const stripped = line.startsWith('await ') ? line.slice(6) : line;
  return stripped.endsWith(';') ? stripped.slice(0, -1).trim() : stripped;
}

/** Join prefix lines + action line into a multi-line block.
 *  No indentation is added here — indentBlock in the editor handles that. */
function joinLines(prefixLines: string[], actionLine: string): string {
  if (!prefixLines.length)
    return actionLine;
  const allLines = [...prefixLines, ...actionLine.split('\n').map(l => l.trimStart())];
  return allLines.join('\n');
}

// ─── main transformer ───────────────────────────────────────────────────────

/**
 * Main entry point. Transforms a single Playwright TypeScript action into
 * Robot Framework keyword(s). May return multiple lines joined by newlines
 * when element lookup or prefix setup is needed.
 */
export function transformToRobotFramework(action: string): string {
  const clean = cleanAction(action);

  // ─── expect assertions ────────────────────────────────────────────
  const expectMatch = clean.match(/^expect\((.+?)\)\.(to\w+)\(([^)]*)\)$/s);
  if (expectMatch) {
    const locatorExpr = expectMatch[1];
    const assertion = expectMatch[2];
    const assertionArg = expectMatch[3] ? stripQuotes(expectMatch[3]) : '';
    const { prefixLines, selector } = resolveLocator(locatorExpr);
    return joinLines(prefixLines, mapAssertionToKeyword(assertion, selector, assertionArg));
  }

  // ─── contentFrame / frameLocator handling ──────────────────────────
  if (clean.includes('.contentFrame()') || clean.match(/^page\.frameLocator\(/)) {
    const { iframeSelectors, innerChain } = extractFrameChain(clean);
    if (iframeSelectors.length > 0) {
      const prefixSelector = iframeSelectors.join(' >>> ') + ' >>>';
      const innerAction = transformToRobotFramework(`await page.${innerChain}`);
      const prefixLine = `Set Selector Prefix    ${prefixSelector}`;
      return joinLines([prefixLine], innerAction);
    }
  }

  // ─── page.goto ────────────────────────────────────────────────────
  const gotoMatch = clean.match(/^page\.goto\((.+)\)$/s);
  if (gotoMatch)
    return `New Page    ${stripQuotes(gotoMatch[1])}`;

  // ─── page.close ───────────────────────────────────────────────────
  if (clean === 'page.close()')
    return `Close Page`;

  // ─── page.setContent ──────────────────────────────────────────────
  const setContentMatch = clean.match(/^page\.setContent\((.+)\)$/s);
  if (setContentMatch)
    return `Set Page Content    ${stripQuotes(setContentMatch[1])}`;

  // ─── page.waitForTimeout ──────────────────────────────────────────
  const waitMatch = clean.match(/^page\.waitForTimeout\((\d+)\)$/);
  if (waitMatch)
    return `Sleep    ${waitMatch[1]}ms`;

  // ─── chained action on locator ────────────────────────────────────
  const split = splitLastCall(clean);
  if (split && split.target.startsWith('page')) {
    const { prefixLines, selector } = resolveLocator(split.target);
    const args = split.actionArgs ? parseArgs(split.actionArgs) : [];
    return joinLines(prefixLines, mapActionToKeyword(split.action, selector, args));
  }

  // ─── page-level keyboard/mouse ────────────────────────────────────
  const keyboardMatch = clean.match(/^page\.keyboard\.press\((.+)\)$/s);
  if (keyboardMatch)
    return `Keyboard Key    press    ${stripQuotes(keyboardMatch[1])}`;

  const keyboardTypeMatch = clean.match(/^page\.keyboard\.type\((.+)\)$/s);
  if (keyboardTypeMatch)
    return `Keyboard Input    type    ${stripQuotes(keyboardTypeMatch[1])}`;

  // ─── fallback ─────────────────────────────────────────────────────
  return `# Unsupported: ${action.trim()}`;
}

// ─── stateful recorder ──────────────────────────────────────────────────────

/**
 * Stateful wrapper around transformToRobotFramework that tracks the
 * current iframe prefix. Only emits `Set Selector Prefix` when the
 * prefix changes, and restores the previous prefix on transition.
 */
export class RobotFrameworkRecorder {
  private _currentPrefix = '';

  /** Reset state — call when a new recording session starts. */
  reset(): void {
    this._currentPrefix = '';
  }

  /**
   * Transform a Playwright action, deduplicating iframe prefix lines.
   * Returns the Robot Framework keyword(s) to insert.
   */
  transformAction(action: string): string {
    const clean = cleanAction(action);

    // Determine if this action involves an iframe
    const hasFrame = clean.includes('.contentFrame()') || clean.match(/^page\.frameLocator\(/);
    let newPrefix = '';

    if (hasFrame) {
      const { iframeSelectors } = extractFrameChain(clean);
      if (iframeSelectors.length > 0)
        newPrefix = iframeSelectors.join(' >>> ') + ' >>>';
    }

    const transformed = transformToRobotFramework(action);
    const prefixChanged = newPrefix !== this._currentPrefix;

    if (!prefixChanged)
      return this._stripPrefixLines(transformed);

    // Prefix changed — build transition lines
    const lines: string[] = [];

    // Restore old prefix if we were in an iframe context and leaving or switching
    if (this._currentPrefix && !newPrefix) {
      lines.push('Set Selector Prefix    ${old_prefix}');
    }

    this._currentPrefix = newPrefix;

    if (newPrefix) {
      // Save old prefix and set new one
      lines.push(`\${old_prefix}=    Set Selector Prefix    ${newPrefix}`);
    }

    // Add the action itself, without its own prefix line
    const strippedLines = this._stripPrefixLines(transformed)
        .split('\n')
        .map(l => l.trimStart());
    lines.push(...strippedLines);

    return lines.join('\n');
  }

  /** Remove the Set Selector Prefix line from a transformed result. */
  private _stripPrefixLines(transformed: string): string {
    const lines = transformed.split('\n');
    const filtered = lines.filter(l => !l.trim().startsWith('Set Selector Prefix'));
    return filtered.join('\n');
  }
}
