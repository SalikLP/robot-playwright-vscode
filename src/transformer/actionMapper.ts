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
 * Maps a Playwright element action (click, fill, type, …) to the
 * corresponding Robot Framework Browser library keyword.
 */

import { stripQuotes } from './parseHelpers';

/**
 * Given a Playwright action name, the resolved selector, and parsed arguments,
 * return the Robot Framework keyword line.
 */
export function mapActionToKeyword(action: string, selector: string, args: string[]): string {
  switch (action) {
    case 'click':
      return `Click    ${selector}`;
    case 'dblclick':
      return `Click    ${selector}    clickCount=2`;
    case 'fill':
      return `Fill Text    ${selector}    ${args.length ? stripQuotes(args[0]) : ''}`;
    case 'type':
      return `Type Text    ${selector}    ${args.length ? stripQuotes(args[0]) : ''}`;
    case 'press':
      return `Keyboard Key    press    ${args.length ? stripQuotes(args[0]) : ''}`;
    case 'check':
      return `Check Checkbox    ${selector}`;
    case 'uncheck':
      return `Uncheck Checkbox    ${selector}`;
    case 'selectOption':
      return `Select Options By    ${selector}    value    ${args.length ? stripQuotes(args[0]) : ''}`;
    case 'hover':
      return `Hover    ${selector}`;
    case 'focus':
      return `Focus    ${selector}`;
    case 'setInputFiles':
      return `Upload File By Selector    ${selector}    ${args.length ? stripQuotes(args[0]) : ''}`;
    case 'clear':
      return `Clear Text    ${selector}`;
    default:
      return `# Unsupported action: ${action} on ${selector}`;
  }
}
