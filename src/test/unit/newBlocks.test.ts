import * as assert from 'assert';
import { xmlToIr } from '../../core/scratch/xmlToIr';
import { irToJava } from '../../core/java/irToJava';
import { xmlToJavaProgram } from '../../core/java/program';
import { args, block, declareInit, field, num, print, seq, statement, text, typeBlock, value, varGet, xml } from './xmlBuilders';

function toJava(...blocks: string[]): string {
    return irToJava(xmlToIr(xml(...blocks)));
}

function lines(code: string): string[] {
    return code.split('\n').map(l => l.trim()).filter(l => l.length > 0);
}

suite('Fixes to existing blocks', () => {
    test('functions are members of PacoProgram, not statements inside main', () => {
        const java = lines(xmlToJavaProgram(xml(
            block('void_function_definition', field('NAME', 'saludar') + statement('BODY', print(text('hola')))),
            block('function_call', field('NAME', 'saludar') + args()),
        )));
        const mainEnd = java.indexOf('}');
        assert.ok(java.indexOf('saludar();') < mainEnd, 'the call stays in main');
        assert.ok(java.indexOf('public static void saludar() {') > mainEnd, 'the definition comes after main');
    });

    test('classes are static so main can create them', () => {
        const java = xmlToJavaProgram(xml(block('class_definition', field('NAME', 'Perro'))));
        assert.ok(java.includes('public static class Perro {'));
    });

    test('random gives an int between both bounds', () => {
        assert.strictEqual(
            toJava(print(block('math_random_int', value('FROM', num(1)) + value('TO', num(6))))),
            'System.out.println(((int) (Math.random() * ((6) - (1) + 1)) + (1)));\n');
    });

    test('calls take any number of arguments', () => {
        assert.strictEqual(toJava(block('function_call', field('NAME', 'f') + args(num(1), text('a'), varGet('x')))), 'f(1, "a", x);\n');
        assert.strictEqual(
            toJava(declareInit('int', 'r', block('function_call_value', field('NAME', 'suma') + args(num(2), num(3))))),
            'int r = suma(2, 3);\n');
        assert.strictEqual(
            toJava(print(block('object_instantiation', field('CLASS', 'Punto') + args(num(1), num(2))))),
            'System.out.println(new Punto(1, 2));\n');
    });

    test('calls saved with the old single ARGS input still translate', () => {
        assert.strictEqual(toJava(block('function_call', field('NAME', 'f') + value('ARGS', num(7)))), 'f(7);\n');
    });

    test('quotes and stray backslashes in text are escaped, typed escapes are kept', () => {
        assert.strictEqual(toJava(print(text('di "hola"'))), 'System.out.println("di \\"hola\\"");\n');
        assert.strictEqual(toJava(print(text('C:\\datos\\n'))), 'System.out.println("C:\\\\datos\\n");\n');
    });

    test('throw with a message wraps it in a RuntimeException', () => {
        assert.strictEqual(toJava(block('throw_exception', value('EXCEPTION', text('error')))), 'throw new RuntimeException("error");\n');
    });

    test('two "ejecutar en paralelo" blocks use different thread names', () => {
        const java = toJava(seq(
            block('parallel_exec', statement('TASK1', print(num(1))) + statement('TASK2', print(num(2)))),
            block('parallel_exec', statement('TASK1', print(num(3))) + statement('TASK2', print(num(4)))),
        ));
        assert.ok(java.includes('Thread t1 ') && java.includes('Thread t1_2 '));
    });
});

