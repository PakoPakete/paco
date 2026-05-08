import * as vscode from 'vscode';
import * as fs from 'fs';

import { xmlToIr } from './core/scratch/xmlToIr';
import { irToJava } from './core/java/irToJava';

let currentPanels: vscode.WebviewPanel[] = [];
let javaDocuments = new Map<vscode.WebviewPanel, vscode.TextDocument>();
let panelCounter = 0;

export function activate(context: vscode.ExtensionContext) {
    vscode.window.registerTreeDataProvider('pacoView', {
        getTreeItem: (el: vscode.TreeItem) => el,
        getChildren: () => []
    });

    const disposable = vscode.commands.registerCommand('paco.openEditor', async () => {
        panelCounter++;

        const viewType = `pacoEditor_${panelCounter}`;
        const panel = vscode.window.createWebviewPanel(
            viewType,
            `PACO Scratch Editor #${panelCounter}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, 'media')
                ]
            }
        );

        currentPanels.push(panel);

        const javaDoc = await vscode.workspace.openTextDocument({
            language: 'java',
            content: '',
        });
        javaDocuments.set(panel, javaDoc);
        vscode.window.showTextDocument(javaDoc, vscode.ViewColumn.Two);

        const mediaRoot = vscode.Uri.joinPath(context.extensionUri, 'media');
        const htmlUri = vscode.Uri.joinPath(mediaRoot, 'index.html');

        let html = fs.readFileSync(htmlUri.fsPath, 'utf8');
        const rootUri = panel.webview.asWebviewUri(mediaRoot);
        html = html.replace(/{{root}}/g, rootUri.toString());
        panel.webview.html = html;

        panel.webview.onDidReceiveMessage(
            async (message) => {
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
                    try {
                        const xml: string = message.payload?.xml ?? '';

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

                        const fullJava = wrapJava(body, imports, outerCode);

                        const doc = javaDocuments.get(panel);
                        if (doc) {
                            const edit = new vscode.WorkspaceEdit();
                            edit.replace(
                                doc.uri,
                                new vscode.Range(0, 0, doc.lineCount, 0),
                                fullJava
                            );
                            await vscode.workspace.applyEdit(edit);
                        }
                    } catch (error) {
                        console.error('Error translating to Java:', error);
                    }
                }
            },
            undefined,
            context.subscriptions
        );

        panel.onDidDispose(() => {
            currentPanels = currentPanels.filter(p => p !== panel);
            javaDocuments.delete(panel);
        }, null, context.subscriptions);
    });

    context.subscriptions.push(disposable);
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
