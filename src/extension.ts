import * as vscode from 'vscode';
import * as fs from 'fs';

import { xmlToIr } from './core/scratch/xmlToIr';
import { irToJava } from './core/java/irToJava';

const VIEW_TYPE = 'paco.blockEditor';
let untitledCounter = 0;

export function activate(context: vscode.ExtensionContext) {
    vscode.window.registerTreeDataProvider('pacoView', {
        getTreeItem: (el: vscode.TreeItem) => el,
        getChildren: () => []
    });

    context.subscriptions.push(
        vscode.window.registerCustomEditorProvider(
            VIEW_TYPE,
            new PacoEditorProvider(context),
            { supportsMultipleEditorsPerDocument: false }
        )
    );

    // Abre un programa nuevo sin guardar: Ctrl+S pedirá dónde guardar el .paco
    const disposable = vscode.commands.registerCommand('paco.openEditor', async () => {
        untitledCounter++;
        const uri = vscode.Uri.parse(`untitled:Programa${untitledCounter}.paco`);
        await vscode.commands.executeCommand('vscode.openWith', uri, VIEW_TYPE, vscode.ViewColumn.One);
    });

    context.subscriptions.push(disposable);
}

/**
 * Editor de bloques para archivos .paco. El archivo guarda el XML de Blockly,
 * así que el programa se conserva al cerrar el editor o VS Code.
 */
class PacoEditorProvider implements vscode.CustomTextEditorProvider {
    constructor(private readonly context: vscode.ExtensionContext) { }

    async resolveCustomTextEditor(
        document: vscode.TextDocument,
        panel: vscode.WebviewPanel
    ): Promise<void> {
        const mediaRoot = vscode.Uri.joinPath(this.context.extensionUri, 'media');
        panel.webview.options = {
            enableScripts: true,
            localResourceRoots: [mediaRoot]
        };

        let html = fs.readFileSync(vscode.Uri.joinPath(mediaRoot, 'index.html').fsPath, 'utf8');
        html = html.replace(/{{root}}/g, panel.webview.asWebviewUri(mediaRoot).toString());
        panel.webview.html = html;

        const javaDoc = await vscode.workspace.openTextDocument({
            language: 'java',
            content: '',
        });
        vscode.window.showTextDocument(javaDoc, { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true });

        // Último texto escrito desde los bloques, para no recargar la webview con sus propios cambios
        let lastWritten: string | null = null;

        const sendLoad = () => {
            panel.webview.postMessage({
                type: 'LOAD',
                payload: { xml: document.getText() }
            });
        };

        const changeSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() !== document.uri.toString() || e.contentChanges.length === 0) {
                return;
            }
            // Cambios externos (deshacer, edición del archivo, revertir): reflejarlos en los bloques
            if (document.getText() !== lastWritten) {
                sendLoad();
            }
        });

        panel.onDidDispose(() => changeSubscription.dispose());

        panel.webview.onDidReceiveMessage(async (message) => {
            if (message.type === 'READY') {
                sendLoad();
            }

            if (message.type === 'PROMPT') {
                const result = await vscode.window.showInputBox({
                    prompt: message.payload?.message ?? 'Nombre de variable',
                    value: message.payload?.defaultValue ?? '',
                });
                panel.webview.postMessage({
                    type: 'PROMPT_RESPONSE',
                    payload: result ?? null,
                });
            }

            if (message.type === 'TRANSLATE_JAVA') {
                const xml: string = message.payload?.xml ?? '';
                const pretty: string | undefined = message.payload?.pretty;

                if (message.payload?.save && pretty !== undefined && pretty !== document.getText()) {
                    lastWritten = pretty;
                    const edit = new vscode.WorkspaceEdit();
                    edit.replace(document.uri, fullRange(document), pretty);
                    await vscode.workspace.applyEdit(edit);
                }

                try {
                    const fullJava = translateToJava(xml);
                    const edit = new vscode.WorkspaceEdit();
                    edit.replace(javaDoc.uri, fullRange(javaDoc), fullJava);
                    await vscode.workspace.applyEdit(edit);
                } catch (error) {
                    console.error('Error translating to Java:', error);
                }
            }
        }, undefined, this.context.subscriptions);
    }
}

function fullRange(doc: vscode.TextDocument): vscode.Range {
    return new vscode.Range(0, 0, doc.lineCount, 0);
}

function translateToJava(xml: string): string {
    const irNodes = xmlToIr(xml);

    const imports: string[] = [];
    const outerBlocks: typeof irNodes = [];
    const mainBody: typeof irNodes = [];

    for (const node of irNodes) {
        if (node.kind === 'import') {
            imports.push((node as any).library);
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

export function deactivate() { }

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
