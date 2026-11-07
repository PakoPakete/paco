# Contribuir a PACO

¡Gracias por querer mejorar PACO! Puedes abrir un [issue](https://github.com/PakoPakete/paco/issues) para contar un error o pedir un bloque, o mandar un pull request.

## Compilar y probar

```
npm install
npm run compile
npm test
```

Pulsa `F5` en VS Code para abrir una ventana de desarrollo con la extensión cargada. `npm test` ejecuta los tests del generador de Java; si hay un `javac` en el PATH, también comprueba que el Java generado compila.

## Añadir un bloque nuevo

1. Define el bloque en `media/index.js` y añádelo al toolbox del mismo archivo.
2. Añade su caso en el parser `src/core/scratch/xmlToIr.ts`.
3. Si necesita un nodo IR nuevo, añade su interfaz en `src/core/ir/nodes.ts`.
4. Añade el caso que genera Java en `src/core/java/irToJava.ts`.
5. Añade un test en `src/test/unit/`.

## Generar el paquete para el Marketplace (.vsix)

El Marketplace no acepta el código fuente: hay que subir un archivo `.vsix`.

```
npm install
npm run vsix
```

Eso crea `paco-<versión>.vsix` en la carpeta del proyecto. Para probarlo antes de publicarlo: en VS Code, `Extensiones` → `...` → `Instalar desde VSIX...`.

## Publicar una versión nueva

1. Sube el número de `version` en `package.json` y añade la entrada en `CHANGELOG.md`.
2. Genera el `.vsix` con `npm run vsix`.
3. Súbelo en [marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage/publishers/FranciscoSZ) (publisher `FranciscoSZ`) con **Update** sobre PACO. También se puede hacer con `npx vsce publish` y un token personal de Azure DevOps.

Las imágenes del README se cargan desde GitHub (`images/screenshots/` no va dentro del `.vsix`), así que conviene fusionar en `master` antes de publicar para que la página del Marketplace las muestre.
