"use strict";
// Generated from specs/directory-structure.dir/pattern.spec.md
// DO NOT EDIT MANUALLY
// Source: @block:dir/pattern, @block:dir/naming, @block:dir/depth, @block:dir/unlimited-nesting
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_DEPTH_CONTROL = exports.DEFAULT_NAMING_RULES = exports.DEFAULT_DIRECTORY_PATTERN = void 0;
exports.DEFAULT_DIRECTORY_PATTERN = {
    spec_file: [
        'auth.scl',
        'auth.spec.md',
        'auth.spec.yaml',
        'auth.go.spec',
    ],
    spec_dir: [
        'auth.dir/',
        'auth.dir/entities.scl',
        'auth.dir/operations.scl',
    ],
    nesting: [
        'auth.dir/',
        'auth.dir/login.dir/',
        'auth.dir/login.dir/handler.go.spec',
    ],
};
exports.DEFAULT_NAMING_RULES = {
    spec_files: ['lowercase with hyphens', 'auth.spec.md', 'user-profile.spec.yaml'],
    spec_dirs: ['same name as parent spec + .dir', 'auth.spec.md → auth.dir/'],
    sub_specs: ['descriptive name', 'login.spec.yaml', 'jwt-handler.go.spec'],
};
exports.DEFAULT_DEPTH_CONTROL = {
    level_0: {
        files: 'project.scl',
        owner: 'user + orchestrator',
    },
    level_1: {
        files: '*.spec.md (overviews)',
        owner: 'spec-writer',
    },
    level_2: {
        files: '*.dir/*.spec.yaml',
        owner: 'spec-writer',
    },
    level_3_plus: {
        files: 'deeper .dir nesting',
        owner: 'spec-writer',
    },
    level_10: {
        files: '*.go.spec (direct mapping)',
        owner: 'code-gen',
    },
    note: 'Nesting depth is unlimited; levels shown are typical patterns.',
};
//# sourceMappingURL=structure.js.map