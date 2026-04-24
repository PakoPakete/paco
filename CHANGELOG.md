# Changelog

All notable changes to PACO will be documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.3.1] – 2026-04-24

### Fixed
- Activity bar icon: replaced large PNG with optimized SVG icon

---

## [0.3.0] – 2026-04-24

### Added
- Version bump to 0.3.0

---

## [0.2.0] – 2025-04-24

### Added
- Activity bar icon: PACO now appears in the VS Code sidebar with its own icon.
  Click it to open the welcome panel and launch the editor with one click.

### Fixed
- `tsconfig.json`: added `node` and `mocha` to `types` to resolve compilation
  errors with `fs` and test globals.

---

## [0.1.0] – 2025-04-24

### Added
- First public release.
- Visual Blockly-based block editor integrated as a VS Code webview.
- Real-time Java code generation from blocks.
- Block categories: Control, Variables, Types, Arrays, Lists, Functions, OOP,
  Functional, Concurrency, I/O, System, Libraries, Advanced.
- Multiple simultaneous editors (each with its own Java document).
- Support for: `if/else`, `while`, `for`, `switch`, `break`, `continue`,
  `return`, ternary operator, `try/catch/finally`, `throw`.
- OOP blocks: class, interface, extends, implements, constructor, method,
  `@Override`, `this`, `new`.
- Concurrency blocks: thread creation, `synchronized`.
- Functional blocks: lambda, `stream().filter()`.
- I/O blocks: `Scanner` (int, String, double), file read/write, URL connection,
  database connection, encryption template.
- `ArrayList` full support (add, remove, clear, insert, set, get, size, contains).
- `HashMap` declaration.
- Enum definition.
- Import library block.

### Fixed
- `controls_switch`: cases body was never parsed because parser looked for
  statement named `'DO'` instead of `'CASES'`.
- `controls_for`: the `BY` (step) field was read but never used; loop always
  incremented by 1. Now generates `i += step` when step ≠ 1.
- `text_equals`: generated invalid Java `(a .equals b)`; now correctly
  generates `a.equals(b)`.
- `text_substring`: had no emitter, always produced `0`; now generates
  `text.substring(start, end)`.
- Removed `modifier_public / private / protected` blocks from the toolbox:
  they had no compatible input in any other block and produced no output.
