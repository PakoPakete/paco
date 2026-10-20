# Changelog

All notable changes to PACO will be documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Fixed
- Funciones (`función`, `void función`, `función genérica`) ahora se generan como métodos de `PacoProgram` y no dentro de `main`, así que el programa compila.
- Las clases se generan como `public static class`, para poder crearlas con `new` desde `main`.
- "número aleatorio" devuelve un `int` entre los dos límites, ambos incluidos.
- "llamar función" y "new" aceptan de 0 a 5 argumentos; los programas guardados con la entrada antigua siguen funcionando.
- `main` declara `throws Exception`, así compilan leer archivo, URL, BD, reflexión y comandos.
- Los textos escapan comillas y barras sueltas; `throw new` con un texto genera `new RuntimeException("...")`; dos bloques "ejecutar en paralelo" ya no repiten `t1`/`t2`.

### Added
- Block programs are saved as `.paco` files (Blockly XML). Opening a `.paco` file shows the block editor, and Ctrl+S saves it.
- The block editor keeps its blocks when its tab is hidden and shown again.
- Control: do-while, for-each, for clásico (`<`, `<=`, `>`, `>=`, `++`, `--`, `+=`, `-=`).
- Variables y tipos: `-=`, `*=`, `/=`, `%=`, constantes, tipos `long`, `float`, `short`, `byte` y bloque "tipo" para clases y genéricos.
- Texto: imprimir sin salto de línea, `printf`, carácter `'a'`, métodos de String (`toUpperCase`, `indexOf`, `replace`, `split`...) y conversiones (`Double.parseDouble`, `Character.isDigit`...).
- Matemáticas y lógica: funciones de `Math`, `Math.max/min/pow`, constantes (`Math.PI`, `Integer.MAX_VALUE`...), casting, `null` e `instanceof`.
- Funciones: "valor de función" para usar lo que devuelve.
- Objetos: llamar métodos de un objeto (como instrucción o como valor), leer y asignar atributos (`this.nombre = nombre`), `super` y `super(...)`, clases y métodos abstractos, atributos `static`/`final` con valor, métodos `static` y `throws`, `@Override` con parámetros.
- Errores: try con varios `catch` y multi-catch (`A | B`).
- Arrays 2D, `Arrays.sort`, `Arrays.toString`, `Collections.sort/reverse/shuffle/max/min`.
- Colecciones: `LinkedList`, `HashSet`, `TreeSet`, `Stack`, `ArrayDeque` con sus operaciones, y `getOrDefault`/`keySet`/`values` en mapas.
- Entrada: leer boolean, leer palabra y "¿hay un entero para leer?". Si una función lee del teclado, el `Scanner` pasa a ser un campo compartido.
- Java moderno: `switch` con flechas y como expresión, `record`, `var`, text blocks, `instanceof` con variable, clases genéricas (`Caja<T>`), clases internas y anónimas, varargs (`int...`), lambdas con varias instrucciones, referencias a métodos (`System.out::println`), streams (`filter`, `map`, `sorted`, suma, media, máximo...), `Optional`, `LocalDate`, operadores de bits, `break`/`continue` con etiqueta, `assert`, `ExecutorService`, `join` y `AtomicInteger`.

---

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
