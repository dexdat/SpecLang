export interface CommitOptions {
    changeId?: string;
    parentChangeId?: string;
}
export declare class GitIntegration {
    private projectDir;
    constructor(projectDir: string);
    isGitRepo(): Promise<boolean>;
    commitFile(filePath: string, message: string, options?: CommitOptions): Promise<void>;
    commitFiles(files: Array<{
        path: string;
        message: string;
    }>, options?: CommitOptions): Promise<void>;
    getLastCommitMessage(): Promise<string | null>;
    getFileLastModified(filePath: string): Promise<Date | null>;
    hasUncommittedChanges(): Promise<boolean>;
    getChangedFiles(): Promise<string[]>;
}
//# sourceMappingURL=git.d.ts.map