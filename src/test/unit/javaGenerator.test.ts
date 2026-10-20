import * as assert from 'assert';
import { xmlToIr } from '../../core/scratch/xmlToIr';
import { irToJava } from '../../core/java/irToJava';
import { xmlToJavaProgram } from '../../core/java/program';
import { IRFor, IRSwitch } from '../../core/ir/nodes';
import { block, declareInit, field, num, print, seq, statement, text, value, varGet, xml } from './xmlBuilders';

function toJava(...blocks: string[]): string {
    return irToJava(xmlToIr(xml(...blocks)));
}

/** Collapses indentation so assertions focus on the code, not the whitespace. */
function lines(code: string): string[] {
    return code.split('\n').map(l => l.trim()).filter(l => l.length > 0);
}

suite('XML → IR', () => {
    test('empty workspace yields no nodes', () => {
        assert.deepStrictEqual(xmlToIr(xml()), []);
    });

    test('stacked blocks are read in order through <next>', () => {
        const ir = xmlToIr(xml(seq(print(text('a')), print(text('b')))));
        assert.deepStrictEqual(ir, [
            { kind: 'print', value: { kind: 'string', value: 'a' } },
            { kind: 'print', value: { kind: 'string', value: 'b' } },
        ]);
    });

    test('switch keeps case values and default', () => {
        const ir = xmlToIr(xml(block('controls_switch',
            value('EXPR', varGet('x')) +
            statement('CASES',
                block('controls_case', value('CASE', num(1)) + statement('STATEMENT', print(text('uno')))),
                block('controls_default', statement('STATEMENT', print(text('otro')))),
            ))));
        const sw = ir[0] as IRSwitch;
        assert.strictEqual(sw.kind, 'switch');
        assert.deepStrictEqual(sw.expr, { kind: 'var_ref', name: 'x' });
        assert.strictEqual(sw.cases.length, 2);
        assert.deepStrictEqual(sw.cases[0].value, { kind: 'number', value: 1 });
        assert.strictEqual(sw.cases[1].value, undefined);
    });

    test('for with step 1 uses an increment, other steps use var_change', () => {
        const forBlock = (by: number) => block('controls_for',
            field('VAR', 'i') + value('FROM', num(0)) + value('TO', num(10)) + value('BY', num(by)));
        const step1 = xmlToIr(xml(forBlock(1)))[0] as IRFor;
        const step3 = xmlToIr(xml(forBlock(3)))[0] as IRFor;
        assert.strictEqual(step1.increment?.kind, 'var_increment');
        assert.strictEqual(step3.increment?.kind, 'var_change');
    });

    test('blocks with missing inputs fall back to defaults instead of throwing', () => {
        const ir = xmlToIr(xml(block('text_print')));
        assert.deepStrictEqual(ir, [{ kind: 'print', value: { kind: 'string', value: '' } }]);
    });
});

