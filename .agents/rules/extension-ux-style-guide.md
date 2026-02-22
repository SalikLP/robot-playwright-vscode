---
trigger: always_on
description: When working on UI/UX for the extension
---

# Code Guidelines: VS Code Extension UX

When generating or refactoring VS Code extensions, you must strictly adhere to the [VS Code UX Guidelines](https://code.visualstudio.com/api/ux-guidelines/overview). The primary goal is to create extensions that feel like a native, seamless part of the editor, prioritizing user workflow, performance, and visual consistency.

## 1. Core Philosophy: Native First

- **Native over Custom (ETC - Easier to Change):** Webviews should be an absolute last resort. Always attempt to use native UI components (`Tree Views`, `Quick Picks`, `Input Boxes`) before rendering custom HTML/CSS. Native components are faster, accessible by default, and automatically adapt to VS Code updates.
- **Seamless Integration:** Your extension should not feel like a bolted-on external application. It must respect the user's workspace and existing workflows.

## 2. Architecture and Containers

- **Logical Placement:** Place UI contributions where users intuitively expect them based on VS Code's container model:
  - **Activity Bar & Sidebars:** For core navigation and persistent, hierarchical data (Tree Views).
  - **Panel:** For transient data, outputs, problems, or terminal-like interfaces.
  - **Editor Area:** For direct file manipulation or complex custom editors.
- **Status Bar Discipline:** Use the Status Bar strictly for passive, contextual information (Left = Workspace scope; Right = Active File scope). Do not clutter it.
- **Orthogonal Layouts:** Remember that users can drag and drop Views between the Sidebar and Panel. Do not hardcode assumptions about where a View will be rendered.

## 3. User Interactions and Commands

- **Command Palette First:** Every core action your extension performs must be registered and accessible via the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
- **Non-Intrusive Notifications:** Do not spam the user with `window.showInformationMessage`. Use notifications only for critical, actionable alerts. For background processes, use the Progress API (`window.withProgress`) or passive Status Bar updates.
- **Keyboard-Driven Input:** Use `window.showQuickPick` and `window.showInputBox` to capture user input rapidly without forcing them to take their hands off the keyboard.

## 4. Visuals and Theming (DRY Principle)

- **Never Hardcode Colors:** Always use VS Code's `ThemeColor` API (e.g., `new vscode.ThemeColor('button.background')`) or CSS variables in Webviews (e.g., `var(--vscode-button-background)`). The extension must flawlessly adapt to any user theme (Dark, Light, High Contrast).
- **Use Product Icons:** Rely on VS Code's built-in Product Icons (using the `$(icon-name)` syntax) in Tree Views, Status Bar items, and Quick Picks rather than bundling custom SVGs. This ensures visual harmony and reduces extension size.

## 5. Onboarding and Configuration

- **Native Walkthroughs:** Use the `walkthroughs` contribution point in `package.json` for multi-step onboarding and setup guides. Do not force-open a custom "Welcome" Webview on the first launch.
- **Settings Editor:** Expose configurations via the native VS Code Settings UI. Provide sensible defaults, clear markdown descriptions, and use strict types (booleans, enums, strings) to prevent invalid configurations.
- **Context Menus:** Add actions to Context Menus (right-click) only when highly relevant to the specific file type or explorer item. Use `when` clauses to hide commands when they are not applicable.
