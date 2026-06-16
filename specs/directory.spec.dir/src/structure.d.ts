/**
 * Directory pattern definitions
 */
export interface DirectoryPattern {
    spec_file: string[];
    spec_dir: string[];
    nesting: string[];
}
export interface NamingRules {
    spec_files: string[];
    spec_dirs: string[];
    sub_specs: string[];
}
export interface DepthControl {
    level_0: LevelInfo;
    level_1: LevelInfo;
    level_2: LevelInfo;
    level_3_plus: LevelInfo;
    level_10: LevelInfo;
    note: string;
}
export interface LevelInfo {
    files: string;
    owner: string;
}
export declare const DEFAULT_DIRECTORY_PATTERN: DirectoryPattern;
export declare const DEFAULT_NAMING_RULES: NamingRules;
export declare const DEFAULT_DEPTH_CONTROL: DepthControl;
//# sourceMappingURL=structure.d.ts.map