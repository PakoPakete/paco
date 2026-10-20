import { IRNode, IRImport, IRPackage, IRExpr, IRConstantDeclaration } from '../ir/nodes';
import { xmlToIr } from '../scratch/xmlToIr';
import { irToJava } from './irToJava';

export function xmlToJavaProgram(xml: string): string {
    const irNodes = xmlToIr(xml);

    const imports: string[] = [];
    let packageName: string | undefined;
    const outerBlocks: IRNode[] = [];
    const mainBody: IRNode[] = [];
    // A constant can only become a static field if its value does not read main's local variables.
    const classConstants = new Set<string>();

    for (const node of irNodes) {
        if (node.kind === 'import') {
            imports.push((node as IRImport).library);
        } else if (node.kind === 'package') {
            packageName = (node as IRPackage).name;
        } else if (
            node.kind === 'class_definition' ||
            node.kind === 'interface_definition' ||
            node.kind === 'enum_definition' ||
            node.kind === 'when_receive' ||
            // Java has no methods inside methods, so functions and constants become members of PacoProgram.
            node.kind === 'function_definition' ||
            node.kind === 'record_definition' ||
            (node.kind === 'constant_declaration' && onlyUses((node as IRConstantDeclaration).value, classConstants))
        ) {
            if (node.kind === 'constant_declaration') {
                classConstants.add((node as IRConstantDeclaration).name);
            }
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

    const program = wrapJava(body, imports, outerCode);
    return packageName ? `package ${packageName};\n\n${program}` : program;
}

/** True when every variable the expression reads is one of the given names. */
function onlyUses(expr: IRExpr, names: Set<string>): boolean {
    const visit = (v: unknown): boolean => {
        if (Array.isArray(v)) {
            return v.every(visit);
        }
        if (v && typeof v === 'object') {
            const obj = v as { kind?: string; name?: string };
            if (obj.kind === 'var_ref' && !names.has(obj.name ?? '')) {
                return false;
            }
            return Object.values(obj).every(visit);
        }
        return true;
    };
    return visit(expr);
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
