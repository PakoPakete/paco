import * as vscode from 'vscode';
import * as fs from 'fs';

import { xmlToJavaProgram } from './core/java/program';

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

                        const fullJava = xmlToJavaProgram(xml);

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
