"use strict";
// SPECLANG-GENERATED: @speclang/project-maturity-levels
// DO NOT EDIT MANUALLY
// Source: specs/project-maturity-levels.dir/criteria.spec.md
Object.defineProperty(exports, "__esModule", { value: true });
exports.CriteriaChecker = void 0;
exports.createCriteriaChecker = createCriteriaChecker;
const levels_1 = require("./levels");
/**
 * Criteria Checker
 *
 * Validates whether a spec meets the criteria for a given
 * maturity level and suggests appropriate levels.
 */
class CriteriaChecker {
    /**
     * Check if a spec meets the criteria for a given level
     */
    checkLevel(spec, level) {
        const definition = (0, levels_1.getLevelDefinition)(level);
        if (!definition) {
            return {
                meetsCriteria: false,
                missing: [`Unknown level: ${level}`],
                warnings: []
            };
        }
        const results = {
            meetsCriteria: true,
            missing: [],
            warnings: []
        };
        // Check required fields
        for (const field of definition.requiredFields) {
            if (!this.hasField(spec, field)) {
                results.missing.push(`Missing required field: ${field}`);
                results.meetsCriteria = false;
            }
        }
        // Check test coverage
        if (definition.recommendedTests.length > 0) {
            const coverage = this.getTestCoverage(spec);
            for (const testType of definition.recommendedTests) {
                if (!coverage[testType]) {
                    results.warnings.push(`Missing recommended test: ${testType}`);
                }
            }
        }
        // Check documentation completeness
        const docScore = this.scoreDocumentation(spec);
        const minDocScore = this.getMinDocScore(definition.criteria.documentation);
        if (docScore < minDocScore) {
            results.warnings.push(`Documentation below level threshold (${docScore}/${minDocScore})`);
        }
        // Check testing level
        const testScore = this.scoreTesting(spec);
        const minTestScore = this.getMinTestScore(definition.criteria.testing);
        if (testScore < minTestScore) {
            results.warnings.push(`Testing below level threshold (${testScore}/${minTestScore})`);
        }
        return results;
    }
    /**
     * Suggest the appropriate level for a spec based on its content
     */
    suggestLevel(spec) {
        // Find highest level this spec qualifies for
        for (let i = levels_1.MATURITY_LEVELS.length - 1; i >= 0; i--) {
            const result = this.checkLevel(spec, levels_1.MATURITY_LEVELS[i].name);
            if (result.meetsCriteria) {
                return levels_1.MATURITY_LEVELS[i].name;
            }
        }
        return 'POC';
    }
    /**
     * Get all levels a spec qualifies for
     */
    getQualifiedLevels(spec) {
        const qualified = [];
        for (const level of levels_1.MATURITY_LEVELS) {
            const result = this.checkLevel(spec, level.name);
            if (result.meetsCriteria) {
                qualified.push(level.name);
            }
        }
        return qualified;
    }
    /**
     * Check if spec has a specific field
     */
    hasField(spec, field) {
        return spec.metadata[field] !== undefined && spec.metadata[field] !== null;
    }
    /**
     * Get test coverage from spec
     */
    getTestCoverage(spec) {
        if (spec.testCoverage) {
            return spec.testCoverage;
        }
        // Default coverage based on available info
        return {
            unit: false,
            integration: false,
            e2e: false,
            performance: false,
            security: false,
            compliance: false,
            chaos: false
        };
    }
    /**
     * Score documentation completeness (0-100)
     */
    scoreDocumentation(spec) {
        let score = 0;
        const metadata = spec.metadata;
        // Check header fields
        if (metadata.id)
            score += 10;
        if (metadata.version)
            score += 10;
        if (metadata.short)
            score += 10;
        if (metadata.layer !== undefined)
            score += 10;
        if (metadata.tags && metadata.tags.length > 0)
            score += 10;
        if (metadata.status)
            score += 10;
        if (metadata.project_level)
            score += 10;
        if (metadata.agent_support)
            score += 10;
        // Check content blocks
        if (spec.blocks && spec.blocks.length > 0) {
            score += 20;
        }
        return Math.min(score, 100);
    }
    /**
     * Get minimum documentation score for a level
     */
    getMinDocScore(level) {
        const scores = {
            sparse: 10,
            usable: 40,
            improving: 60,
            complete: 80
        };
        return scores[level];
    }
    /**
     * Score testing completeness (0-100)
     */
    scoreTesting(spec) {
        const coverage = this.getTestCoverage(spec);
        let score = 0;
        if (coverage.unit)
            score += 20;
        if (coverage.integration)
            score += 20;
        if (coverage.e2e)
            score += 20;
        if (coverage.performance)
            score += 15;
        if (coverage.security)
            score += 15;
        if (coverage.compliance)
            score += 10;
        return Math.min(score, 100);
    }
    /**
     * Get minimum testing score for a level
     */
    getMinTestScore(level) {
        const scores = {
            minimal: 0,
            basic: 20,
            growing: 40,
            comprehensive: 60,
            full: 80
        };
        return scores[level];
    }
}
exports.CriteriaChecker = CriteriaChecker;
/**
 * Create a new CriteriaChecker instance
 */
function createCriteriaChecker() {
    return new CriteriaChecker();
}
//# sourceMappingURL=criteria.js.map