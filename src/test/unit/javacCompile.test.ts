import * as assert from 'assert';
import { execFileSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { xmlToJavaProgram } from '../../core/java/program';
import { block, declareInit, field, num, print, seq, statement, text, value, varGet, xml } from './xmlBuilders';

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
