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
 * Extracts iframe selectors from Playwright chains that use
 * `.contentFrame()` or `frameLocator()`.
 */

import { stripQuotes } from './parseHelpers';
import { escapeSelectorForRobot } from './locatorResolver';

/**
 * Extract iframe selectors from a chain that uses `.contentFrame()` or `frameLocator()`.
 *
 * Handles patterns like:
 *   page.locator('iframe[title="X"]').contentFrame().getByRole('button').click()
 *   page.locator('iframe[name="A"]').contentFrame().locator('iframe[name="B"]').contentFrame().locator('body').click()
 *   page.frameLocator('iframe#X').locator('inner').click()
 *
 * Returns the iframe selectors and the remaining inner chain (without the iframe parts).
 */
export function extractFrameChain(expr: string): { iframeSelectors: string[]; innerChain: string } {
  const iframeSelectors: string[] = [];
  let remaining = expr;

  // Strip leading 'page.'
  if (remaining.startsWith('page.'))
    remaining = remaining.slice(5);

  // Repeatedly match and consume iframe patterns from the front
  while (true) {
    // Pattern 1: locator('iframe[...]').contentFrame(). with optional .nth(N)/.first()/.last()
    const contentFrameMatch = remaining.match(
        /^locator\(([^)]+)\)(?:\.(nth\((\d+)\)|first\(\)|last\(\)))?\.contentFrame\(\)\./s
    );
    if (contentFrameMatch) {
      let selector = stripQuotes(contentFrameMatch[1]);
      const modifier = contentFrameMatch[2];
      if (modifier?.startsWith('nth('))
        selector += ` >> nth=${contentFrameMatch[3]}`;
      else if (modifier === 'first()')
        selector += ' >> nth=0';
      else if (modifier === 'last()')
        selector += ' >> nth=-1';
      iframeSelectors.push(escapeSelectorForRobot(selector));
      remaining = remaining.slice(contentFrameMatch[0].length);
      continue;
    }

    // Pattern 2: frameLocator('iframe[...]').
    const frameLocatorMatch = remaining.match(/^frameLocator\(([^)]+)\)\./s);
    if (frameLocatorMatch) {
      iframeSelectors.push(escapeSelectorForRobot(stripQuotes(frameLocatorMatch[1])));
      remaining = remaining.slice(frameLocatorMatch[0].length);
      continue;
    }

    break;
  }

  return { iframeSelectors, innerChain: remaining };
}
