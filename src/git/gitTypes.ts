export type LineGitState = 'pushed' | 'committed-unpushed' | 'modified' | 'untracked';

    export interface CommitInfo {
      hash: string;
      shortHash: string;
      author: string;
      authorEmail?: string;
      authorDate?: string;
      committer?: string;
      committerDate?: string;
      summary: string;
      isPushed: boolean;
    }

    export interface LineInfo {
      lineNumber: number; // 1-based line number in working document
      state: LineGitState;
      commit?: CommitInfo;
      diffSummary?: string;
    }

    export interface DiffHunk {
      oldStart: number;
      oldLines: number;
      newStart: number;
      newLines: number;
    }

    export interface FileGitState {
      repositoryRoot: string;
      relativePath: string;
      upstreamBranch: string | null;
      unpushedCommits: Set<string>;
      lines: Map<number, LineInfo>; // 1-based line number -> LineInfo
      isClean: boolean;
    }

    export interface CommitSummary {
      hash: string;
      shortHash: string;
      subject: string;
      author: string;
      relativeDate: string;
    }