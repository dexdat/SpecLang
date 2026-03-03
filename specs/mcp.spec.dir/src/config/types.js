"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = void 0;
exports.DEFAULT_CONFIG = {
    database: {
        path: '.speclang/speclang.db',
        wal_mode: true,
    },
    server: {
        mode: 'stdio',
        host: 'localhost',
    },
    logging: {
        level: 'info',
    },
    limits: {
        max_connections: 100,
        query_timeout_ms: 5000,
        max_results: 1000,
    },
};
//# sourceMappingURL=types.js.map