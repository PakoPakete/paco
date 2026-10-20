import * as assert from 'assert';
import { execFileSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { xmlToJavaProgram } from '../../core/java/program';
import { args, block, checkbox, customType, declareInit, field, num, param, print, seq, statement, text, typeBlock, value, varGet, xml } from './xmlBuilders';

// PACO promises compilable Java, so these programs go through a real javac.
// Set PACO_REQUIRE_JAVAC=1 (CI does) to fail instead of skipping when javac is missing.
const hasJavac = spawnSync('javac', ['-version'], { stdio: 'ignore' }).status === 0;

function assertCompiles(program: string): void {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'paco-javac-'));
    try {
        const file = path.join(dir, 'PacoProgram.java');
        fs.writeFileSync(file, program);
        try {
            execFileSync('javac', ['-d', dir, file], { stdio: 'pipe' });
        } catch (err) {
            const stderr = (err as { stderr?: Buffer }).stderr?.toString() ?? String(err);
            assert.fail(`javac rejected the generated program:\n${stderr}\n--- program ---\n${program}`);
        }
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

const programs: { name: string; xml: string }[] = [
    {
        name: 'switch with explicit break and default',
        xml: xml(seq(
            declareInit('int', 'x', num(2)),
            block('controls_switch', value('EXPR', varGet('x')) + statement('CASES',
                block('controls_case', value('CASE', num(1)) + statement('STATEMENT', print(text('uno')))),
                block('controls_case', value('CASE', num(2)) + statement('STATEMENT', print(text('dos')), block('controls_break'))),
                block('controls_default', statement('STATEMENT', print(text('otro')))),
            )),
        )),
    },
    {
        name: 'for loops with positive and negative step',
        xml: xml(seq(
            block('controls_for', field('VAR', 'i') + value('FROM', num(0)) + value('TO', num(10)) +
                value('BY', num(2)) + statement('DO', print(varGet('i')))),
            block('controls_for', field('VAR', 'i') + value('FROM', num(10)) + value('TO', num(0)) +
                value('BY', num(-1)) + statement('DO', print(varGet('i')))),
        )),
    },
    {
        name: 'Scanner input and substring',
        xml: xml(seq(
            declareInit('string', 'nombre', block('input_read_string')),
            declareInit('int', 'edad', block('input_read_int')),
            print(block('text_substring', value('TEXT', varGet('nombre')) + value('START', num(0)) + value('END', num(3)))),
            print(varGet('edad')),
        )),
    },
    {
        name: 'HashMap operations',
        xml: xml(seq(
            block('map_declaration', field('KEY_TYPE', 'String') + field('VALUE_TYPE', 'Integer') + field('NAME', 'edades')),
            block('map_put', field('MAP', 'edades') + value('KEY', text('Ana')) + value('VALUE', num(30))),
            print(block('map_get', field('MAP', 'edades') + value('KEY', text('Ana')))),
            block('map_remove', field('MAP', 'edades') + value('KEY', text('Ana'))),
        )),
    },

    {
        name: 'functions with several arguments and a used return value',
        xml: xml(
            block('function_definition', value('RETURN_TYPE', typeBlock('int')) + field('NAME', 'suma') +
                statement('PARAMS', param('int', 'a'), param('int', 'b')) +
                statement('BODY', block('controls_return', value('VALUE', block('math_arithmetic',
                    field('OP', 'ADD') + value('A', varGet('a')) + value('B', varGet('b'))))))),
            block('void_function_definition', field('NAME', 'saludar') +
                statement('PARAMS', param('string', 'nombre')) +
                statement('BODY', print(block('text_concat', value('A', text('Hola ')) + value('B', varGet('nombre')))))),
            seq(
                block('event_green_flag'),
                block('function_call', field('NAME', 'saludar') + args(text('Ana'))),
                declareInit('int', 'r', block('function_call_value', field('NAME', 'suma') + args(num(2), num(3)))),
                declareInit('int', 'dado', block('math_random_int', value('FROM', num(1)) + value('TO', num(6)))),
                print(varGet('r')),
            ),
        ),
    },
    {
        name: 'abstract class, inheritance, super, fields and method calls',
        xml: xml(
            block('class_definition', field('NAME', 'Animal') + checkbox('ABSTRACT', true) +
                statement('ATTRIBUTES', block('attribute_declaration',
                    field('MODIFIER', 'protected') + field('TYPE', 'String') + field('NAME', 'nombre'))) +
                statement('METHODS',
                    block('constructor_definition', statement('PARAMS', param('string', 'nombre')) +
                        statement('BODY', block('field_set', value('OBJECT', block('this_reference')) +
                            field('FIELD', 'nombre') + value('VALUE', varGet('nombre'))))),
                    block('abstract_method', field('MODIFIER', 'public') + field('RETURN_TYPE', 'String') + field('NAME', 'sonido')),
                    block('method_definition', field('MODIFIER', 'public') + field('RETURN_TYPE', 'String') + field('NAME', 'getNombre') +
                        statement('BODY', block('controls_return', value('VALUE',
                            block('field_get', value('OBJECT', block('this_reference')) + field('FIELD', 'nombre')))))),
                )),
            block('class_extends', field('NAME', 'Perro') + field('PARENT', 'Animal') +
                statement('METHODS',
                    block('constructor_definition', statement('PARAMS', param('string', 'nombre')) +
                        statement('BODY', block('super_constructor_call', args(varGet('nombre'))))),
                    block('method_override', field('MODIFIER', 'public') + field('RETURN_TYPE', 'String') + field('NAME', 'sonido') +
                        statement('BODY', block('controls_return', value('VALUE', text('Guau'))))),
                    block('method_override', field('MODIFIER', 'public') + field('RETURN_TYPE', 'boolean') + field('NAME', 'equals') +
                        statement('PARAMS', block('function_parameter', value('TYPE', customType('Object')) + field('NAME', 'otro'))) +
                        statement('BODY', block('controls_return', value('VALUE',
                            block('method_call_value', value('OBJECT', block('super_reference')) + field('METHOD', 'equals') + args(varGet('otro'))))))),
                )),
            seq(
                block('variable_declaration_init', value('TYPE', customType('Animal')) + field('VAR', 'a') +
                    value('VALUE', block('object_instantiation', field('CLASS', 'Perro') + args(text('Rex'))))),
                print(block('method_call_value', value('OBJECT', varGet('a')) + field('METHOD', 'getNombre') + args())),
                block('method_call', value('OBJECT', varGet('a')) + field('METHOD', 'sonido') + args()),
                print(block('logic_instanceof', value('VALUE', varGet('a')) + field('CLASS', 'Perro'))),
            ),
        ),
    },
    {
        name: 'static and final members and top-level constants',
        xml: xml(
            block('constant_declaration', value('TYPE', typeBlock('double')) + field('NAME', 'IVA') + value('VALUE', num(0.21))),
            block('class_definition', field('NAME', 'Contador') +
                statement('ATTRIBUTES',
                    block('attribute_declaration', field('MODIFIER', 'private') + checkbox('STATIC', true) +
                        field('TYPE', 'int') + field('NAME', 'total') + value('VALUE', num(0))),
                    block('attribute_declaration', field('MODIFIER', 'public') + checkbox('STATIC', true) + checkbox('FINAL', true) +
                        field('TYPE', 'int') + field('NAME', 'MAX') + value('VALUE', num(10))),
                    block('variable_declaration', value('TYPE', customType('java.util.ArrayList<String>')) + field('VAR', 'nombres'))) +
                statement('METHODS',
                    block('method_definition', field('MODIFIER', 'public') + checkbox('STATIC', true) + field('RETURN_TYPE', 'int') +
                        field('NAME', 'siguiente') + statement('BODY',
                            block('variable_increment', field('VAR', 'total')),
                            block('controls_return', value('VALUE', varGet('total'))))))),
            seq(
                print(block('method_call_value', value('OBJECT', varGet('Contador')) + field('METHOD', 'siguiente') + args())),
                print(block('field_get', value('OBJECT', varGet('Contador')) + field('FIELD', 'MAX'))),
                print(varGet('IVA')),
            ),
        ),
    },
    {
        name: 'do-while, for-each, classic for and compound assignment',
        xml: xml(seq(
            block('array_initialization', value('TYPE', typeBlock('int')) + field('VAR', 'nums') + field('VALUES', '3, 1, 2')),
            declareInit('int', 'total', num(1)),
            block('controls_for_each', field('TYPE', 'int') + field('VAR', 'n') + value('COLLECTION', varGet('nums')) +
                statement('DO', block('variable_compound', field('VAR', 'total') + field('OP', '*=') + value('VALUE', varGet('n'))))),
            block('controls_for_classic', field('VAR', 'i') + value('FROM', num(10)) + field('OP', 'GT') + value('TO', num(0)) +
                field('STEP', '-=') + value('BY', num(3)) + statement('DO', print(varGet('i')))),
            declareInit('int', 'k', num(0)),
            block('controls_do_while', statement('DO', block('variable_increment', field('VAR', 'k'))) +
                value('BOOL', block('logic_compare', field('OP', 'LT') + value('A', varGet('k')) + value('B', num(5))))),
        )),
    },
    {
        name: 'text, math and conversion blocks',
        xml: xml(seq(
            declareInit('string', 's', text('Dijo "hola"\\n')),
            block('text_print_inline', value('TEXT', block('text_method', value('TEXT', varGet('s')) + field('METHOD', 'toUpperCase')))),
            block('text_printf', field('FORMAT', '%s tiene %.2f%n') + args(varGet('s'), block('math_constant_java', field('CONSTANT', 'Math.PI')))),
            declareInit('char', 'c', block('char_literal', field('CHAR', "'"))),
            declareInit('int', 'pos', block('text_method_arg', value('TEXT', varGet('s')) + field('METHOD', 'indexOf') + value('ARG', text('h')))),
            print(block('text_replace', value('TEXT', varGet('s')) + value('FROM', text('o')) + value('TO', text('0')))),
            declareInit('double', 'd', block('text_convert', field('FUNC', 'Double.parseDouble') + value('VALUE', text('2.5')))),
            declareInit('int', 'entero', block('math_cast', field('TYPE', 'int') + value('VALUE',
                block('math_function', field('FUNC', 'Math.sqrt') + value('NUM', varGet('d')))))),
            print(block('math_two_args', field('FUNC', 'Math.max') + value('A', varGet('entero')) + value('B', varGet('pos')))),
            block('controls_if', value('IF0', block('text_convert', field('FUNC', 'Character.isDigit') + value('VALUE', varGet('c')))) +
                statement('DO0', print(text('digito')))),
            block('controls_if', value('IF0', block('logic_compare', field('OP', 'NEQ') + value('A', varGet('s')) + value('B', block('logic_null')))) +
                statement('DO0', print(text('no es null')))),
        )),
    },
    {
        name: 'collections, 2D arrays and utilities',
        xml: xml(seq(
            block('collection_declaration', field('COLLECTION', 'Stack') + field('ELEMENT_TYPE', 'Integer') + field('NAME', 'pila')),
            block('collection_do', field('NAME', 'pila') + field('METHOD', 'push') + value('VALUE', num(1))),
            print(block('collection_value', field('NAME', 'pila') + field('METHOD', 'peek'))),
            block('collection_do_no_arg', field('NAME', 'pila') + field('METHOD', 'pop')),
            block('collection_declaration', field('COLLECTION', 'HashSet') + field('ELEMENT_TYPE', 'String') + field('NAME', 'conjunto')),
            block('collection_do', field('NAME', 'conjunto') + field('METHOD', 'add') + value('VALUE', text('a'))),
            block('controls_for_each', field('TYPE', 'String') + field('VAR', 'x') + value('COLLECTION', varGet('conjunto')) +
                statement('DO', print(varGet('x')))),
            block('collection_declaration', field('COLLECTION', 'ArrayDeque') + field('ELEMENT_TYPE', 'Integer') + field('NAME', 'cola')),
            block('collection_do', field('NAME', 'cola') + field('METHOD', 'offer') + value('VALUE', num(2))),
            print(block('collection_value', field('NAME', 'cola') + field('METHOD', 'poll'))),
            block('list_declaration', field('ELEMENT_TYPE', 'Integer') + field('NAME', 'lista')),
            block('list_add', field('LIST', 'lista') + value('VALUE', num(3))),
            block('collections_util', field('FUNC', 'Collections.sort') + field('NAME', 'lista')),
            print(block('util_value', field('FUNC', 'Collections.max') + field('NAME', 'lista'))),
            block('map_declaration', field('KEY_TYPE', 'String') + field('VALUE_TYPE', 'Integer') + field('NAME', 'edades')),
            print(block('map_get_or_default', field('MAP', 'edades') + value('KEY', text('Ana')) + value('DEFAULT', num(0)))),
            block('controls_for_each', field('TYPE', 'String') + field('VAR', 'clave') +
                value('COLLECTION', block('collection_value', field('NAME', 'edades') + field('METHOD', 'keySet'))) +
                statement('DO', print(varGet('clave')))),
            block('array2d_declaration', value('TYPE', typeBlock('int')) + field('VAR', 'm') + value('ROWS', num(2)) + value('COLS', num(2))),
            block('array2d_assignment', field('VAR', 'm') + value('ROW', num(0)) + value('COL', num(1)) + value('VALUE', num(5))),
            print(block('array2d_access', field('VAR', 'm') + value('ROW', num(0)) + value('COL', num(1)))),
            print(block('util_value', field('FUNC', 'Arrays.deepToString') + field('NAME', 'm'))),
        )),
    },
    {
        name: 'multi-catch, throw with a message and checked-exception blocks',
        xml: xml(seq(
            block('try_multi_catch',
                statement('TRY', declareInit('int', 'n', block('text_to_int', value('TEXT', text('abc'))))) +
                statement('CATCHES',
                    block('catch_clause', field('TYPE', 'NumberFormatException | ArithmeticException') + field('VAR', 'e') +
                        statement('DO', print(text('mal número')))),
                    block('catch_clause', field('TYPE', 'Exception') + field('VAR', 'e') +
                        statement('DO', block('throw_exception', value('EXCEPTION', text('falló'))))),
                ) +
                statement('FINALLY', print(text('fin')))),
            block('file_read', field('PATH', 'datos.txt')),
            block('parallel_exec', statement('TASK1', print(text('a'))) + statement('TASK2', print(text('b')))),
            block('parallel_exec', statement('TASK1', print(text('c'))) + statement('TASK2', print(text('d')))),
        )),
    },
    {
        name: 'keyboard input inside a function shares one Scanner',
        xml: xml(
            block('function_definition', value('RETURN_TYPE', typeBlock('int')) + field('NAME', 'leerEdad') +
                statement('BODY', block('controls_return', value('VALUE', block('input_read_int'))))),
            seq(
                declareInit('string', 'nombre', block('input_read_word')),
                declareInit('int', 'edad', block('function_call_value', field('NAME', 'leerEdad') + args())),
                declareInit('boolean', 'ok', block('input_read_boolean')),
            ),
        ),
    },
];

suite('Generated Java compiles with javac', function () {
    this.timeout(60_000);

    suiteSetup(function () {
        if (!hasJavac) {
            if (process.env.PACO_REQUIRE_JAVAC) {
                throw new Error('PACO_REQUIRE_JAVAC is set but javac is not on PATH');
            }
            this.skip();
        }
    });

    for (const p of programs) {
        test(p.name, () => assertCompiles(xmlToJavaProgram(p.xml)));
    }
});
