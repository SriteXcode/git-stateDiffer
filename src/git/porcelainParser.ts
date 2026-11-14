import { CommitInfo, DiffHunk, CommitSummary } from './gitTypes';

    /**
     * Parses raw output from `git blame -p` (porcelain format).
     * Returns a map of (1-based line in HEAD -> CommitInfo).
     */
    export function parseBlamePorcelain(
      rawBlame: string,
      unpushedCommits: Set<string>
    ): Map<number, CommitInfo> {
      const lineToCommit = new Map<number, CommitInfo>();
      const commitsByHash = new Map<string, Partial<CommitInfo>>();

      const lines = rawBlame.split('\n');
      let currentHash = '';
      let currentFinalLine = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) {
          continue;
        }

        // Header line: <hash> <orig-line> <final-line> [<num-lines>]
        const headerMatch = line.match(/^([0-9a-f]{40})\s+(\d+)\s+(\d+)/i);
        if (headerMatch) {
          currentHash = headerMatch[1];
          currentFinalLine = parseInt(headerMatch[3], 10);

          if (!commitsByHash.has(currentHash)) {
            commitsByHash.set(currentHash, {
              hash: currentHash,
              shortHash: currentHash.substring(0, 7),
              isPushed: !unpushedCommits.has(currentHash),
            });
          }
          continue;
        }

        const commit = commitsByHash.get(currentHash);
        if (!commit) {
          continue;
        }

        if (line.startsWith('author ')) {
          commit.author = line.substring(7).trim();
        } else if (line.startsWith('author-mail ')) {
          commit.authorEmail = line.substring(12).trim();
        } else if (line.startsWith('author-time ')) {
          const timestamp = parseInt(line.substring(12).trim(), 10);
          commit.authorDate = new Date(timestamp * 1000).toLocaleString();
        } else if (line.startsWith('committer ')) {
          commit.committer = line.substring(10).trim();
        } else if (line.startsWith('committer-time ')) {
          const timestamp = parseInt(line.substring(15).trim(), 10);
          commit.committerDate = new Date(timestamp * 1000).toLocaleString();
        } else if (line.startsWith('summary ')) {
          commit.summary = line.substring(8).trim();
        } else if (line.startsWith('\t')) {
          // Line content line in blame porcelain: marks end of entry for this line
          if (currentFinalLine > 0) {
            lineToCommit.set(currentFinalLine, commit as CommitInfo);
          }
        }
      }

      return lineToCommit;
    }

    /**
     * Parses raw unified diff hunks from `git diff -U0` (e.g., `@@ -1,2 +3,4 @@`).
     * Tells us which lines in the working file were added/modified/deleted.
     */
    export function parseDiffHunks(rawDiff: string): DiffHunk[] {
      const hunks: DiffHunk[] = [];
      const regex = /^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@/gm;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(rawDiff)) !== null) {
        const oldStart = parseInt(match[1], 10);
        const oldLines = match[2] !== undefined ? parseInt(match[2], 10) : 1;
        const newStart = parseInt(match[3], 10);
        const newLines = match[4] !== undefined ? parseInt(match[4], 10) : 1;

        hunks.push({ oldStart, oldLines, newStart, newLines });
      }

      return hunks;
    }

    /**
     * Parses commits from `git log --format="%H%x09%h%x09%an%x09%ar%x09%s"`.
     */
    export function parseCommitList(rawLog: string): CommitSummary[] {
      const results: CommitSummary[] = [];
      const lines = rawLog.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          continue;
        }
        const parts = trimmed.split('\t');
        if (parts.length >= 5) {
          results.push({
            hash: parts[0],
            shortHash: parts[1],
            author: parts[2],
            relativeDate: parts[3],
            subject: parts.slice(4).join('\t'),
          });
        }
      }

      return results;
    }