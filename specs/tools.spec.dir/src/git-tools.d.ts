/**
 * SPECLANG-GENERATED: Git Tools
 * Source: @speclang/tools
 *
 * Git integration tools
 */
import { Tool, GitCommitInput, GitCommitOutput, GitStatusInput, GitStatusOutput } from './types.js';
/**
 * Git commit tool - commit changed files
 */
export declare const gitCommitTool: Tool<GitCommitInput, GitCommitOutput>;
/**
 * Git status tool - check git status
 */
export declare const gitStatusTool: Tool<GitStatusInput, GitStatusOutput>;
/**
 * Git diff tool - get diff of changes
 */
export declare const gitDiffTool: Tool<{
    files?: string[];
}, {
    diff: string;
}>;
/**
 * Git log tool - get commit history
 */
export declare const gitLogTool: Tool<{
    limit?: number;
}, {
    commits: Array<{
        hash: string;
        message: string;
        date: string;
    }>;
}>;
/**
 * Git branch tool - get current branch
 */
export declare const gitBranchTool: Tool<{}, {
    branch: string;
}>;
/**
 * Git add tool - stage files
 */
export declare const gitAddTool: Tool<{
    files: string[];
}, {
    staged: number;
}>;
//# sourceMappingURL=git-tools.d.ts.map