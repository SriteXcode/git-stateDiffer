import * as vscode from 'vscode';
    import * as path from 'path';
    import { GitService } from '../git/gitService';
    import { createRevisionUri } from '../providers/revisionContentProvider';

    export async function registerCompareLineCommand(gitService: GitService):
    Promise<vscode.Disposable> {
      return vscode.commands.registerCommand('gitStateDiffer.compareLineWithCommit', async () =>
      {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showWarningMessage('No active editor to compare.');
          return;
        }

        const filePath = editor.document.uri.fsPath;
        const repoRoot = await gitService.getRepoRoot(filePath);
        if (!repoRoot) {
          vscode.window.showErrorMessage('The active file is not inside a Git repository.');
          return;
        }

        const relativePath = path.relative(repoRoot, filePath).replace(/\\/g, '/');
        const startLine = editor.selection.start.line + 1; // 1-based
        const endLine = editor.selection.end.line + 1;

        const lineTextCurrent = editor.document.getText(
          new vscode.Range(
            new vscode.Position(startLine - 1, 0),
            new vscode.Position(endLine - 1, editor.document.lineAt(endLine - 1).text.length)
          )
        );

        const recentCommits = await gitService.getRecentCommits(repoRoot, 25);

        const items = [
          {
            label: '$(git-commit) HEAD (Latest Commit)',
            description: recentCommits[0] ? `${recentCommits[0].shortHash} -
            ${recentCommits[0].subject}` : 'Default',
            commitRef: 'HEAD',
          },
          {
            label: '$(history) HEAD~1 (Previous Commit)',
            description: recentCommits[1] ? `${recentCommits[1].shortHash} -
            ${recentCommits[1].subject}` : '',
            commitRef: 'HEAD~1',
          },
          {
            label: '$(cloud) @{u} (Remote Upstream)',
            description: 'Tracking branch',
            commitRef: '@{u}',
          },
        ];

        for (const c of recentCommits) {
          items.push({
            label: `$(git-commit) ${c.shortHash}`,
            description: `${c.author} • ${c.subject}`,
            commitRef: c.hash,
          });
        }

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: `Compare line ${startLine === endLine ? startLine :
          `${startLine}-${endLine}`} with which commit? (default: HEAD)`,
        });

        if (!selected) {
          return;
        }

        // Fetch revision content to compare
        const pastFileContent = await gitService.getFileContentAtCommit(repoRoot,
        selected.commitRef, relativePath);
        const pastLines = pastFileContent.split('\n');

        // Get lines around the selected line index in past commit
        const pastLineText = pastLines.slice(startLine - 1, endLine).join('\n') || '(line did not exist in this revision)';

        // Present comparison quick preview
        const action = await vscode.window.showInformationMessage(
          `Line ${startLine === endLine ? startLine : `${startLine}-${endLine}`} comparison with
          ${selected.commitRef.substring(0, 7)}:\n` +
          `[Then]: ${pastLineText.trim()}\n` +
          `[Now]:  ${lineTextCurrent.trim()}`,
          'Open Full Diff in Editor',
          'Close'
        );

        if (action === 'Open Full Diff in Editor') {
          const revisionUri = createRevisionUri(repoRoot, selected.commitRef, relativePath);
          const fileName = path.basename(filePath);
          const title = `${fileName} (${selected.commitRef.substring(0, 7)}) ↔ ${fileName}
          (Working Tree)`;

          await vscode.commands.executeCommand('vscode.diff', revisionUri, editor.document.uri,
          title);

          // Scroll active editor to line
          const activeEd = vscode.window.activeTextEditor;
          if (activeEd) {
            const targetPos = new vscode.Position(startLine - 1, 0);
            activeEd.selection = new vscode.Selection(targetPos, targetPos);
            activeEd.revealRange(new vscode.Range(targetPos, targetPos),
            vscode.TextEditorRevealType.InCenter);
          }
        }
      });
    }
