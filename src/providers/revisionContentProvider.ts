import * as vscode from 'vscode';
    import { GitService } from '../git/gitService';

    export const REVISION_SCHEME = 'git-state-revision';

    /**
     * Encodes a commit and file path into a virtual URI:
     * git-state-revision://authority/path?commit=<hash>&repo=<repoRoot>
     */
    export function createRevisionUri(repoRoot: string, commit: string, relativePath: string):
    vscode.Uri {
      return vscode.Uri.from({
        scheme: REVISION_SCHEME,
        path: '/' + relativePath,
        query: JSON.stringify({ commit, repoRoot, relativePath }),
      });
    }

    export class RevisionContentProvider implements vscode.TextDocumentContentProvider {
      constructor(private gitService: GitService) {}

      async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
        try {
          const { commit, repoRoot, relativePath } = JSON.parse(uri.query);
          return await this.gitService.getFileContentAtCommit(repoRoot, commit, relativePath);
        } catch (e: any) {
          return `// Error retrieving file revision: ${e.message || e}`;
        }
      }
    }