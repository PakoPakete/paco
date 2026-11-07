import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFile } from 'child_process';

import { xmlToJavaProgram, PacoFile } from './core/java/program';

const VIEW_TYPE = 'paco.blockEditor';
const JAVA_SCHEME = 'paco-java';
let untitledCounter = 0;
let javaCounter = 0;

/**
 * El Java generado se muestra como documento de solo lectura (paco-java:/Programa1/PacoProgram.java):
 * VS Code no lo marca como modificado ni pregunta si guardarlo al cerrar, y la pestaña se llama PacoProgram.java.
 */
class GeneratedJava implements vscode.TextDocumentContentProvider {
    private readonly contents = new Map<string, string>();
    private readonly changed = new vscode.EventEmitter<vscode.Uri>();
    readonly onDidChange = this.changed.event;

    provideTextDocumentContent(uri: vscode.Uri): string {
        return this.contents.get(uri.toString()) ?? '';
    }

    get(uri: vscode.Uri): string {
        return this.contents.get(uri.toString()) ?? '';
    }

    set(uri: vscode.Uri, text: string): void {
        if (this.contents.get(uri.toString()) !== text) {
            this.contents.set(uri.toString(), text);
            this.changed.fire(uri);
        }
    }
}

const generatedJava = new GeneratedJava();
// Java de editores ya cerrados cuya pestaña sigue abierta; al guardar un programa nuevo VS Code reabre su editor y se reutilizan
const freeJavaUris: vscode.Uri[] = [];
// Java generado de cada editor abierto, para el comando "Ejecutar"
const javaUrisByPanel = new Map<vscode.WebviewPanel, vscode.Uri>();
let lastActivePanel: vscode.WebviewPanel | undefined;
let output: vscode.OutputChannel;
let runTerminal: vscode.Terminal | undefined;
let runCounter = 0;
// Avisa cuando cambia un archivo .paco (editado o en disco), para regenerar los programas que lo usan
const pacoFileChanged = new vscode.EventEmitter<vscode.Uri>();

export function activate(context: vscode.ExtensionContext) {
    output = vscode.window.createOutputChannel('PACO');
    context.subscriptions.push(output);

    vscode.window.registerTreeDataProvider('pacoView', {
        getTreeItem: (el: vscode.TreeItem) => el,
        getChildren: () => []
    });

    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(JAVA_SCHEME, generatedJava));

    const watcher = vscode.workspace.createFileSystemWatcher('**/*.paco');
    context.subscriptions.push(
        watcher,
        pacoFileChanged,
        watcher.onDidChange(uri => pacoFileChanged.fire(uri)),
        watcher.onDidCreate(uri => pacoFileChanged.fire(uri)),
        watcher.onDidDelete(uri => pacoFileChanged.fire(uri)),
        vscode.workspace.onDidChangeTextDocument(e => {
            if (e.contentChanges.length > 0) {
                pacoFileChanged.fire(e.document.uri);
            }
        }),
        // Al cerrar un archivo sin guardar, los que lo usan vuelven a leer el de disco
        vscode.workspace.onDidCloseTextDocument(doc => pacoFileChanged.fire(doc.uri))
    );

    context.subscriptions.push(
        vscode.window.registerCustomEditorProvider(
            VIEW_TYPE,
            new PacoEditorProvider(context),
            { supportsMultipleEditorsPerDocument: false }
        )
    );

    // Abre un programa nuevo. Con una carpeta abierta se crea ya como archivo ProgramaN.paco en ella;
    // sin carpeta queda sin guardar y Ctrl+S pedirá dónde guardarlo. (VS Code muestra los programas
    // sin guardar como "ProgramaN.paco.paco" en la pestaña, por eso se prefiere crear el archivo.)
    const disposable = vscode.commands.registerCommand('paco.openEditor', async () => {
        const folder = vscode.workspace.workspaceFolders?.[0]?.uri;
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
        } while (usedNames.has(name) || (folder && await fileExists(vscode.Uri.joinPath(folder, name))));

        let uri = vscode.Uri.parse(`untitled:${name}`);
        if (folder) {
            const fileUri = vscode.Uri.joinPath(folder, name);
            try {
                await vscode.workspace.fs.writeFile(fileUri, new Uint8Array());
                uri = fileUri;
            } catch {
                // Carpeta de solo lectura: se queda como programa sin guardar
            }
        }
        await vscode.commands.executeCommand('vscode.openWith', uri, VIEW_TYPE, vscode.ViewColumn.One);
    });

    context.subscriptions.push(disposable);

    context.subscriptions.push(vscode.commands.registerCommand('paco.runJava', async () => {
        const panel = [...javaUrisByPanel.keys()].find(p => p.active) ?? lastActivePanel;
        const javaUri = panel && javaUrisByPanel.get(panel);
        if (!javaUri) {
            vscode.window.showWarningMessage('Abre un programa de PACO para ejecutarlo.');
            return;
        }
        await runJava(generatedJava.get(javaUri));
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

        let javaUri = freeJavaUris.pop();
        while (javaUri && !isTabOpen(javaUri)) {
            javaUri = freeJavaUris.pop();
        }
        if (!javaUri) {
            // La carpeta con el nombre del programa distingue las pestañas cuando hay varios abiertos
            const programName = path.posix.basename(document.uri.path).replace(/\.paco$/i, '') || 'Programa';
            javaUri = vscode.Uri.from({ scheme: JAVA_SCHEME, path: `/${programName}/PacoProgram.java`, query: String(++javaCounter) });
        }
        const javaDoc = await vscode.workspace.openTextDocument(javaUri);
        if (javaDoc.languageId !== 'java') {
            await vscode.languages.setTextDocumentLanguage(javaDoc, 'java');
        }
        vscode.window.showTextDocument(javaDoc, { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true, preview: false });
        javaUrisByPanel.set(panel, javaUri);
        lastActivePanel = panel;
        panel.onDidChangeViewState(e => {
            if (e.webviewPanel.active) {
                lastActivePanel = panel;
            }
        });

        // Último texto escrito desde los bloques, para no recargar la webview con sus propios cambios
        let lastWritten: string | null = null;
        // Último XML de los bloques y archivos que usa (con "usar archivo"), para regenerar el Java si cambian
        let lastXml: string | null = null;
        let usedFiles = new Set<string>();

        const translate = (xml: string) => {
            lastXml = xml;
            const files = new Set<string>();
            try {
                generatedJava.set(javaUri, xmlToJavaProgram(xml, {
                    fileId: document.uri.toString(),
                    readFile: (name, from) => readPacoFile(name, from ? vscode.Uri.parse(from) : document.uri, files)
                }));
                panel.webview.postMessage({ type: 'TRANSLATE_OK' });
            } catch (error) {
                // El alumno tiene que saber que el Java de la derecha ya no corresponde a sus bloques
                const detail = error instanceof Error ? error.message : String(error);
                output.appendLine(`Error al traducir a Java: ${detail}`);
                if (error instanceof Error && error.stack) {
                    output.appendLine(error.stack);
                }
                panel.webview.postMessage({ type: 'TRANSLATE_ERROR', payload: { message: detail } });
            } finally {
                usedFiles = files;
            }
        };

        const usedFileSubscription = pacoFileChanged.event(uri => {
            if (lastXml !== null && usedFiles.has(uri.toString())) {
                translate(lastXml);
            }
        });

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
            usedFileSubscription.dispose();
            javaUrisByPanel.delete(panel);
            if (lastActivePanel === panel) {
                lastActivePanel = undefined;
            }
            if (isTabOpen(javaUri)) {
                freeJavaUris.push(javaUri);
            }
        });

        panel.webview.onDidReceiveMessage(async (message) => {
            if (message.type === 'READY') {
                sendLoad();
            }

            if (message.type === 'RUN') {
                await runJava(generatedJava.get(javaUri));
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

                translate(xml);
            }
        }, undefined, this.context.subscriptions);
    }
}

