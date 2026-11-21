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

const streamOf = (name: string) => block('stream_start', field('NAME', name));
const terminal = (op: string) => block('stream_terminal', field('OP', op) + value('STREAM', streamOf('nums')));
const timesTwo = block('lambda_function', field('PARAMS', 'x') +
    value('BODY', block('math_arithmetic', field('OP', 'MULTIPLY') + value('A', varGet('x')) + value('B', num(2)))));
const sorted = block('stream_op', field('OP', 'sorted') + value('STREAM', streamOf('nums')));
const doubled = block('stream_op', field('OP', 'map') + value('STREAM', sorted) + value('ARG', timesTwo));
const doubledSorted = block('stream_terminal', field('OP', 'toList') + value('STREAM', doubled));
const printlnRef = block('method_reference', field('TARGET', 'System.out') + field('METHOD', 'println'));
const removeBig = block('lambda_block', field('PARAMS', 'n') + statement('BODY',
    block('controls_return', value('VALUE', block('logic_compare', field('OP', 'GT') + value('A', varGet('n')) + value('B', num(5)))))));

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

    {
        name: 'modern switch, labels, assert, bitwise ops, var and pattern matching',
        xml: xml(seq(
            declareInit('int', 'dia', num(2)),
            block('switch_arrow', value('EXPR', varGet('dia')) + statement('CASES',
                block('case_arrow', value('CASE', num(1)) + statement('DO', print(text('lunes')))),
                block('default_arrow', statement('DO', print(text('otro')))))),
            block('variable_declaration_init', value('TYPE', block('type_var')) + field('VAR', 'nombre') +
                value('VALUE', block('switch_expression', value('EXPR', varGet('dia')) + statement('CASES',
                    block('case_value', value('CASE', num(1)) + value('RESULT', text('lunes'))),
                    block('case_value', value('CASE', num(2)) + value('RESULT', text('martes'))))))),
            block('controls_labeled', field('LABEL', 'externo') + statement('DO',
                block('controls_for_classic', field('VAR', 'i') + value('FROM', num(0)) + field('OP', 'LT') + value('TO', num(3)) + field('STEP', '++') +
                    statement('DO', block('controls_for_classic', field('VAR', 'j') + value('FROM', num(0)) + field('OP', 'LT') + value('TO', num(3)) + field('STEP', '++') +
                        statement('DO', block('controls_jump_label', field('JUMP', 'break') + field('LABEL', 'externo')))))))),
            block('assert_block', value('CONDITION', block('logic_compare', field('OP', 'GT') + value('A', varGet('dia')) + value('B', num(0)))) +
                value('MESSAGE', text('día positivo'))),
            print(block('math_bitwise', field('OP', '<<') + value('A', num(1)) + value('B', num(3)))),
            print(block('math_bitwise_not', value('NUM', num(5)))),
            block('variable_declaration_init', value('TYPE', customType('Object')) + field('VAR', 'o') + value('VALUE', varGet('nombre'))),
            block('controls_if', value('IF0', block('logic_instanceof_pattern', value('VALUE', varGet('o')) + field('CLASS', 'String') + field('VAR', 's'))) +
                statement('DO0', print(block('text_length', value('TEXT', varGet('s')))))),
            print(block('text_block', field('TEXT', 'Hola "mundo"\\nadiós'))),
        )),
    },
    {
        name: 'records, generic and inner classes, anonymous classes, varargs',
        xml: xml(
            block('record_definition', field('NAME', 'Punto') + field('COMPONENTS', 'int x, int y')),
            block('class_definition', field('NAME', 'Caja<T>') +
                statement('ATTRIBUTES', block('variable_declaration', value('TYPE', customType('T')) + field('VAR', 'valor'))) +
                statement('METHODS',
                    block('constructor_definition', statement('PARAMS', block('function_parameter', value('TYPE', customType('T')) + field('NAME', 'valor'))) +
                        statement('BODY', block('field_set', value('OBJECT', block('this_reference')) + field('FIELD', 'valor') + value('VALUE', varGet('valor'))))),
                    block('class_definition', field('NAME', 'Interna')))),
            block('function_definition', value('RETURN_TYPE', typeBlock('int')) + field('NAME', 'sumar') +
                statement('PARAMS', block('function_parameter', value('TYPE', customType('int...')) + field('NAME', 'nums'))) +
                statement('BODY',
                    declareInit('int', 't', num(0)),
                    block('controls_for_each', field('TYPE', 'int') + field('VAR', 'n') + value('COLLECTION', varGet('nums')) +
                        statement('DO', block('variable_compound', field('VAR', 't') + field('OP', '+=') + value('VALUE', varGet('n'))))),
                    block('controls_return', value('VALUE', varGet('t'))))),
            seq(
                block('variable_declaration_init', value('TYPE', customType('Punto')) + field('VAR', 'p') +
                    value('VALUE', block('object_instantiation', field('CLASS', 'Punto') + args(num(1), num(2))))),
                print(block('method_call_value', value('OBJECT', varGet('p')) + field('METHOD', 'x') + args())),
                block('variable_declaration_init', value('TYPE', customType('Caja<String>')) + field('VAR', 'c') +
                    value('VALUE', block('object_instantiation', field('CLASS', 'Caja<>') + args(text('hola'))))),
                print(block('function_call_value', field('NAME', 'sumar') + args(num(1), num(2), num(3)))),
                block('variable_declaration_init', value('TYPE', customType('Runnable')) + field('VAR', 'r') +
                    value('VALUE', block('anonymous_class', field('CLASS', 'Runnable') + statement('METHODS',
                        block('method_override', field('MODIFIER', 'public') + field('RETURN_TYPE', 'void') + field('NAME', 'run') +
                            statement('BODY', print(text('corriendo')))))))),
                block('method_call', value('OBJECT', varGet('r')) + field('METHOD', 'run') + args()),
            ),
        ),
    },
    {
        name: 'streams, lambdas, method references and Optional',
        xml: xml(seq(
            block('list_declaration', field('ELEMENT_TYPE', 'Integer') + field('NAME', 'nums')),
            block('list_add', field('LIST', 'nums') + value('VALUE', num(4))),
            block('list_add', field('LIST', 'nums') + value('VALUE', num(7))),
            block('variable_declaration_init', value('TYPE', block('type_var')) + field('VAR', 'dobles') + value('VALUE', doubledSorted)),
            print(terminal('sum')),
            print(terminal('max')),
            print(terminal('count')),
            block('stream_for_each', value('STREAM', varGet('dobles')) + value('ARG', printlnRef)),
            block('collection_do', field('NAME', 'nums') + field('METHOD', 'removeIf') + value('VALUE', removeBig)),
            block('variable_declaration_init', value('TYPE', customType('java.util.Optional<String>')) + field('VAR', 'op') +
                value('VALUE', block('optional_create', field('HOW', 'ofNullable') + value('VALUE', block('logic_null'))))),
            print(block('optional_value', value('OPTIONAL', varGet('op')) + field('METHOD', 'orElse') + value('ARG', text('nada')))),
        )),
    },
    {
        name: 'dates and modern concurrency',
        xml: xml(seq(
            block('variable_declaration_init', value('TYPE', block('type_var')) + field('VAR', 'hoy') + value('VALUE', block('date_now', field('CLASS', 'LocalDate')))),
            print(block('method_call_value', value('OBJECT', block('date_of', value('YEAR', num(2026)) + value('MONTH', num(10)) + value('DAY', num(20)))) +
                field('METHOD', 'plusDays') + args(num(3)))),
            block('atomic_declaration', field('NAME', 'contador') + value('VALUE', num(0))),
            block('executor_create', field('NAME', 'executor') + value('THREADS', num(2))),
            block('executor_submit', field('NAME', 'executor') + statement('BODY',
                block('method_call', value('OBJECT', varGet('contador')) + field('METHOD', 'incrementAndGet') + args()))),
            block('executor_shutdown', field('NAME', 'executor')),
            block('thread_create', field('NAME', 'hilo') + statement('BODY', print(text('hola')))),
            block('thread_join', field('NAME', 'hilo')),
            print(block('method_call_value', value('OBJECT', varGet('contador')) + field('METHOD', 'get') + args())),
        )),
    },

    {
        name: 'review fixes: switch endings, labels, local constants, throws and classes',
        xml: xml(
            block('void_function_definition', field('NAME', 'esperar') + statement('BODY',
                block('constant_declaration', value('TYPE', typeBlock('int')) + field('NAME', 'K') + value('VALUE', num(1))),
                block('thread_create', field('NAME', 'hilo') + statement('BODY', print(varGet('K')))),
                block('thread_join', field('NAME', 'hilo')))),
            block('void_function_definition', field('NAME', 'usarEsperar') + statement('BODY',
                block('function_call', field('NAME', 'esperar') + args()),
                block('class_definition', field('NAME', 'Local')))),
            block('class_definition', field('NAME', 'Externa') + statement('METHODS', block('class_definition', field('NAME', 'Interna')))),
            seq(
                declareInit('int', 'n', num(5)),
                block('constant_declaration', value('TYPE', typeBlock('int')) + field('NAME', 'DOBLE') +
                    value('VALUE', block('math_arithmetic', field('OP', 'MULTIPLY') + value('A', varGet('n')) + value('B', num(2))))),
                print(block('math_bitwise', field('OP', '^') + value('A', num(5)) + value('B', num(3)))),
                block('controls_labeled', field('LABEL', 'fuera') + statement('DO',
                    declareInit('int', 'x', num(0)),
                    block('controls_whileUntil', field('MODE', 'WHILE') + value('BOOL', block('logic_boolean', field('BOOL', 'TRUE'))) +
                        statement('DO', block('controls_switch', value('EXPR', varGet('x')) + statement('CASES',
                            block('controls_case', value('CASE', num(0)) + statement('STATEMENT', block('controls_jump_label', field('JUMP', 'break') + field('LABEL', 'fuera')))),
                            block('controls_case', value('CASE', num(1)) + statement('STATEMENT', block('controls_stop', field('MODE', 'THIS')))),
                        )))))),
                block('controls_labeled', field('LABEL', 'vacio')),
                print(block('text_block', field('TEXT', 'Dijo "hola"'))),
                block('function_call', field('NAME', 'usarEsperar') + args()),
                declareInit('int', 'fin', varGet('DOBLE')),
                block('variable_declaration_init', value('TYPE', customType('RuntimeException')) + field('VAR', 'error') +
                    value('VALUE', block('object_instantiation', field('CLASS', 'IllegalStateException') + args(text('x'))))),
                block('controls_if', value('IF0', block('logic_compare', field('OP', 'GT') + value('A', varGet('fin')) + value('B', num(100)))) +
                    statement('DO0', block('throw_exception', value('EXCEPTION', varGet('error'))))),
            ),
        ),
    },
    {
        name: 'package, sealed interface with records and sealed class hierarchy',
        xml: xml(
            block('package_declaration', field('NAME', 'com.ejemplo')),
            block('interface_definition', field('NAME', 'Figura') + field('SEALED', 'SEALED') + field('PERMITS', 'Circulo, Cuadrado')),
            block('record_definition', field('NAME', 'Circulo') + field('COMPONENTS', 'double radio') + field('IMPLEMENTS', 'Figura')),
            block('record_definition', field('NAME', 'Cuadrado') + field('COMPONENTS', 'double lado') + field('IMPLEMENTS', 'Figura')),
            block('class_definition', field('NAME', 'Animal') + checkbox('ABSTRACT', true) + field('SEALED', 'SEALED') + field('PERMITS', '')),
            block('class_extends', field('NAME', 'Perro') + field('PARENT', 'Animal') + field('SEALED', 'FINAL')),
            block('class_extends', field('NAME', 'Gato') + field('PARENT', 'Animal') + field('SEALED', 'NON_SEALED')),
            block('class_extends', field('NAME', 'GatoPersa') + field('PARENT', 'Gato')),
            seq(
                block('variable_declaration_init', value('TYPE', customType('Figura')) + field('VAR', 'f') +
                    value('VALUE', block('object_instantiation', field('CLASS', 'Circulo') + args(num(2))))),
                print(varGet('f')),
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
