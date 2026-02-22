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
 * Maps a Playwright `expect(…).toX()` assertion to the corresponding
 * Robot Framework Browser library keyword.
 */

/**
 * Given a Playwright assertion name, the resolved selector, and the assertion
 * argument, return the Robot Framework keyword line.
 */
export function mapAssertionToKeyword(assertion: string, selector: string, assertionArg: string): string {
  switch (assertion) {
    case 'toBeVisible':
      return `Get Element States    ${selector}    contains    visible`;
    case 'toBeHidden':
      return `Get Element States    ${selector}    contains    hidden`;
    case 'toBeEnabled':
      return `Get Element States    ${selector}    contains    enabled`;
    case 'toBeDisabled':
      return `Get Element States    ${selector}    contains    disabled`;
    case 'toContainText':
      return `Get Text    ${selector}    contains    ${assertionArg}`;
    case 'toHaveText':
      return `Get Text    ${selector}    ==    ${assertionArg}`;
    case 'toHaveValue':
      return `Get Text    ${selector}    ==    ${assertionArg}`;
    default:
      return `# Unsupported assertion: ${assertion}`;
  }
}
