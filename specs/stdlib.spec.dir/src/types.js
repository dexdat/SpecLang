"use strict";
// SPECLANG-GENERATED
// Source: @speclang/stdlib/types
// DO NOT EDIT MANUALLY
Object.defineProperty(exports, "__esModule", { value: true });
exports.Version = exports.Duration = void 0;
// Time operations
exports.Duration = {
    fromMs: (ms) => ({
        ms,
        seconds: Math.floor(ms / 1000),
        minutes: Math.floor(ms / 60000),
        hours: Math.floor(ms / 3600000),
        days: Math.floor(ms / 86400000),
        weeks: Math.floor(ms / 604800000)
    }),
    fromSeconds: (seconds) => exports.Duration.fromMs(seconds * 1000),
    fromMinutes: (minutes) => exports.Duration.fromMs(minutes * 60000),
    fromHours: (hours) => exports.Duration.fromMs(hours * 3600000),
    fromDays: (days) => exports.Duration.fromMs(days * 86400000),
    toMs: (duration) => duration.ms
};
// Semantic version operations
exports.Version = {
    parse: (version) => {
        const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;
        if (semverRegex.test(version)) {
            return version;
        }
        return null;
    },
    compare: (a, b) => {
        const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
        const [bMajor, bMinor, bPatch] = b.split('.').map(Number);
        if (aMajor !== bMajor)
            return aMajor - bMajor;
        if (aMinor !== bMinor)
            return aMinor - bMinor;
        return aPatch - bPatch;
    },
    isCompatible: (a, b) => {
        const [aMajor] = a.split('.').map(Number);
        const [bMajor] = b.split('.').map(Number);
        return aMajor === bMajor;
    }
};
//# sourceMappingURL=types.js.map