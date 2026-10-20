import { IRNode, IRImport } from '../ir/nodes';
import { xmlToIr } from '../scratch/xmlToIr';
import { irToJava } from './irToJava';

export function xmlToJavaProgram(xml: string): string {
    const irNodes = xmlToIr(xml);

    const imports: string[] = [];
    const outerBlocks: IRNode[] = [];
    const mainBody: IRNode[] = [];

    for (const node of irNodes) {
        if (node.kind === 'import') {
            imports.push((node as IRImport).library);
        } else if (
            node.kind === 'class_definition' ||
            node.kind === 'interface_definition' ||
            node.kind === 'enum_definition' ||
            node.kind === 'when_receive'
        ) {
            outerBlocks.push(node);
        } else {
            mainBody.push(node);
        }
    }

    const body = irToJava(mainBody);
    const outerCode = irToJava(outerBlocks);

    return wrapJava(body, imports, outerCode);
}

function wrapJava(body: string, imports: string[] = [], outerCode: string = ''): string {
    let result = '';

    if (imports.length > 0) {
        result += imports.map(i => `import ${i};`).join('\n') + '\n\n';
    }

    result += `public class PacoProgram {
    public static void main(String[] args) {
${indent(body, 2)}
    }
`;

    if (outerCode.trim()) {
        result += '\n' + indent(outerCode, 1);
    }

    result += `}
`;

    return result;
}

function indent(text: string, level: number): string {
    const pad = '    '.repeat(level);
    return text
        .split('\n')
        .map((line) => (line.trim() ? pad + line : line))
        .join('\n');
}