suite('New blocks', () => {
    test('do-while', () => {
        assert.deepStrictEqual(lines(toJava(block('controls_do_while',
            statement('DO', block('variable_increment', field('VAR', 'i'))) + value('BOOL', block('logic_boolean', field('BOOL', 'TRUE')))))),
        ['do {', 'i++;', '} while (true);']);
    });

    test('for-each', () => {
        assert.deepStrictEqual(lines(toJava(block('controls_for_each',
            field('TYPE', 'String') + field('VAR', 'x') + value('COLLECTION', varGet('lista')) + statement('DO', print(varGet('x')))))),
        ['for (String x : lista) {', 'System.out.println(x);', '}']);
    });

    test('classic for counting down', () => {
        assert.strictEqual(lines(toJava(block('controls_for_classic',
            field('VAR', 'i') + value('FROM', num(10)) + field('OP', 'GTE') + value('TO', num(0)) + field('STEP', '--'))))[0],
        'for (int i = 10; (i >= 0); i--) {');
    });

    test('method call, field access and field assignment', () => {
        assert.deepStrictEqual(lines(toJava(seq(
            block('method_call', value('OBJECT', varGet('perro')) + field('METHOD', 'ladrar') + args(num(3))),
            block('field_set', value('OBJECT', block('this_reference')) + field('FIELD', 'edad') + value('VALUE', varGet('edad'))),
            print(block('field_get', value('OBJECT', varGet('perro')) + field('FIELD', 'nombre'))),
        ))), ['perro.ladrar(3);', 'this.edad = edad;', 'System.out.println(perro.nombre);']);
    });

    test('a method called on an expression is parenthesized', () => {
        const concat = block('text_concat', value('A', text('a')) + value('B', text('b')));
        assert.strictEqual(toJava(print(block('text_method', value('TEXT', concat) + field('METHOD', 'toUpperCase')))),
            'System.out.println(("a" + "b").toUpperCase());\n');
    });

    test('print, printf, cast and char literal', () => {
        assert.deepStrictEqual(lines(toJava(seq(
            block('text_print_inline', value('TEXT', text('x'))),
            block('text_printf', field('FORMAT', '%d%n') + args(num(5))),
            declareInit('int', 'n', block('math_cast', field('TYPE', 'int') + value('VALUE', num(3.7)))),
            declareInit('char', 'c', block('char_literal', field('CHAR', 'z'))),
        ))), ['System.out.print("x");', 'System.out.printf("%d%n", 5);', 'int n = (int)(3.7);', "char c = 'z';"]);
    });

    test('dropdown values that are not offered fall back to the first option', () => {
        assert.strictEqual(toJava(print(block('math_function', field('FUNC', 'System.exit') + value('NUM', num(1))))),
            'System.out.println(Math.abs(1));\n');
    });

    test('static and final attributes with a value, abstract classes and methods', () => {
        const java = lines(xmlToJavaProgram(xml(block('class_definition', field('NAME', 'Figura') + field('ABSTRACT', 'TRUE') +
            statement('ATTRIBUTES', block('attribute_declaration', field('MODIFIER', 'public') + field('STATIC', 'TRUE') +
                field('FINAL', 'TRUE') + field('TYPE', 'int') + field('NAME', 'LADOS') + value('VALUE', num(0)))) +
            statement('METHODS', block('abstract_method', field('MODIFIER', 'public') + field('RETURN_TYPE', 'double') + field('NAME', 'area')))))));
        assert.ok(java.includes('public static abstract class Figura {'));
        assert.ok(java.includes('public static final int LADOS = 0;'));
        assert.ok(java.includes('public abstract double area();'));
    });

    test('top-level constants become static final members', () => {
        const java = lines(xmlToJavaProgram(xml(
            block('constant_declaration', value('TYPE', typeBlock('int')) + field('NAME', 'MAX') + value('VALUE', num(10))))));
        assert.ok(java.includes('static final int MAX = 10;'));
    });

    test('several catch clauses', () => {
        const java = lines(toJava(block('try_multi_catch', statement('TRY', print(num(1))) + statement('CATCHES',
            block('catch_clause', field('TYPE', 'IllegalStateException | ArithmeticException') + field('VAR', 'e')),
            block('catch_clause', field('TYPE', 'Exception') + field('VAR', 'e'))))));
        assert.deepStrictEqual(java, [
            'try {', 'System.out.println(1);',
            '} catch (IllegalStateException | ArithmeticException e) {',
            '} catch (Exception e) {', '}']);
    });

    test('2D arrays and other collections', () => {
        assert.deepStrictEqual(lines(toJava(seq(
            block('array2d_declaration', value('TYPE', typeBlock('double')) + field('VAR', 'm') + value('ROWS', num(2)) + value('COLS', num(3))),
            block('collection_declaration', field('COLLECTION', 'Stack') + field('ELEMENT_TYPE', 'Integer') + field('NAME', 'pila')),
            block('collections_util', field('FUNC', 'Collections.sort') + field('NAME', 'lista')),
        ))), [
            'double[][] m = new double[2][3];',
            'java.util.Stack<Integer> pila = new java.util.Stack<>();',
            'java.util.Collections.sort(lista);',
        ]);
    });
});
