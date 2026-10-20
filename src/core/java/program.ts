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
            node.kind === 'when_receive' ||
            // Java has no methods inside methods, so functions and constants become members of PacoProgram.
            node.kind === 'function_definition' ||
            node.kind === 'constant_declaration' ||
            node.kind === 'record_definition'
        ) {
            outerBlocks.push(node);
        } else {
            mainBody.push(node);
        }
    }

    let body = irToJava(mainBody);
    let outerCode = irToJava(outerBlocks, { classLevel: true });

    // Functions outside main also read from the keyboard, so they need a shared Scanner field.
    const scannerLine = 'java.util.Scanner scanner = new java.util.Scanner(System.in);\n';
    if (outerCode.includes('scanner.')) {
        outerCode = outerCode.replace(scannerLine, '');
        body = body.replace(scannerLine, '');
        outerCode = 'static ' + scannerLine + '\n' + outerCode;
    }

    return wrapJava(body, imports, outerCode);
}

function wrapJava(body: string, imports: string[] = [], outerCode: string = ''): string {
    let result = '';

    if (imports.length > 0) {
        result += imports.map(i => `import ${i};`).join('\n') + '\n\n';
    }

    result += `public class PacoProgram {
    public static void main(String[] args) throws Exception {
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
