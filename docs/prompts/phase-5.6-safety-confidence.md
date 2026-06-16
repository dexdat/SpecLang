# Bootstrap Phase 5.6: Safety Confidence Scoring

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 5.6 of the bootstrap process.

**Prerequisites**: Phase 5.4 (Safety Nets), Phase 5.5 (Meta-Circular) complete.

## Your Task
Implement the confidence scoring system that quantifies how reliable a spec is for autonomous agent operation.

## Read These Specs First
1. `specs/safety-nets.spec.md` - Safety nets overview
2. `specs/safety-nets.spec.dir/analysis.spec.md` - Automated analysis
3. `specs/autonomous-validation.spec.md` - Validation requirements

## What to Build

### Files to Create
```
src/safety/
├── index.ts                      # Exports
├── confidence.ts                 # Confidence scoring engine
├── history.ts                   # Historical reliability tracking
└── vector-store.ts              # Similarity scoring for specs
```

### Confidence Score Interface

```typescript
// src/safety/confidence.ts

export interface ConfidenceScore {
  score: number;  // 0.0 - 1.0
  level: 'low' | 'medium' | 'high' | 'very_high';
  factors: {
    historicalReliability: number;
    authorReputation: number;
    similarityToGood: number;
    testCoverage: number;
    reviewStatus: number;
  };
  breakdown: {
    weightedScore: number;
    penalties: Array<{ factor: string; amount: number; reason: string }>;
    bonuses: Array<{ factor: string; amount: number; reason: string }>;
  };
  metadata: {
    calculatedAt: string;
    specVersion: string;
    specId: string;
  };
}

export interface ConfidenceConfig {
  weights: {
    historicalReliability: number;
    authorReputation: number;
    similarityToGood: number;
    testCoverage: number;
    reviewStatus: number;
  };
  thresholds: {
    low: number;
    medium: number;
    high: number;
  };
  penalties: {
    quarantined: number;
    failedBuilds: number;
    failedTests: number;
    unresolvedRefs: number;
  };
  bonuses: {
    humanReviewed: number;
    productionReady: number;
    comprehensiveTests: number;
  };
}
```

### Confidence Scoring Engine

