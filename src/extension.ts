import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFile } from 'child_process';

import { xmlToJavaProgram } from './core/java/program';

const VIEW_TYPE = 'paco.blockEditor';
let untitledCounter = 0;
// Documentos Java de editores ya cerrados; al guardar un programa nuevo VS Code reabre su editor y se reutilizan
const freeJavaDocs: vscode.TextDocument[] = [];
// Java generado de cada editor abierto, para el comando "Ejecutar"
const javaDocsByPanel = new Map<vscode.WebviewPanel, vscode.TextDocument>();
let lastActivePanel: vscode.WebviewPanel | undefined;
let output: vscode.OutputChannel;
let runTerminal: vscode.Terminal | undefined;
let runCounter = 0;

export function activate(context: vscode.ExtensionContext) {
    output = vscode.window.createOutputChannel('PACO');
    context.subscriptions.push(output);

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
        // VS Code puede restaurar programas sin guardar de la sesión anterior: no reutilizar su nombre
        const usedNames = new Set<string>();
        for (const doc of vscode.workspace.textDocuments) {
            usedNames.add(doc.uri.path.split('/').pop() ?? '');
        }
        for (const group of vscode.window.tabGroups.all) {
            for (const tab of group.tabs) {
                usedNames.add(tab.label);
            }
        }
        let name: string;
        do {
            untitledCounter++;
            name = `Programa${untitledCounter}.paco`;
        } while (usedNames.has(name));
        const uri = vscode.Uri.parse(`untitled:${name}`);
        await vscode.commands.executeCommand('vscode.openWith', uri, VIEW_TYPE, vscode.ViewColumn.One);
    });

    context.subscriptions.push(disposable);

    context.subscriptions.push(vscode.commands.registerCommand('paco.runJava', async () => {
        const panel = [...javaDocsByPanel.keys()].find(p => p.active) ?? lastActivePanel;
        const javaDoc = panel && javaDocsByPanel.get(panel);
        if (!javaDoc) {
            vscode.window.showWarningMessage('Abre un programa de PACO para ejecutarlo.');
            return;
        }
        await runJava(javaDoc.getText());
    }));

    context.subscriptions.push(vscode.window.onDidCloseTerminal(t => {
        if (t === runTerminal) {
            runTerminal = undefined;
        }
    }));
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
        html = html.replace(/{{cspSource}}/g, panel.webview.cspSource);
        panel.webview.html = html;

        let javaDoc = freeJavaDocs.pop();
        while (javaDoc && javaDoc.isClosed) {
            javaDoc = freeJavaDocs.pop();
        }
        if (!javaDoc) {
            javaDoc = await vscode.workspace.openTextDocument({
                language: 'java',
                content: '',
            });
        }
        vscode.window.showTextDocument(javaDoc, { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true });
        javaDocsByPanel.set(panel, javaDoc);
        lastActivePanel = panel;
        panel.onDidChangeViewState(e => {
            if (e.webviewPanel.active) {
                lastActivePanel = panel;
            }
        });

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

        panel.onDidDispose(() => {
            changeSubscription.dispose();
            javaDocsByPanel.delete(panel);
            if (lastActivePanel === panel) {
                lastActivePanel = undefined;
            }
            if (!javaDoc.isClosed) {
                freeJavaDocs.push(javaDoc);
            }
        });

        panel.webview.onDidReceiveMessage(async (message) => {
            if (message.type === 'READY') {
                sendLoad();
            }

            if (message.type === 'RUN') {
                await runJava(javaDoc.getText());
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
                    const fullJava = xmlToJavaProgram(xml);
                    const edit = new vscode.WorkspaceEdit();
                    edit.replace(javaDoc.uri, fullRange(javaDoc), fullJava);
                    await vscode.workspace.applyEdit(edit);
                    panel.webview.postMessage({ type: 'TRANSLATE_OK' });
                } catch (error) {
                    // El alumno tiene que saber que el Java de la derecha ya no corresponde a sus bloques
                    const detail = error instanceof Error ? error.message : String(error);
                    output.appendLine(`Error al traducir a Java: ${detail}`);
                    if (error instanceof Error && error.stack) {
                        output.appendLine(error.stack);
                    }
                    panel.webview.postMessage({ type: 'TRANSLATE_ERROR', payload: { message: detail } });
                }
            }
        }, undefined, this.context.subscriptions);
    }
}

function fullRange(doc: vscode.TextDocument): vscode.Range {
    return new vscode.Range(0, 0, doc.lineCount, 0);
}

/**
 * Guarda el Java en una carpeta temporal y lo ejecuta en un terminal, para que el
 * programa pueda leer del teclado. `java Archivo.java` compila y ejecuta en un paso (JDK 11+).
 */
async function runJava(code: string): Promise<void> {
    if (!code.trim()) {
        vscode.window.showWarningMessage('Todavía no hay código Java que ejecutar.');
        return;
    }

    const javaVersion = await new Promise<string | null>(resolve => {
        execFile('java', ['-version'], (error, _stdout, stderr) => resolve(error ? null : stderr));
    });
    if (javaVersion === null) {
        const choice = await vscode.window.showErrorMessage(
            'No se encontró Java. Instala un JDK (versión 11 o superior) para ejecutar los programas.',
            'Descargar JDK'
        );
        if (choice) {
            vscode.env.openExternal(vscode.Uri.parse('https://adoptium.net/'));
        }
        return;
    }

    runCounter++;
    const dir = path.join(os.tmpdir(), 'paco', `run-${process.pid}-${runCounter}`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'PacoProgram.java'), code, 'utf8');

    // El terminal se crea en la carpeta del programa, así el comando no depende del shell
    runTerminal?.dispose();
    runTerminal = vscode.window.createTerminal({ name: 'PACO: ejecutar', cwd: dir });
    runTerminal.show();
    runTerminal.sendText('java PacoProgram.java');
}

export function deactivate() { }
