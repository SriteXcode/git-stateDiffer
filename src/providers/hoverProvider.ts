import * as vscode from 'vscode';
    import { FileGitState } from '../git/gitTypes';
    
    export class GitStateHoverProvider implements vscode.HoverProvider {
      private fileStateGetter: (uri: vscode.Uri) => FileGitState | undefined;

      constructor(fileStateGetter: (uri: vscode.Uri) => FileGitState | undefined) {
        this.fileStateGetter = fileStateGetter;
      }

      provideHover(document: vscode.TextDocument, position: vscode.Position):
      vscode.ProviderResult<vscode.Hover> {
        const fileState = this.fileStateGetter(document.uri);
        if (!fileState) {
          return null;
        }

        const lineNumber = position.line + 1; // 1-based
        const lineInfo = fileState.lines.get(lineNumber);
        if (!lineInfo) {
          return null;
        }

        const md = new vscode.MarkdownString();
        md.isTrusted = true;
        md.supportHtml = true;

        // Badge & Status header
        if (lineInfo.state === 'committed-unpushed') {
          md.appendMarkdown(`### $(git-commit) **Git State: Committed (Unpushed)**\n\n`);
          md.appendMarkdown(`> This line is committed locally in **HEAD**, but **not yet pushed**
          to remote \`${fileState.upstreamBranch || 'remote'}\`.\n\n`);
        } else if (lineInfo.state === 'modified') {
          md.appendMarkdown(`### $(diff-modified) **Git State: Modified (Uncommitted)**\n\n`);
          md.appendMarkdown(`> This line has uncommitted changes in your working tree.\n\n`);
        } else if (lineInfo.state === 'pushed') {
          md.appendMarkdown(`### $(check) **Git State: Pushed**\n\n`);
          md.appendMarkdown(`> This line is pushed to the remote branch
          \`${fileState.upstreamBranch || 'upstream'}\`.\n\n`);
        } else {
          md.appendMarkdown(`### $(file-text) **Git State: Untracked**\n\n`);
          md.appendMarkdown(`> This line is not yet tracked by Git.\n\n`);
        }
    
        // Commit Details (if committed)
        if (lineInfo.commit) {
          const c = lineInfo.commit;
          md.appendMarkdown(`---\n\n`);
          md.appendMarkdown(`* **Commit**: \`${c.shortHash}\` (${c.summary})\n`);
          md.appendMarkdown(`* **Author**: ${c.author} • *${c.authorDate || ''}*\n\n`);
        }

        // Interactive Action Links
        md.appendMarkdown(`---\n\n`);
        md.appendMarkdown(`[$(git-compare) Compare File with
        Commit](command:gitStateDiffer.compareFileWithCommit) &nbsp;|&nbsp; `);
        md.appendMarkdown(`[$(diff) Compare This
        Line](command:gitStateDiffer.compareLineWithCommit)\n`);

        return new vscode.Hover(md);
      }
    }