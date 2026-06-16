/**
 * SPECLANG-GENERATED: File writer for codegen
 * Source: @speclang/codegen @block:writer
 */
import type { GeneratedFile, WriteResult } from './types';
export declare class CodeWriter {
    /** Write generated files to disk */
    write(files: GeneratedFile[], options?: {
        dryRun?: boolean;
        backup?: boolean;
    }): WriteResult;
    /** Update file with SPECLANG-ID markers for incremental updates */
    updateWithMarkers(filepath: string, blocks: Array<{
        id: string;
        content: string;
    }>): void;
    /** Backup a file before overwriting */
    backup(filepath: string): string | null;
    /** Check if file has changed since last write */
    hasChanged(filepath: string, newContent: string): boolean;
    /** Read existing file content */
    readFile(filepath: string): string | null;
    /** Delete a file */
    deleteFile(filepath: string): boolean;
    /** List files in directory */
    listFiles(dir: string, extension?: string): string[];
}
export declare const codeWriter: CodeWriter;
//# sourceMappingURL=writer.d.ts.map