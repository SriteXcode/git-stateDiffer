import * as vscode from 'vscode';
    import { FileGitState } from '../git/gitTypes';

    export class GitStateStatusBarItem implements vscode.Disposable {
      private statusBarItem: vscode.StatusBarItem;

      constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right,
        100);
        this.statusBarItem.command = 'gitStateDiffer.compareLineWithCommit';
      }

      public update(editor: vscode.TextEditor | undefined, fileState: FileGitState | undefined) {
        if (!editor || !fileState) {
          this.statusBarItem.hide();
          return;
        }

        const currentLine = editor.selection.active.line + 1; // 1-based
        const lineInfo = fileState.lines.get(currentLine);

        if (!lineInfo) {
          this.statusBarItem.hide();
          return;
        }

        if (lineInfo.state === 'committed-unpushed') {
          this.statusBarItem.text = `$(git-commit) Line ${currentLine}: Unpushed
          (${lineInfo.commit?.shortHash || 'local'})`;
          this.statusBarItem.tooltip = `Committed locally (${lineInfo.commit?.summary || ''}) -
          Click to diff with commit`;
          this.statusBarItem.backgroundColor = new
          vscode.ThemeColor('statusBarItem.warningBackground');
        } else if (lineInfo.state === 'modified') {
          this.statusBarItem.text = `$(diff-modified) Line ${currentLine}: Modified`;
          this.statusBarItem.tooltip = 'Uncommitted changes in working tree - Click to diff with commit';
          this.statusBarItem.backgroundColor = undefined;
        } else if (lineInfo.state === 'pushed') {
          this.statusBarItem.text = `$(check) Line ${currentLine}: Pushed`;
          this.statusBarItem.tooltip = `Pushed to ${fileState.upstreamBranch || 'remote'} - Click
          to diff with commit`;
          this.statusBarItem.backgroundColor = undefined;
        } else {
          this.statusBarItem.text = `$(file-text) Line ${currentLine}: Untracked`;
          this.statusBarItem.tooltip = 'Untracked code';
          this.statusBarItem.backgroundColor = undefined;
        }

        this.statusBarItem.show();
      }

      public hide() {
        this.statusBarItem.hide();
      }

      public dispose() {
        this.statusBarItem.dispose();
      }
    }