/**
 * Lee el archivo de un bloque "usar archivo", buscado en la carpeta del archivo que lo usa. Si está abierto
 * se usa lo que hay en el editor aunque no se haya guardado. Anota la ruta en `files` aunque no exista,
 * para regenerar el Java cuando se cree.
 */
function readPacoFile(name: string, from: vscode.Uri, files: Set<string>): PacoFile | undefined {
    const fileName = /\.paco$/i.test(name) ? name : `${name}.paco`;
    let folder: vscode.Uri | undefined = vscode.Uri.joinPath(from, '..');
    if (from.scheme === 'untitled') {
        // Un programa sin guardar no tiene carpeta: se usa la carpeta abierta
        folder = vscode.workspace.workspaceFolders?.[0]?.uri;
    }
    if (!folder) {
        return undefined;
    }
    const uri = vscode.Uri.joinPath(folder, fileName);
    files.add(uri.toString());

    const open = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === uri.toString());
    if (open) {
        return { id: uri.toString(), xml: open.getText() };
    }
    if (uri.scheme === 'file') {
        try {
            return { id: uri.toString(), xml: fs.readFileSync(uri.fsPath, 'utf8') };
        } catch {
            return undefined;
        }
    }
    return undefined;
}

function isTabOpen(uri: vscode.Uri): boolean {
    return vscode.window.tabGroups.all.some(group => group.tabs.some(tab =>
        tab.input instanceof vscode.TabInputText && tab.input.uri.toString() === uri.toString()));
}

async function fileExists(uri: vscode.Uri): Promise<boolean> {
    try {
        await vscode.workspace.fs.stat(uri);
        return true;
    } catch {
        return false;
    }
}

function fullRange(doc: vscode.TextDocument): vscode.Range {
    return new vscode.Range(0, 0, doc.lineCount, 0);
}

/**
 * Guarda el Java en una carpeta temporal y lo ejecuta en un terminal, para que el
 * programa pueda leer del teclado. `java Archivo.java` compila y ejecuta en un paso (JDK 11+; los bloques de Java moderno necesitan 17+).
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
            'No se encontró Java. Instala un JDK (versión 17 o superior) para ejecutar los programas.',
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