```typescript
// src/safety/confidence.ts

export class ConfidenceScorer {
  private config: ConfidenceConfig;
  private historyStore: HistoryStore;
  private vectorStore: VectorStore;
  
  constructor(config: Partial<ConfidenceConfig> = {}) {
    this.config = this.mergeConfig(config);
    this.historyStore = new HistoryStore();
    this.vectorStore = new VectorStore();
  }

  async score(spec: Spec): Promise<ConfidenceScore> {
    const factors = await this.calculateFactors(spec);
    const breakdown = this.calculateBreakdown(factors);
    
    let weightedScore = this.calculateWeightedScore(factors);
    
    // Apply penalties
    const penalties = this.calculatePenalties(spec);
    for (const p of penalties) {
      weightedScore -= p.amount;
    }
    
    // Apply bonuses
    const bonuses = this.calculateBonuses(spec);
    for (const b of bonuses) {
      weightedScore += b.amount;
    }
    
    // Clamp to 0-1
    weightedScore = Math.max(0, Math.min(1, weightedScore));
    
    return {
      score: weightedScore,
      level: this.getLevel(weightedScore),
      factors,
      breakdown: { weightedScore, penalties, bonuses },
      metadata: {
        calculatedAt: new Date().toISOString(),
        specVersion: spec.metadata.version,
        specId: spec.id,
      },
    };
  }

  private async calculateFactors(spec: Spec): Promise<ConfidenceScore['factors']> {
    const [historical, author, similarity, coverage, review] = await Promise.all([
      this.getHistoricalReliability(spec),
      this.getAuthorReputation(spec),
      this.getSimilarityToGood(spec),
      this.getTestCoverage(spec),
      this.getReviewStatus(spec),
    ]);
    
    return {
      historicalReliability: historical,
      authorReputation: author,
      similarityToGood: similarity,
      testCoverage: coverage,
      reviewStatus: review,
    };
  }

  private async getHistoricalReliability(spec: Spec): Promise<number> {
    const history = await this.historyStore.get(spec.id);
    if (!history) return 0.5; // Unknown = neutral
    
    const { successCount, failureCount, totalAttempts } = history;
    if (totalAttempts === 0) return 0.5;
    
    // Weighted: recent successes matter more
    const recentWeight = 0.7;
    const recentSuccessRate = history.recentSuccessRate || successCount / totalAttempts;
    const overallSuccessRate = successCount / totalAttempts;
    
    return recentSuccessRate * recentWeight + overallSuccessRate * (1 - recentWeight);
  }

  private async getAuthorReputation(spec: Spec): Promise<number> {
    const author = spec.metadata.author;
    if (!author) return 0.5;
    
    const authorHistory = await this.historyStore.getByAuthor(author);
    if (!authorHistory) return 0.5;
    
    // Score based on author's track record
    const specsWritten = authorHistory.specsWritten || 0;
    const avgConfidence = authorHistory.avgConfidence || 0.5;
    
    // More specs written = higher confidence (up to a point)
    const volumeBonus = Math.min(specsWritten / 50, 0.2);
    
    return Math.min(avgConfidence + volumeBonus, 1.0);
  }

  private async getSimilarityToGood(spec: Spec): Promise<number> {
    const embedding = await this.vectorStore.embed(spec);
    
    // Compare against known-good specs
    const goodSpecs = await this.vectorStore.getGoodSpecs();
    
    let maxSimilarity = 0;
    for (const good of goodSpecs) {
      const sim = this.cosineSimilarity(embedding, good.embedding);
      maxSimilarity = Math.max(maxSimilarity, sim);
    }
    
    return maxSimilarity;
  }

  private async getTestCoverage(spec: Spec): Promise<number> {
    const tests = await this.findTestsForSpec(spec);
    
    if (tests.length === 0) return 0.0;
    
    // Check coverage of blocks
    const blocks = spec.getBlocks();
    let covered = 0;
    
    for (const block of blocks) {
      const hasTest = tests.some(t => 
        t.coversBlock === block.id || 
        t.specId === spec.id
      );
      if (hasTest) covered++;
    }
    
    return blocks.length > 0 ? covered / blocks.length : 0;
  }

  private getReviewStatus(spec: Spec): number {
    const tags = spec.metadata.tags || [];
    
    if (tags.includes('human_reviewed')) return 1.0;
    if (tags.includes('peer_reviewed')) return 0.8;
    if (tags.includes('auto_validated')) return 0.6;
    
    return 0.3;
  }

  private calculateWeightedScore(factors: ConfidenceScore['factors']): number {
    const { weights } = this.config;
    
    return (
      factors.historicalReliability * weights.historicalReliability +
      factors.authorReputation * weights.authorReputation +
      factors.similarityToGood * weights.similarityToGood +
      factors.testCoverage * weights.testCoverage +
      factors.reviewStatus * weights.reviewStatus
    );
  }

  private calculatePenalties(spec: Spec): ConfidenceScore['breakdown']['penalties'] {
    const penalties: ConfidenceScore['breakdown']['penalties'] = [];
    const { penalties: penaltyConfig } = this.config;
    
    if (spec.metadata.tags?.includes('quarantined')) {
      penalties.push({
        factor: 'quarantined',
        amount: penaltyConfig.quarantined,
        reason: 'Spec is currently quarantined',
      });
    }
    
    // Check for failed builds/tests
    const buildStatus = spec.metadata.buildStatus;
    if (buildStatus === 'failed') {
      penalties.push({
        factor: 'failedBuilds',
        amount: penaltyConfig.failedBuilds,
        reason: 'Last build failed',
      });
    }
    
    if (spec.metadata.testStatus === 'failed') {
      penalties.push({
        factor: 'failedTests',
        amount: penaltyConfig.failedTests,
        reason: 'Tests are failing',
      });
    }
    
    // Check for unresolved references
    const unresolvedRefs = spec.getUnresolvedReferences();
    if (unresolvedRefs.length > 0) {
      penalties.push({
        factor: 'unresolvedRefs',
        amount: penaltyConfig.unresolvedRefs * unresolvedRefs.length,
        reason: `${unresolvedRefs.length} unresolved references`,
      });
    }
    
    return penalties;
  }

  private calculateBonuses(spec: Spec): ConfidenceScore['breakdown']['bonuses'] {
    const bonuses: ConfidenceScore['breakdown']['bonuses'] = [];
    const { bonuses: bonusConfig } = this.config;
    
    if (spec.metadata.tags?.includes('human_reviewed')) {
      bonuses.push({
        factor: 'humanReviewed',
        amount: bonusConfig.humanReviewed,
        reason: 'Human reviewed',
      });
    }
    
    if (spec.metadata.project_level === 'Production') {
      bonuses.push({
        factor: 'productionReady',
        amount: bonusConfig.productionReady,
        reason: 'Production-level spec',
      });
    }
    
    // Check for comprehensive tests
    const testCount = spec.metadata.testCount || 0;
    if (testCount >= 5) {
      bonuses.push({
        factor: 'comprehensiveTests',
        amount: bonusConfig.comprehensiveTests,
        reason: `${testCount} tests found`,
      });
    }
    
    return bonuses;
  }

  private getLevel(score: number): ConfidenceScore['level'] {
    const { thresholds } = this.config;
    if (score >= thresholds.very_high) return 'very_high';
    if (score >= thresholds.high) return 'high';
    if (score >= thresholds.medium) return 'medium';
    return 'low';
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private mergeConfig(config: Partial<ConfidenceConfig>): ConfidenceConfig {
    return {
      weights: { ...defaultConfig.weights, ...config.weights },
      thresholds: { ...defaultConfig.thresholds, ...config.thresholds },
      penalties: { ...defaultConfig.penalties, ...config.penalties },
      bonuses: { ...defaultConfig.bonuses, ...config.bonuses },
    };
  }

  async recordSuccess(specId: string): Promise<void> {
    await this.historyStore.recordSuccess(specId);
  }

  async recordFailure(specId: string): Promise<void> {
    await this.historyStore.recordFailure(specId);
  }
}

const defaultConfig: ConfidenceConfig = {
  weights: {
    historicalReliability: 0.25,
    authorReputation: 0.15,
    similarityToGood: 0.2,
    testCoverage: 0.25,
    reviewStatus: 0.15,
  },
  thresholds: {
    low: 0.4,
    medium: 0.6,
    high: 0.8,
    very_high: 0.95,
  },
  penalties: {
    quarantined: 0.3,
    failedBuilds: 0.2,
    failedTests: 0.15,
    unresolvedRefs: 0.05,
  },
  bonuses: {
    humanReviewed: 0.1,
    productionReady: 0.05,
    comprehensiveTests: 0.05,
  },
};
```

