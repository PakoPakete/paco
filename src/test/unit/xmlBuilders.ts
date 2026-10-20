// Helpers to build Blockly XML the same way the webview serializes it.

export function xml(...blocks: string[]): string {
    return `<xml xmlns="https://developers.google.com/blockly/xml">${blocks.join('')}</xml>`;
}

/** Chains statement blocks through <next>, like stacked blocks in the editor. */
export function seq(...blocks: string[]): string {
    if (blocks.length === 0) {
        return '';
    }
    const [first, ...rest] = blocks;
    if (rest.length === 0) {
        return first;
    }
    return first.replace(/<\/block>$/, `<next>${seq(...rest)}</next></block>`);
}

export function block(type: string, inner: string = ''): string {
    return `<block type="${type}">${inner}</block>`;
}

export function field(name: string, value: string): string {
    return `<field name="${name}">${value}</field>`;
}

export function value(name: string, expr: string): string {
    return `<value name="${name}">${expr}</value>`;
}

export function statement(name: string, ...blocks: string[]): string {
    return `<statement name="${name}">${seq(...blocks)}</statement>`;
}

export function num(n: number): string {
    return block('math_number', field('NUM', String(n)));
}

export function text(s: string): string {
    return block('text', field('TEXT', s));
}

export function varGet(name: string): string {
    return block('variables_get', field('VAR', name));
}

export function print(expr: string): string {
    return block('text_print', value('TEXT', expr));
}

export function typeBlock(t: 'int' | 'double' | 'boolean' | 'string' | 'char'): string {
    return block(`type_${t}`);
}

export function declareInit(t: 'int' | 'double' | 'boolean' | 'string' | 'char', name: string, expr: string): string {
    return block('variable_declaration_init',
        value('TYPE', typeBlock(t)) + field('VAR', name) + value('VALUE', expr));
}

/** Inputs of a block with a variable number of arguments (function, method and constructor calls). */
export function args(...exprs: string[]): string {
    return `<mutation args="${exprs.length}"></mutation>` + field('NARGS', String(exprs.length)) +
        exprs.map((e, i) => value(`ARG${i}`, e)).join('');
}

export function checkbox(name: string, on: boolean): string {
    return field(name, on ? 'TRUE' : 'FALSE');
}

export function param(t: 'int' | 'double' | 'boolean' | 'string' | 'char', name: string): string {
    return block('function_parameter', value('TYPE', typeBlock(t)) + field('NAME', name));
}

export function customType(name: string): string {
    return block('type_custom', field('TYPE', name));
}
