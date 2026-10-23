import * as assert from 'assert';
import { execFileSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { xmlToJavaProgram, PacoFile } from '../../core/java/program';
import { args, block, field, num, print, seq, statement, text, value, varGet, xml } from './xmlBuilders';

const useFile = (name: string) => block('use_file', field('FILE', name));

/** Simula una carpeta con archivos .paco; anota qué archivos se pidieron. */
function folder(files: Record<string, string>) {
    const requested: { name: string; from: string | undefined }[] = [];
    const readFile = (name: string, from: string | undefined): PacoFile | undefined => {
        requested.push({ name, from });
        const fileName = name.endsWith('.paco') ? name : `${name}.paco`;
        return fileName in files ? { id: fileName, xml: files[fileName] } : undefined;
    };
    return { readFile, requested };
}

// Archivo con una clase, una función, una constante, un import y bloques sueltos que no deben pasar al programa
const figuras = xml(
    block('import_library', field('LIBRARY', 'java.util.ArrayList')),
    block('class_definition', field('NAME', 'Circulo')),
    block('void_function_definition', field('NAME', 'saludar') + statement('BODY', print(text('hola')))),
    block('constant_declaration', value('TYPE', block('type_int')) + field('NAME', 'LADOS') + value('VALUE', num(4))),
    print(text('prueba de Figuras')),
);

suite('Programs split across several .paco files', () => {
    test('"usar archivo" brings in the classes, functions, constants and imports of the other file', () => {
        const { readFile, requested } = folder({ 'Figuras.paco': figuras });
        const java = xmlToJavaProgram(xml(seq(
            useFile('Figuras.paco'),
            block('function_call', field('NAME', 'saludar') + args()),
        )), { fileId: 'Main.paco', readFile });

        assert.deepStrictEqual(requested, [{ name: 'Figuras.paco', from: 'Main.paco' }]);
        assert.ok(java.startsWith('import java.util.ArrayList;'));
        assert.ok(java.includes('public static class Circulo {'));
        assert.ok(java.includes('public static void saludar() {'));
        assert.ok(java.includes('static final int LADOS = 4;'));
        assert.ok(java.includes('saludar();'));
        assert.ok(!java.includes('prueba de Figuras'), 'the loose statements of the other file are not run');
    });

    test('the .paco extension is optional', () => {
        const { readFile } = folder({ 'Figuras.paco': figuras });
        assert.ok(xmlToJavaProgram(xml(useFile('Figuras')), { readFile }).includes('class Circulo'));
    });

    test('files used from another file are resolved from that file and included once', () => {
        const { readFile, requested } = folder({
            'Figuras.paco': xml(useFile('Comun.paco'), block('class_definition', field('NAME', 'Circulo'))),
            'Colores.paco': xml(useFile('Comun.paco'), block('class_definition', field('NAME', 'Color'))),
            'Comun.paco': xml(useFile('Figuras.paco'), useFile('Main.paco'), block('class_definition', field('NAME', 'Comun'))),
            'Main.paco': '',
        });
        const java = xmlToJavaProgram(xml(useFile('Figuras.paco'), useFile('Colores.paco')), { fileId: 'Main.paco', readFile });

        assert.strictEqual(java.split('class Comun {').length, 2, 'Comun.paco appears once');
        assert.ok(java.includes('class Circulo {') && java.includes('class Color {'));
        assert.deepStrictEqual(requested[1], { name: 'Comun.paco', from: 'Figuras.paco' });
    });

    test('imports repeated in several files are written once', () => {
        const imp = block('import_library', field('LIBRARY', 'java.util.List'));
        const { readFile } = folder({ 'A.paco': xml(imp) });
        const java = xmlToJavaProgram(xml(imp, useFile('A.paco')), { readFile });
        assert.strictEqual(java.split('import java.util.List;').length, 2);
    });

    test('a missing file is an error the student can read', () => {
        const { readFile } = folder({});
        assert.throws(() => xmlToJavaProgram(xml(useFile('Figuras.paco')), { readFile }), /No se encuentra el archivo "Figuras.paco"/);
        assert.throws(() => xmlToJavaProgram(xml(useFile('Figuras.paco'))), /No se encuentra el archivo "Figuras.paco"/);
    });

    test('an empty file name is ignored', () => {
        assert.ok(xmlToJavaProgram(xml(useFile('  '))).includes('public class PacoProgram {'));
    });

    test('files saved by the editor (indented XML) are read', () => {
        const pretty = '<xml xmlns="https://developers.google.com/blockly/xml">\n  <block type="class_definition" id="a" x="10" y="10">\n'
            + '    <field name="NAME">Circulo</field>\n  </block>\n</xml>\n';
        const { readFile } = folder({ 'Figuras.paco': pretty });
        assert.ok(xmlToJavaProgram(xml(useFile('Figuras.paco')), { readFile }).includes('class Circulo {'));
    });

    test('an empty file adds nothing', () => {
        const { readFile } = folder({ 'Vacio.paco': '' });
        assert.ok(xmlToJavaProgram(xml(print(text('hola')), useFile('Vacio.paco')), { readFile }).includes('System.out.println("hola");'));
    });

    test('the program compiles with javac', function () {
        if (spawnSync('javac', ['-version'], { stdio: 'ignore' }).status !== 0) {
            this.skip();
        }
        const { readFile } = folder({ 'Figuras.paco': figuras });
        const program = xmlToJavaProgram(xml(seq(
            useFile('Figuras.paco'),
            block('function_call', field('NAME', 'saludar') + args()),
            print(varGet('LADOS')),
        )), { readFile });
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'paco-javac-'));
        try {
            fs.writeFileSync(path.join(dir, 'PacoProgram.java'), program);
            execFileSync('javac', ['-d', dir, path.join(dir, 'PacoProgram.java')], { stdio: 'pipe' });
        } catch (err) {
            assert.fail(`${(err as { stderr?: Buffer }).stderr?.toString() ?? err}\n${program}`);
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });
});
