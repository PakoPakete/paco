import { IRNode, IRImport, IRPackage, IRExpr, IRConstantDeclaration, IRUseFile } from '../ir/nodes';
import { xmlToIr } from '../scratch/xmlToIr';
import { irToJava } from './irToJava';

/** Un archivo .paco leído para el bloque "usar archivo". */
export interface PacoFile {
    /** Identifica el archivo (su ruta o URI), para no incluirlo dos veces. */
    id: string;
    xml: string;
}

export interface ProgramOptions {
    /** Identificador del archivo principal, para que otro archivo que lo use no lo vuelva a incluir. */
    fileId?: string;
    /**
     * Busca el archivo que nombra un bloque "usar archivo". `from` es el id del archivo que tiene el bloque,
     * para resolver la ruta respecto a su carpeta. Devuelve undefined si no existe.
     */
    readFile?: (file: string, from: string | undefined) => PacoFile | undefined;
}

// Bloques de otro archivo que pasan al programa: lo que no es una sentencia de main.
const LIBRARY_KINDS = new Set([
    'import', 'class_definition', 'interface_definition', 'enum_definition', 'record_definition',
    'function_definition', 'constant_declaration', 'when_receive'
]);

export function xmlToJavaProgram(xml: string, options: ProgramOptions = {}): string {
    const visited = new Set<string>(options.fileId ? [options.fileId] : []);
    const irNodes = collectNodes(xml, options.fileId, options, visited, true);

    const imports: string[] = [];
    let packageName: string | undefined;
    const outerBlocks: IRNode[] = [];
    const mainBody: IRNode[] = [];
    // A constant can only become a static field if its value does not read main's local variables.
    const classConstants = new Set<string>();

    for (const node of irNodes) {
        if (node.kind === 'import') {
            const library = (node as IRImport).library;
            if (!imports.includes(library)) {
                imports.push(library);
            }
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

/**
 * Bloques del archivo con los de cada "usar archivo" en su lugar. De los otros archivos solo se toman
 * clases, funciones, constantes e imports: sus sentencias sueltas serían el main de otro programa.
 */
function collectNodes(xml: string, fileId: string | undefined, options: ProgramOptions,
    visited: Set<string>, isMain: boolean): IRNode[] {
    const result: IRNode[] = [];
    // Un programa nuevo se crea como archivo vacío
    if (!xml.trim()) {
        return result;
    }
    for (const node of xmlToIr(xml)) {
        if (node.kind === 'use_file') {
            const name = (node as IRUseFile).file;
            const file = options.readFile?.(name, fileId);
            if (!file) {
                throw new Error(`No se encuentra el archivo "${name}". Tiene que estar guardado en la misma carpeta que el programa`);
            }
            // Dos archivos pueden usarse entre sí, o varios usar el mismo: cada uno entra una sola vez
            if (visited.has(file.id)) {
                continue;
            }
            visited.add(file.id);
            try {
                result.push(...collectNodes(file.xml, file.id, options, visited, false));
            } catch (error) {
                const detail = error instanceof Error ? error.message : String(error);
                throw new Error(detail.startsWith('No se encuentra') ? detail : `En el archivo "${name}": ${detail}`);
            }
        } else if (isMain || LIBRARY_KINDS.has(node.kind)) {
            result.push(node);
        }
    }
    return result;
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