### Historical Reliability Store

```typescript
// src/safety/history.ts

export interface SpecHistory {
  specId: string;
  successCount: number;
  failureCount: number;
  lastSuccess: string | null;
  lastFailure: string | null;
  recentSuccessRate: number; // Last 10 attempts
  totalAttempts: number;
}

export interface AuthorHistory {
  author: string;
  specsWritten: number;
  avgConfidence: number;
  specs: Array<{
    specId: string;
    avgConfidence: number;
    lastScore: number;
  }>;
}

export class HistoryStore {
  private db: Database;
  
  constructor() {
    this.db = new Database('safety/history.db');
  }
  
  async get(specId: string): Promise<SpecHistory | null> {
    return this.db.get('SELECT * FROM spec_history WHERE spec_id = ?', specId);
  }
  
  async getByAuthor(author: string): Promise<AuthorHistory | null> {
    return this.db.get('SELECT * FROM author_history WHERE author = ?', author);
  }
  
  async recordSuccess(specId: string): Promise<void> {
    await this.db.run(`
      INSERT INTO spec_history (spec_id, success_count, failure_count, last_success, total_attempts)
      VALUES (?, 1, 0, datetime('now'), 1)
      ON CONFLICT(spec_id) DO UPDATE SET
        success_count = success_count + 1,
        last_success = datetime('now'),
        total_attempts = total_attempts + 1
    `, specId);
    
    await this.updateRecentSuccessRate(specId);
  }
  
  async recordFailure(specId: string): Promise<void> {
    await this.db.run(`
      INSERT INTO spec_history (spec_id, success_count, failure_count, last_failure, total_attempts)
      VALUES (?, 0, 1, datetime('now'), 1)
      ON CONFLICT(spec_id) DO UPDATE SET
        failure_count = failure_count + 1,
        last_failure = datetime('now'),
        total_attempts = total_attempts + 1
    `, specId);
    
    await this.updateRecentSuccessRate(specId);
  }
  
  private async updateRecentSuccessRate(specId: string): Promise<void> {
    const history = await this.get(specId);
    if (!history) return;
    
    // Calculate recent success rate from last 10 attempts
    const recent = await this.db.get(`
      SELECT success_count, failure_count 
      FROM spec_history 
      WHERE spec_id = ?
      ORDER BY rowid DESC 
      LIMIT 10
    `, specId);
    
    // Simplified: just use overall rate for now
    const rate = history.successCount / history.totalAttempts;
    
    await this.db.run(`
      UPDATE spec_history SET recent_success_rate = ? WHERE spec_id = ?
    `, rate, specId);
  }
  
  async updateAuthorStats(author: string, specId: string, confidence: number): Promise<void> {
    await this.db.run(`
      INSERT INTO author_history (author, specs_written, avg_confidence)
      VALUES (?, 1, ?)
      ON CONFLICT(author) DO UPDATE SET
        specs_written = specs_written + 1
    `, author, confidence);
  }
}
```

