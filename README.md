# PACO - Visual Java Editor

**PACO** (Programming Adapter for Code Overlay) - version 0.2.0

Made by **Francisco Solano Žderić**

---

## English

PACO is a Visual Studio Code extension that converts visual Blockly-style blocks into compilable Java code in real time. Designed for learning Java visually, it lets you build programs by dragging blocks and instantly see the equivalent Java code.

### Features

- Visual block editor based on Blockly, integrated directly into VS Code.
- Real-time Java generation: every change in the blocks immediately updates the Java code.
- Java syntax support: control flow, variables, arrays, lists, functions, classes, interfaces, inheritance, exceptions, concurrency, lambdas, I/O, and more.
- Multiple editors: open several independent editors simultaneously.

### Usage

1. Click the PACO icon in the Activity Bar (left sidebar).
2. In the welcome panel that opens, click "Abrir Editor PACO".
3. Two panels open: the block editor (left) and the generated Java code (right).
4. Drag blocks from the toolbox and build your program.

You can also run "PACO: Open Visual Java Editor" from the command palette (Ctrl+Shift+P).

### Requirements

- Visual Studio Code 1.100.0 or higher.
- To compile and run the generated Java code you need the JDK and the Extension Pack for Java.

---

## Español

PACO (Programming Adapter for Code Overlay) es una extension de Visual Studio Code que convierte bloques visuales estilo Scratch en codigo Java compilable, en tiempo real. Diseñada para aprender Java de forma visual, permite construir programas arrastrando bloques y ver al instante el codigo Java equivalente.

### Caracteristicas

- Editor visual de bloques basado en Blockly, integrado directamente en VS Code.
- Generacion de Java en tiempo real: cada cambio en los bloques actualiza el codigo Java automaticamente.
- Soporte amplio de sintaxis Java: control de flujo, variables, arrays, listas, funciones, clases, interfaces, herencia, excepciones, concurrencia, lambdas, E/S y mas.
- Multiples editores: abre varios editores independientes a la vez.

### Uso

1. Haz clic en el icono de PACO en la barra de actividad (barra lateral izquierda).
2. En el panel de bienvenida que se abre, haz clic en "Abrir Editor PACO".
3. Se abren dos paneles: el editor de bloques (izquierda) y el codigo Java generado (derecha).
4. Arrastra bloques desde el menu lateral y construye tu programa.

Tambien puedes ejecutar "PACO: Abrir Editor Visual de Java" desde la paleta de comandos (Ctrl+Shift+P).

### Requisitos

- Visual Studio Code 1.100.0 o superior.
- Para compilar y ejecutar el codigo Java generado necesitas el JDK y la extension Extension Pack for Java.

---

## Development

### Build and run locally

```
npm install
npm run compile
```

Press F5 in VS Code to launch the Extension Development Host.

### Package for distribution

```
npm install -g @vscode/vsce
vsce package
```

### Adding a new block

1. Define the block UI in media/index.js.
2. Add it to the toolbox JSON in the same file.
3. Add a parser case in src/core/scratch/xmlToIr.ts.
4. If it introduces a new IR node, add the interface to src/core/ir/nodes.ts.
5. Add an emitter case in src/core/java/irToJava.ts.

---

## Author

Francisco Solano Žderić  
GitHub: https://github.com/PakoPakete  
VS Marketplace: https://marketplace.visualstudio.com/publishers/FranciscoSZ

## License

MIT - 2025 Francisco Solano Žderić
