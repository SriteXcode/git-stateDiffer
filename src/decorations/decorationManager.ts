import * as vscode from 'vscode';
    import { FileGitState } from '../git/gitTypes';
    import { createDecorationTypes, getDecorationSettings, DecorationSettings } from
    './colorConfig';

    export class DecorationManager implements vscode.Disposable {
      private settings: DecorationSettings;
      private decorationTypes: ReturnType<typeof createDecorationTypes>;

      constructor() {
        this.settings = getDecorationSettings();
        this.decorationTypes = createDecorationTypes(this.settings);
      }

      public reloadSettings() {
        this.disposeDecorationTypes();
        this.settings = getDecorationSettings();
        this.decorationTypes = createDecorationTypes(this.settings);
      }

      public applyDecorations(editor: vscode.TextEditor, fileState: FileGitState) {
        const unpushedRanges: vscode.Range[] = [];
        const modifiedRanges: vscode.Range[] = [];
        const pushedRanges: vscode.Range[] = [];

        fileState.lines.forEach((info, lineNumber) => {
          // lineNumber is 1-based, VS Code line index is 0-based
          const zeroBased = lineNumber - 1;
          if (zeroBased < 0 || zeroBased >= editor.document.lineCount) {
            return;
          }

          const lineRange = editor.document.lineAt(zeroBased).range;

          if (info.state === 'committed-unpushed' && this.settings.showUnpushed) {
            unpushedRanges.push(lineRange);
          } else if (info.state === 'modified' && this.settings.showModified) {
            modifiedRanges.push(lineRange);
          } else if (info.state === 'pushed' && this.settings.showPushed) {
            pushedRanges.push(lineRange);
          }
        });

        editor.setDecorations(this.decorationTypes.unpushedType, unpushedRanges);
        editor.setDecorations(this.decorationTypes.modifiedType, modifiedRanges);
        editor.setDecorations(this.decorationTypes.pushedType, pushedRanges);
      }

      public clearDecorations(editor: vscode.TextEditor) {
        editor.setDecorations(this.decorationTypes.unpushedType, []);
        editor.setDecorations(this.decorationTypes.modifiedType, []);
        editor.setDecorations(this.decorationTypes.pushedType, []);
      }

      private disposeDecorationTypes() {
        this.decorationTypes.unpushedType.dispose();
        this.decorationTypes.modifiedType.dispose();
        this.decorationTypes.pushedType.dispose();
      }

      public dispose() {
        this.disposeDecorationTypes();
      }
    }