---
trigger: always_on
---

# Code Guidelines: Clean & Pragmatic Code

When generating, refactoring, or reviewing code, you must adhere to the principles of _Clean Code_ (Robert C. Martin) and _The Pragmatic Programmer_ (David Thomas & Andrew Hunt). Your primary goal is to write code that is optimized for human readability, maintainability, and adaptability.

## 1. Core Philosophies

- **ETC (Easier to Change):** Every design decision should make the code easier to change in the future.
- **DRY (Don't Repeat Yourself):** Every piece of knowledge must have a single, unambiguous, authoritative representation within a system.
- **Orthogonality:** Eliminate effects between unrelated things. Changes in one module should not affect others.
- **Boy Scout Rule:** Always leave the code cleaner than you found it.

## 2. Naming Conventions

- **Intention-Revealing:** Names should explicitly state what a variable, function, or class does, why it exists, and how it is used. Avoid magic numbers and single-letter variables (except in short loops).
- **Pronounceable & Searchable:** Use readable English words. Avoid obscure abbreviations.
- **Consistency:** Pick one word for one abstract concept and stick with it (e.g., do not mix `fetch`, `retrieve`, and `get`).

## 3. Functions and Methods

- **Small & Focused:** Functions should be small and do exactly _one_ thing (Single Responsibility Principle).
- **One Level of Abstraction:** Statements within a function should all be at the same level of abstraction.
- **Limit Arguments:** Ideal functions have zero, one, or two arguments. Three is the maximum. Group related arguments into objects if necessary.
- **No Side Effects:** Functions should not do hidden things. If a function checks a password, it should not also initialize a session.
- **Command-Query Separation:** A function should either change the state of an object or return information about that object, never both.

## 4. Architecture and Design

- **Law of Demeter (Tell, Don't Ask):** Modules should not know about the inner workings of the objects they manipulate. Tell objects what to do, do not ask them for their state to make decisions on their behalf.
- **Decoupling:** Depend on abstractions (interfaces), not concretions.
- **Fail Fast:** Problems should be reported as soon as possible. Do not swallow errors or mask unexpected states.

## 5. Error Handling

- **Use Exceptions:** Prefer throwing exceptions over returning error codes.
- **Extract Error Handling:** Error handling is "one thing." A function that handles errors should do nothing else.
- **Provide Context:** Error messages should provide enough context to identify the source and reason for the failure.

## 6. Comments and Documentation

- **Code as Documentation:** Strive to write code so clear and expressive that it does not need comments.
- **Explain _Why_, Not _What_:** Use comments only to explain the reasoning behind a decision, a business rule, or a necessary hack, never to explain what the code is doing.
- **No Dead Code:** Do not leave commented-out code. Delete it; version control will remember it.
