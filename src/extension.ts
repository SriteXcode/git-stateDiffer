import * as vscode from 'vscode';
    import { GitService } from './git/gitService';
    import { FileGitState } from './git/gitTypes';
    import { DecorationManager } from './decorations/decorationManager';
    import { GitStateHoverProvider } from './providers/hoverProvider';
    import { GitStateStatusBarItem } from './providers/statusBarItem';
    import { RevisionContentProvider, REVISION_SCHEME } from
    './providers/revisionContentProvider';
    import { registerCompareFileCommand } from './commands/compareFileCommand';
    import { registerCompareLineCommand } from './commands/compareLineCommand';

    export function activate(context: vscode.ExtensionContext) {
      const gitService = new GitService();
      const decorationManager = new DecorationManager();
      const statusBar = new GitStateStatusBarItem();

      // In-memory cache for file states (keyed by document fsPath)
      const fileStateCache = new Map<string, FileGitState>();

      const getCachedState = (uri: vscode.Uri): FileGitState | undefined => {
        return fileStateCache.get(uri.fsPath);
      };

      // Register the virtual git revision content provider
      const revisionProvider = new RevisionContentProvider(gitService);
      context.subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider(REVISION_SCHEME, revisionProvider)
      );

      // Register hover provider for all files
      context.subscriptions.push(
        vscode.languages.registerHoverProvider({ scheme: 'file' }, new
        GitStateHoverProvider(getCachedState))
      );

      // Debounced update function
      let debounceTimer: NodeJS.Timeout | undefined;

      async function updateActiveEditor(editor: vscode.TextEditor | undefined) {
        if (!editor || editor.document.uri.scheme !== 'file') {
          statusBar.hide();
          return;
        }

        const doc = editor.document;
        const state = await gitService.getFileState(doc.uri.fsPath, doc.lineCount);

        if (state) {
          fileStateCache.set(doc.uri.fsPath, state);
          decorationManager.applyDecorations(editor, state);
          statusBar.update(editor, state);
        } else {
          fileStateCache.delete(doc.uri.fsPath);
          decorationManager.clearDecorations(editor);
          statusBar.hide();
        }
      }

      function triggerUpdate(editor: vscode.TextEditor | undefined, delay = 300) {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
          updateActiveEditor(editor);
        }, delay);
      }

      // Register Diff & Compare commands
      registerCompareFileCommand(gitService).then((d) => context.subscriptions.push(d));
      registerCompareLineCommand(gitService).then((d) => context.subscriptions.push(d));

      // Register manual refresh command
      context.subscriptions.push(
        vscode.commands.registerCommand('gitStateDiffer.refresh', () => {
          fileStateCache.clear();
          updateActiveEditor(vscode.window.activeTextEditor);
          vscode.window.showInformationMessage('Git state refreshed.');
        })
      );

      // Event Listeners
      context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor((editor) => {
          updateActiveEditor(editor);
        }),

        vscode.window.onDidChangeTextEditorSelection((e) => {
          if (e.textEditor === vscode.window.activeTextEditor) {
            const state = getCachedState(e.textEditor.document.uri);
            statusBar.update(e.textEditor, state);
          }
        }),

        vscode.workspace.onDidChangeTextDocument((e) => {
          const activeEd = vscode.window.activeTextEditor;
          if (activeEd && activeEd.document === e.document) {
            triggerUpdate(activeEd, 400);
          }
        }),

        vscode.workspace.onDidSaveTextDocument((doc) => {
          const activeEd = vscode.window.activeTextEditor;
          if (activeEd && activeEd.document === doc) {
            updateActiveEditor(activeEd);
          }
        }),

        vscode.workspace.onDidChangeConfiguration((e) => {
          if (e.affectsConfiguration('gitStateDiffer')) {
            decorationManager.reloadSettings();
            if (vscode.window.activeTextEditor) {
              updateActiveEditor(vscode.window.activeTextEditor);
            }
          }
        }),

        decorationManager,
        statusBar
      );

      // Initial update for already open editor
      if (vscode.window.activeTextEditor) {
        updateActiveEditor(vscode.window.activeTextEditor);
      }
    }

    export function deactivate() {}