### Vector Store for Similarity

```typescript
// src/safety/vector-store.ts

import { createHash } from 'crypto';

export interface SpecVector {
  specId: string;
  embedding: number[];
  layer: number;
  agentSupport: string;
  createdAt: string;
}

export class VectorStore {
  private vectors: Map<string, SpecVector> = new Map();
  
  async embed(spec: Spec): Promise<number[]> {
    // Simple embedding based on spec content
    // In production, use actual embeddings (e.g., OpenAI, local model)
    
    const content = this.normalizeSpecContent(spec);
    const words = content.split(/\s+/);
    
    // Create a simple hash-based embedding
    const embedding = new Array(128).fill(0);
    
    for (let i = 0; i < words.length; i++) {
      const hash = this.hashWord(words[i]);
      for (let j = 0; j < embedding.length; j++) {
        embedding[j] += (hash[j % hash.length] / 255) * Math.exp(-i / words.length);
      }
    }
    
    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    return embedding.map(v => v / norm);
  }
  
  private normalizeSpecContent(spec: Spec): string {
    const parts: string[] = [
      spec.id,
      spec.metadata.short || '',
      spec.getContent(),
      ...(spec.metadata.tags || []),
    ];
    
    return parts.join(' ').toLowerCase();
  }
  
  private hashWord(word: string): number[] {
    const hash = createHash('sha256').update(word).digest();
    return Array.from(hash);
  }
  
  async getGoodSpecs(): Promise<SpecVector[]> {
    // Return known-good specs for comparison
    // In production, maintain a curated list
    
    return Array.from(this.vectors.values()).filter(v => 
      v.agentSupport === 'agent_autonomous'
    );
  }
  
  async addSpecVector(spec: Spec, embedding: number[]): Promise<void> {
    const vector: SpecVector = {
      specId: spec.id,
      embedding,
      layer: spec.metadata.layer,
      agentSupport: spec.metadata.agent_support,
      createdAt: new Date().toISOString(),
    };
    
    this.vectors.set(spec.id, vector);
  }
  
  async findSimilar(specId: string, limit = 5): Promise<Array<{ specId: string; similarity: number }>> {
    const target = this.vectors.get(specId);
    if (!target) return [];
    
    const similarities: Array<{ specId: string; similarity: number }> = [];
    
    for (const [id, vector] of this.vectors) {
      if (id === specId) continue;
      
      const sim = this.cosineSimilarity(target.embedding, vector.embedding);
      similarities.push({ specId: id, similarity: sim });
    }
    
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }
  
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
```

### CLI Interface

```bash
# Calculate confidence score for a spec
speclang safety confidence score specs/auth.spec.scl

# View confidence history
speclang safety confidence history specs/auth.spec.scl

# View author reputation
speclang safety confidence author lexykwaii

# Find similar specs
speclang safety confidence similar specs/auth.spec.scl

# Record success/failure
speclang safety confidence record --spec specs/auth.spec.scl --result success
speclang safety confidence record --spec specs/auth.spec.scl --result failure

# Export confidence report
speclang safety confidence report --format json
```

## Test Cases
1. Confidence scoring returns 0-1 score
2. Historical reliability calculated correctly
3. Author reputation tracked
4. Similarity to good specs measured
5. Test coverage factored in
6. Review status weighted
7. Penalties applied correctly
8. Bonuses applied correctly
9. CLI commands work
10. History persistence works

## Validation
```bash
bun test tests/safety/confidence.test.ts
```

## Output Format
After completing, output:
1. ConfidenceScorer implementation
2. HistoryStore implementation
3. VectorStore implementation
4. CLI commands
5. Test results
