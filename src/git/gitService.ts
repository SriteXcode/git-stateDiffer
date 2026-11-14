 import { execFile } from 'child_process';
    import * as path from 'path';
    import { CommitInfo, CommitSummary, FileGitState, LineInfo } from './gitTypes';
    import { parseBlamePorcelain, parseCommitList, parseDiffHunks } from './porcelainParser';

    export class GitService {
      /**
       * Helper to execute a git command in a working directory.
       */
      private execGit(args: string[], cwd: string): Promise<string> {
        return new Promise((resolve, reject) => {
          execFile('git', args, { cwd, maxBuffer: 10 * 1024 * 1024 }, (error, stdout) => {
            if (error) {
              reject(error);
            } else {
              resolve(stdout);
            }
          });
        });
      }

      /**
       * Gets the Git repository root for a given file path.
       */
      async getRepoRoot(filePath: string): Promise<string | null> {
        try {
          const dir = path.dirname(filePath);
          const out = await this.execGit(['rev-parse', '--show-toplevel'], dir);
          return path.normalize(out.trim());
        } catch {
          return null;
        }
      }
    
      /**
       * Gets the upstream tracking branch (e.g. "origin/main").
       * Returns null if no upstream is configured.
       */
      async getUpstreamBranch(repoRoot: string): Promise<string | null> {
        try {
          const out = await this.execGit(['rev-parse', '--abbrev-ref', '@{u}'], repoRoot);
          const branch = out.trim();
          return branch.length > 0 ? branch : null;
        } catch {
          return null;
        }
      }

      /**
       * Returns the set of commit hashes committed locally but not yet pushed.
       */
      async getUnpushedCommits(repoRoot: string, upstreamBranch: string | null):
      Promise<Set<string>> {
        const unpushed = new Set<string>();

        try {
          let args: string[];
          if (upstreamBranch) {
            args = ['rev-list', `${upstreamBranch}..HEAD`];
          } else {
            // If no upstream is configured, check if origin/main or origin/master exists
            const remotesOut = await this.execGit(['branch', '-r'], repoRoot).catch(() => '');
            if (remotesOut.includes('origin/main')) {
              args = ['rev-list', 'origin/main..HEAD'];
            } else if (remotesOut.includes('origin/master')) {
              args = ['rev-list', 'origin/master..HEAD'];
            } else {
              // All local commits are unpushed
              args = ['rev-list', 'HEAD'];
            }
          }

          const out = await this.execGit(args, repoRoot);
          out.split('\n').forEach((hash) => {
            const trimmed = hash.trim();
            if (trimmed) {
              unpushed.add(trimmed);
            }
          });
        } catch {
          // Empty or new repo
        }

        return unpushed;
      }

      /**
       * Computes the complete 3-tier status for every line of a file.
       */
      async getFileState(filePath: string, totalLines: number): Promise<FileGitState | null> {
        const repoRoot = await this.getRepoRoot(filePath);
        if (!repoRoot) {
          return null;
        }

        const relativePath = path.relative(repoRoot, filePath).replace(/\\/g, '/');
        const upstreamBranch = await this.getUpstreamBranch(repoRoot);
        const unpushedCommits = await this.getUnpushedCommits(repoRoot, upstreamBranch);
    
        // 1. Get blame from HEAD (gives line -> commit for committed state)
        let blameMap = new Map<number, CommitInfo>();
        try {
          const blameRaw = await this.execGit(['blame', '-p', 'HEAD', '--', relativePath],
          repoRoot);
          blameMap = parseBlamePorcelain(blameRaw, unpushedCommits);
        } catch {
          // File might be untracked or completely new
        }

        // 2. Get uncommitted diff against HEAD
        let diffHunks: ReturnType<typeof parseDiffHunks> = [];
        try {
          const diffRaw = await this.execGit(['diff', '-U0', 'HEAD', '--', relativePath],
          repoRoot);
          diffHunks = parseDiffHunks(diffRaw);
        } catch {
          // If error, ignore
        }

        // Set of lines modified in the working tree
        const modifiedLines = new Set<number>();
        for (const hunk of diffHunks) {
          const count = hunk.newLines === 0 ? 1 : hunk.newLines;
          for (let i = 0; i < count; i++) {
            modifiedLines.add(hunk.newStart + i);
          }
        }

        // Build line correlation between Working Tree and HEAD
        // Hunks tell us line shifts between HEAD and Working Copy
        const lines = new Map<number, LineInfo>();

        for (let currentLine = 1; currentLine <= totalLines; currentLine++) {
          if (modifiedLines.has(currentLine)) {
            lines.set(currentLine, {
              lineNumber: currentLine,
              state: 'modified',
              diffSummary: 'Uncommitted modification in working tree',
            });
            continue;
          }

          // Map currentLine back to HEAD line
          let headLine = currentLine;
          for (const hunk of diffHunks) {
            if (currentLine >= hunk.newStart + hunk.newLines) {
              headLine = headLine - (hunk.newLines - hunk.oldLines);
            }
          }

          const commit = blameMap.get(headLine);
          if (!commit) {
            // Untracked line or file
            lines.set(currentLine, {
              lineNumber: currentLine,
              state: 'untracked',
              diffSummary: 'Untracked code',
            });
          } else if (unpushedCommits.has(commit.hash)) {
            lines.set(currentLine, {
              lineNumber: currentLine,
              state: 'committed-unpushed',
              commit,
            });
          } else {
            lines.set(currentLine, {
              lineNumber: currentLine,
              state: 'pushed',
              commit,
            });
          }
        }

        return {
          repositoryRoot: repoRoot,
          relativePath,
          upstreamBranch,
          unpushedCommits,
          lines,
          isClean: modifiedLines.size === 0 && unpushedCommits.size === 0,
        };
      }
    
      /**
       * Retrieves the raw content of a file at a specific Git revision.
       */
      async getFileContentAtCommit(repoRoot: string, commit: string, relativePath: string):
      Promise<string> {
        try {
          return await this.execGit(['show', `${commit}:${relativePath}`], repoRoot);
        } catch (e: any) {
          return `// Unable to load content at revision ${commit}\n// ${e.message || e}`;
        }
      }
    
      /**
       * Retrieves the recent commit log for the QuickPick commit selector.
       */
      async getRecentCommits(repoRoot: string, maxCount: number = 50): Promise<CommitSummary[]> {
        try {
          const rawLog = await this.execGit(
            ['log', `-n${maxCount}`, '--format=%H%x09%h%x09%an%x09%ar%x09%s'],
            repoRoot
          );
          return parseCommitList(rawLog);
        } catch {
          return [];
        }
      }
    }