/**
 * SPECLANG-GENERATED: File Tools
 * Source: @speclang/tools
 *
 * File operations with ownership enforcement
 */
import { Tool, CreateSpecInput, CreateSpecOutput, ReadFileInput, ReadFileOutput, ReadHeaderInput, ReadHeaderOutput, UpdateSpecInput, UpdateSpecOutput, DeleteSpecInput, DeleteSpecOutput } from './types.js';
/**
 * Create spec tool - creates a new spec file
 */
export declare const createSpecTool: Tool<CreateSpecInput, CreateSpecOutput>;
/**
 * Read file tool - reads full file content
 */
export declare const readFileTool: Tool<ReadFileInput, ReadFileOutput>;
/**
 * Read header tool - reads only the header (efficient)
 */
export declare const readHeaderTool: Tool<ReadHeaderInput, ReadHeaderOutput>;
/**
 * Update spec tool - updates existing spec
 */
export declare const updateSpecTool: Tool<UpdateSpecInput, UpdateSpecOutput>;
/**
 * Delete spec tool - deletes a spec file
 */
export declare const deleteSpecTool: Tool<DeleteSpecInput, DeleteSpecOutput>;
/**
 * List files tool - lists files in a directory
 */
export declare const listFilesTool: Tool<{
    path?: string;
    pattern?: string;
}, {
    files: string[];
    count: number;
}>;
//# sourceMappingURL=file-tools.d.ts.map