suite('IR → Java', () => {
    suite('switch', () => {
        const caseBlock = (n: number, ...body: string[]) =>
            block('controls_case', value('CASE', num(n)) + statement('STATEMENT', ...body));
        const switchOn = (...cases: string[]) =>
            block('controls_switch', value('EXPR', varGet('x')) + statement('CASES', ...cases));

        test('emits case labels, default and an automatic break per case', () => {
            const java = toJava(switchOn(
                caseBlock(1, print(text('uno'))),
                block('controls_default', statement('STATEMENT', print(text('otro')))),
            ));
            assert.deepStrictEqual(lines(java), [
                'switch (x) {',
                'case 1:',
                'System.out.println("uno");',
                'break;',
                'default:',
                'System.out.println("otro");',
                'break;',
                '}',
            ]);
        });

        test('does not add a second (unreachable) break after an explicit one', () => {
            const java = toJava(switchOn(caseBlock(2, print(text('dos')), block('controls_break'))));
            assert.strictEqual(lines(java).filter(l => l === 'break;').length, 1);
        });

        test('string case values are quoted', () => {
            const java = toJava(block('controls_switch', value('EXPR', varGet('op')) + statement('CASES',
                block('controls_case', value('CASE', text('+')) + statement('STATEMENT', print(text('suma')))))));
            assert.ok(java.includes('case "+":'), java);
        });
    });

    suite('for', () => {
        const forLoop = (from: number, to: number, by: number | null) => block('controls_for',
            field('VAR', 'i') + value('FROM', num(from)) + value('TO', num(to)) +
            (by === null ? '' : value('BY', num(by))) +
            statement('DO', print(varGet('i'))));

        test('step 1 emits i++', () => {
            assert.strictEqual(lines(toJava(forLoop(1, 10, 1)))[0], 'for (int i = 1; (i <= 10); i++) {');
        });

        test('missing step defaults to i++', () => {
            assert.strictEqual(lines(toJava(forLoop(1, 10, null)))[0], 'for (int i = 1; (i <= 10); i++) {');
        });

        test('positive step emits i += step', () => {
            assert.strictEqual(lines(toJava(forLoop(0, 10, 2)))[0], 'for (int i = 0; (i <= 10); i += 2) {');
        });

        test('negative step counts down with >=', () => {
            assert.strictEqual(lines(toJava(forLoop(10, 0, -2)))[0], 'for (int i = 10; (i >= 0); i += -2) {');
        });

        test('loop variable is scoped to the loop', () => {
            const java = toJava(seq(forLoop(0, 3, 1), block('variables_set', field('VAR', 'i') + value('VALUE', num(5)))));
            assert.ok(java.includes('var i = 5;'), java);
        });
    });

    suite('text', () => {
        test('substring casts both bounds to int', () => {
            const java = toJava(print(block('text_substring',
                value('TEXT', varGet('nombre')) + value('START', num(0)) + value('END', num(3)))));
            assert.strictEqual(java, 'System.out.println(nombre.substring((int)(0), (int)(3)));\n');
        });

        test('length, charAt and contains', () => {
            assert.strictEqual(
                toJava(print(block('text_length', value('TEXT', text('hola'))))),
                'System.out.println("hola".length());\n');
            assert.strictEqual(
                toJava(print(block('text_char_at', value('TEXT', varGet('s')) + value('INDEX', num(1))))),
                'System.out.println(s.charAt(1));\n');
            assert.strictEqual(
                toJava(print(block('text_contains', value('TEXT', varGet('s')) + value('SEARCH', text('a'))))),
                'System.out.println(s.contains("a"));\n');
        });

        test('text equality uses .equals, not ==', () => {
            const java = toJava(block('controls_if', value('IF0',
                block('text_equals', value('A', varGet('s')) + value('B', text('si')))) +
                statement('DO0', print(text('ok')))));
            assert.ok(java.startsWith('if (s.equals("si")) {'), java);
        });
    });

    suite('HashMap', () => {
        test('declaration, put, get, containsKey and remove', () => {
            const java = toJava(seq(
                block('map_declaration', field('KEY_TYPE', 'String') + field('VALUE_TYPE', 'Integer') + field('NAME', 'edades')),
                block('map_put', field('MAP', 'edades') + value('KEY', text('Ana')) + value('VALUE', num(30))),
                print(block('map_get', field('MAP', 'edades') + value('KEY', text('Ana')))),
                print(block('map_contains_key', field('MAP', 'edades') + value('KEY', text('Luis')))),
                block('map_remove', field('MAP', 'edades') + value('KEY', text('Ana'))),
            ));
            assert.deepStrictEqual(lines(java), [
                'java.util.HashMap<String, Integer> edades = new java.util.HashMap<>();',
                'edades.put("Ana", 30);',
                'System.out.println(edades.get("Ana"));',
                'System.out.println(edades.containsKey("Luis"));',
                'edades.remove("Ana");',
            ]);
        });
    });

    suite('Scanner', () => {
        test('reading input declares a single Scanner at the top', () => {
            const java = toJava(seq(
                declareInit('string', 'nombre', block('input_read_string')),
                declareInit('int', 'edad', block('input_read_int')),
                declareInit('double', 'altura', block('input_read_double')),
            ));
            assert.deepStrictEqual(lines(java), [
                'java.util.Scanner scanner = new java.util.Scanner(System.in);',
                'String nombre = scanner.nextLine();',
                'int edad = scanner.nextInt();',
                'double altura = scanner.nextDouble();',
            ]);
        });

        test('no Scanner is declared when nothing reads input', () => {
            assert.ok(!toJava(print(text('hola'))).includes('Scanner'));
        });
    });

    suite('variables and expressions', () => {
        test('first assignment declares with var, later ones reassign', () => {
            const set = (n: number) => block('variables_set', field('VAR', 'x') + value('VALUE', num(n)));
            assert.deepStrictEqual(lines(toJava(seq(set(1), set(2)))), ['var x = 1;', 'x = 2;']);
        });

        test('power maps to Math.pow', () => {
            const java = toJava(print(block('math_arithmetic',
                field('OP', 'POWER') + value('A', num(2)) + value('B', num(8)))));
            assert.strictEqual(java, 'System.out.println(Math.pow(2, 8));\n');
        });

        test('identifiers are sanitized into valid Java names', () => {
            assert.strictEqual(toJava(print(varGet('mi variable'))), 'System.out.println(mi_variable);\n');
            assert.strictEqual(toJava(print(varGet('1x'))), 'System.out.println(_1x);\n');
        });

        test('if / else if / else chain', () => {
            const cmp = (n: number) => block('logic_compare',
                field('OP', 'LT') + value('A', varGet('x')) + value('B', num(n)));
            const java = toJava(block('controls_if',
                '<mutation elseif="1" else="1"></mutation>' +
                value('IF0', cmp(0)) + statement('DO0', print(text('neg'))) +
                value('IF1', cmp(10)) + statement('DO1', print(text('chico'))) +
                statement('ELSE', print(text('grande')))));
            assert.deepStrictEqual(lines(java), [
                'if ((x < 0)) {',
                'System.out.println("neg");',
                '} else if ((x < 10)) {',
                'System.out.println("chico");',
                '} else {',
                'System.out.println("grande");',
                '}',
            ]);
        });
    });
});

suite('Full program', () => {
    test('wraps the main body in PacoProgram.main and hoists imports and classes', () => {
        const java = xmlToJavaProgram(xml(
            block('import_library', field('LIBRARY', 'java.util.List')),
            print(text('hola')),
            block('class_definition', field('NAME', 'Perro')),
        ));
        const l = lines(java);
        assert.strictEqual(l[0], 'import java.util.List;');
        assert.ok(l.indexOf('public class PacoProgram {') < l.indexOf('public static void main(String[] args) {'));
        assert.ok(l.indexOf('System.out.println("hola");') < l.indexOf('public class Perro {'));
    });
});
