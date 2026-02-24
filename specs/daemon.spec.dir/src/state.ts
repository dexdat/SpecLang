/**
 * State persistence for speclangd
 * 
 * Generated from: @speclang/daemon/architecture
 * 
 * Persists daemon state to .speclang/daemon-state.json
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { DaemonStatus, DaemonStatusKind, AgentId } from './types';

export interface DaemonState {
  cascadeDepth: number;
  filesChanged: string[];
  activeAgents: AgentId[];
  startedAt: number;
  lastEventAt?: number;
  quietSince?: number;
  status: DaemonStatusKind;
}

const STATE_FILE = '.speclang/daemon-state.json';

export class State {
  private state: DaemonState;
  private statePath: string;

  constructor(statePath?: string) {
    this.statePath = statePath || STATE_FILE;
    this.state = this.createInitialState();
  }

  /**
   * Create initial state
   */
  private createInitialState(): DaemonState {
    return {
      cascadeDepth: 0,
      filesChanged: [],
      activeAgents: [],
      startedAt: Date.now(),
      status: DaemonStatusKind.Idle,
    };
  }

  /**
   * Load state from disk
   */
  async load(): Promise<DaemonState> {
    try {
      if (await fs.pathExists(this.statePath)) {
        const content = await fs.readFile(this.statePath, 'utf-8');
        const loaded = JSON.parse(content);
        this.state = { ...this.createInitialState(), ...loaded };
        console.log(`[State] Loaded state from ${this.statePath}`);
      }
    } catch (error) {
      console.warn(`[State] Failed to load state:`, error);
      this.state = this.createInitialState();
    }
    return this.state;
  }

  /**
   * Save state to disk
   */
  async save(): Promise<void> {
    try {
      await fs.ensureFile(this.statePath);
      await fs.writeFile(
        this.statePath,
        JSON.stringify(this.state, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error(`[State] Failed to save state:`, error);
    }
  }

  /**
   * Get current state
   */
  get(): DaemonState {
    return { ...this.state };
  }

  /**
   * Update status
   */
  setStatus(status: DaemonStatusKind): void {
    this.state.status = status;
    this.save().catch(console.error);
  }

  /**
   * Update cascade depth
   */
  setCascadeDepth(depth: number): void {
    this.state.cascadeDepth = depth;
    this.save().catch(console.error);
  }

  /**
   * Add a changed file
   */
  addChangedFile(file: string): void {
    if (!this.state.filesChanged.includes(file)) {
      this.state.filesChanged.push(file);
    }
    this.state.lastEventAt = Date.now();
    this.save().catch(console.error);
  }

  /**
   * Add an active agent
   */
  addActiveAgent(agentId: AgentId): void {
    if (!this.state.activeAgents.includes(agentId)) {
      this.state.activeAgents.push(agentId);
    }
    this.save().catch(console.error);
  }

  /**
   * Remove an active agent
   */
  removeActiveAgent(agentId: AgentId): void {
    this.state.activeAgents = this.state.activeAgents.filter(
      (a) => a !== agentId
    );
    this.save().catch(console.error);
  }

  /**
   * Set quiet since timestamp
   */
  setQuietSince(timestamp: number): void {
    this.state.quietSince = timestamp;
    this.save().catch(console.error);
  }

  /**
   * Clear quiet since
   */
  clearQuietSince(): void {
    this.state.quietSince = undefined;
    this.save().catch(console.error);
  }

  /**
   * Get status for API
   */
  getStatus(): DaemonStatus {
    return {
      status: this.state.status,
      cascadeDepth: this.state.cascadeDepth,
      filesChanged: this.state.filesChanged.length,
      activeAgents: this.state.activeAgents.length,
      startedAt: this.state.startedAt,
      lastEventAt: this.state.lastEventAt,
      quietSince: this.state.quietSince,
    };
  }

  /**
   * Reset state
   */
  async reset(): Promise<void> {
    this.state = this.createInitialState();
    await this.save();
  }

  /**
   * Clear changed files
   */
  clearChangedFiles(): void {
    this.state.filesChanged = [];
    this.save().catch(console.error);
  }
}
