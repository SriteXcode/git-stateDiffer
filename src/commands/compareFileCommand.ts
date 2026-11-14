import * as vscode from 'vscode';
    import * as path from 'path';
    import { GitService } from '../git/gitService';
    import { createRevisionUri } from '../providers/revisionContentProvider';

    interface CommitQuickPickItem extends vscode.QuickPickItem {
      commitRef: string;
    }

    export async function registerCompareFileCommand(gitService: GitService):
    Promise<vscode.Disposable> {
      return vscode.commands.registerCommand('gitStateDiffer.compareFileWithCommit', async () =>
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
        const recentCommits = await gitService.getRecentCommits(repoRoot, 50);

        const items: CommitQuickPickItem[] = [
          {
            label: '$(git-commit) HEAD (Latest Commit)',
            description: recentCommits[0] ? `${recentCommits[0].shortHash} -
            ${recentCommits[0].subject}` : 'Current commit',
            commitRef: 'HEAD',
          },
          {
            label: '$(history) HEAD~1 (Previous Commit)',
            description: recentCommits[1] ? `${recentCommits[1].shortHash} -
            ${recentCommits[1].subject}` : '1 commit prior',
            commitRef: 'HEAD~1',
          },
          {
            label: '$(cloud) @{u} (Remote Upstream Branch)',
            description: 'Tracking branch (e.g. origin/main)',
            commitRef: '@{u}',
          },
          {
            label: 'Recent Commits',
            kind: vscode.QuickPickItemKind.Separator,
            commitRef: '',
          },
        ];

        for (const c of recentCommits) {
          items.push({
            label: `$(git-commit) ${c.shortHash}`,
            description: `${c.author} (${c.relativeDate})`,
            detail: c.subject,
            commitRef: c.hash,
          });
        }

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: 'Select a commit to compare with (default: latest commit HEAD)',
          matchOnDescription: true,
          matchOnDetail: true,
        });

        if (!selected || !selected.commitRef) {
          return;
        }

        const revisionUri = createRevisionUri(repoRoot, selected.commitRef, relativePath);
        const fileName = path.basename(filePath);
        const title = `${fileName} (${selected.commitRef.substring(0, 7)}) ↔ ${fileName} (Working
        Tree)`;

        await vscode.commands.executeCommand('vscode.diff', revisionUri, editor.document.uri,
        title);
      });
    }