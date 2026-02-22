---
trigger: always_on
description: When working on TypeScript and Node.js files
---

# Code Guidelines for: Node.js & TypeScript

When generating, refactoring, or reviewing Node.js and TypeScript code, you must adhere to the principles of _Clean Code_ (Robert C. Martin) and _The Pragmatic Programmer_ (David Thomas & Andrew Hunt), applied through modern TypeScript idioms. Your primary goal is to write code that is type-safe, asynchronous-friendly, and optimized for human readability and maintainability.

## 1. Core Philosophies

- **ETC (Easier to Change):** Every design decision should make the code easier to change in the future.
- **DRY (Don't Repeat Yourself):** Every piece of knowledge must have a single, unambiguous representation. Extract shared utility functions and common types/interfaces.
- **Orthogonality:** Changes in one module (e.g., a database repository) should not affect others (e.g., an Express route handler).

## 2. TypeScript & Type Safety

- **Ban `any`:** Never use the `any` type. If a type is truly unknown at compile time, use `unknown` and implement type guards/narrowing.
- **Strict Typing:** Enable and adhere to `strict` mode in `tsconfig.json`. Always handle `null` and `undefined` explicitly.
- **Interfaces vs. Types:** Use `interface` for defining object shapes and contract definitions (especially when they need to be extended). Use `type` for unions, intersections, and primitive aliases. Do not prefix interfaces with `I` (use `User`, not `IUser`).
- **Leverage Union Types:** Use union types and discriminated unions for state representation rather than complex boolean flags (e.g., `type Status = 'idle' | 'loading' | 'success' | 'error'`).

## 3. Node.js Asynchronous Programming

- **Async/Await Over Callbacks:** Always prefer `async`/`await` over raw Promises (`.then()/.catch()`) or callbacks for better readability and easier error handling.
- **Don't Block the Event Loop:** Offload heavy CPU-bound tasks to Worker Threads or separate microservices. Keep synchronous execution paths short.
- **Concurrent Execution:** Use `Promise.all()` or `Promise.allSettled()` when awaiting multiple independent asynchronous operations, rather than awaiting them sequentially.

## 4. Functions and Architecture

- **Small & Focused:** Functions should do exactly _one_ thing (Single Responsibility Principle).
- **Decoupling & Dependency Injection:** Pass dependencies (like database clients or third-party API services) as arguments or via constructors rather than hardcoding imports inside functions. This makes testing significantly easier.
- **Controller-Service-Repository Pattern:** Separate web transport logic (Express/Fastify routers) from business logic (Services), and separate business logic from data access (Repositories).

## 5. Error Handling

- **Custom Error Classes:** Create specific Error classes that extend the base `Error` object (e.g., `class NotFoundError extends Error`). Include HTTP status codes or error codes within these custom classes if applicable.
- **Centralized Error Handling:** In Node.js web frameworks, pass errors down to a centralized error-handling middleware rather than handling HTTP responses in every catch block.
- **Fail Fast & Loudly:** Do not swallow errors. If an unexpected state occurs, throw an error immediately. Always log the error with its stack trace and context.

## 6. Naming Conventions

- **Intention-Revealing:** Use readable English words. Variables and functions should be `camelCase`, classes and interfaces should be `PascalCase`.
- **Action-Oriented Functions:** Function names should be verbs or verb phrases that clearly state what they do (e.g., `getUserById`, `calculateInvoiceTotal`).

## 7. Comments and Documentation

- **Code as Documentation:** Strive to write code so clear and strictly typed that it does not need comments. Let the TypeScript compiler be your primary documentation.
- **Explain _Why_, Not _What_:** Use comments (or JSDoc) only to explain the business reasoning behind a decision, a complex regex, or a necessary hack.
