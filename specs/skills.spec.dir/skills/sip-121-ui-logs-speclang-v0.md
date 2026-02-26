---
name: sip-121-ui-logs-speclang-v0
title: "SIP 121: UI Log Viewer"
version: 0.1.0
description: Log viewer component for SpecLang dashboard
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 121: UI Log Viewer

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the Log Viewer component for the SpecLang dashboard, displaying system logs, agent logs, and cascade logs with filtering and search capabilities.

### Quick Start

```yaml
LogViewer:
  sources:
    - name: system
      path: ".speclang/logs/system.log"
    - name: cascade
      path: ".speclang/logs/cascade.log"
    - name: agent
      path: ".speclang/logs/agent/*.log"
      
  features:
    - real_time
    - search
    - filter_by_level
    - filter_by_source
```

### When to Read This

- **Building dashboard**: Log viewer integration
- **Debugging**: Analyzing system behavior
- **Monitoring**: Real-time log tailing

### Related SIPs

- SIP 36: UI Specification
- SIP 43: MCP Daemon
- SIP 52: Daemon Locks

## Abstract

The Log Viewer displays system logs in an interactive, filterable interface, supporting real-time updates, text search, level filtering, and source filtering.

## Motivation

Users need:
- **Debugging**: Find specific log entries
- **Real-time**: Watch logs as they happen
- **Filtering**: Focus on relevant entries

## Rationale

**Log Aggregation:**

1. Read from multiple sources
2. Index for fast search
3. Stream for real-time
4. Filter for relevance

## Specification

### Component Structure

```yaml
LogViewerComponent:
  header:
    id: "@specs/ui-log-viewer"
    version: 1.0.0
    layer: 6
    tags: [ui, logs, dashboard, debugging]
    
  layout:
    type: panel
    height: 400px
    position: bottom
    
  features:
    - real_time_streaming
    - full_text_search
    - filter_by_level
    - filter_by_source
    - filter_by_time
    - export_logs
```

### Log Entry Format

```yaml
LogEntry:
  timestamp: ISO8601
  level: debug | info | warn | error
  source: string
  message: string
  context:
    cascade_id: string (optional)
    agent_id: string (optional)
    spec_id: string (optional)
```

### Log Levels

```yaml
LogLevels:
  debug:
    color: "#94a3b8"     # Gray
    icon: bug
    importance: 0
        
  info:
    color: "#3b82f6"     # Blue
    icon: info
    importance: 1
        
  warn:
    color: "#eab308"    # Yellow
    icon: warning
    importance: 2
        
  error:
    color: "#ef4444"    # Red
    icon: error
    importance: 3
```

### Log Sources

```yaml
LogSources:
  system:
    path: ".speclang/logs/system.log"
    description: "Core system logs"
    
  daemon:
    path: ".speclang/logs/daemon.log"
    description: "Daemon operation logs"
    
  cascade:
    path: ".speclang/logs/cascade.log"
    description: "Cascade execution logs"
    
  agent:
    path: ".speclang/logs/agent/*.log"
    description: "Agent-specific logs"
    
  mcp:
    path: ".speclang/logs/mcp.log"
    description: "MCP protocol logs"
```

### Log Viewer Implementation

```python
from dataclasses import dataclass
from typing import List, Optional, AsyncIterator
from enum import Enum
from datetime import datetime
import re

class LogLevel(Enum):
    DEBUG = "debug"
    INFO = "info"
    WARN = "warn"
    ERROR = "error"

@dataclass
class LogEntry:
    timestamp: datetime
    level: LogLevel
    source: str
    message: str
    cascade_id: Optional[str] = None
    agent_id: Optional[str] = None
    spec_id: Optional[str] = None
    
    def to_dict(self) -> dict:
        return {
            "timestamp": self.timestamp.isoformat(),
            "level": self.level.value,
            "source": self.source,
            "message": self.message,
            "cascade_id": self.cascade_id,
            "agent_id": self.agent_id,
            "spec_id": self.spec_id
        }

@dataclass
class LogFilter:
    levels: Optional[List[LogLevel]] = None
    sources: Optional[List[str]] = None
    search_text: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    cascade_id: Optional[str] = None
    agent_id: Optional[str] = None
    spec_id: Optional[str] = None
    
    def matches(self, entry: LogEntry) -> bool:
        # Check level
        if self.levels and entry.level not in self.levels:
            return False
        
        # Check source
        if self.sources and entry.source not in self.sources:
            return False
        
        # Check search text
        if self.search_text:
            pattern = re.compile(self.search_text, re.IGNORECASE)
            if not pattern.search(entry.message):
                return False
        
        # Check time range
        if self.start_time and entry.timestamp < self.start_time:
            return False
        if self.end_time and entry.timestamp > self.end_time:
            return False
        
        # Check cascade ID
        if self.cascade_id and entry.cascade_id != self.cascade_id:
            return False
        
        # Check agent ID
        if self.agent_id and entry.agent_id != self.agent_id:
            return False
        
        # Check spec ID
        if self.spec_id and entry.spec_id != self.spec_id:
            return False
        
        return True

class LogReader:
    def __init__(self, config: dict):
        self.config = config
        self.sources = config.get("sources", [])
        
    async def read_logs(
        self,
        filter: LogFilter,
        limit: int = 1000,
        offset: int = 0
    ) -> List[LogEntry]:
        """Read logs with filtering."""
        
        all_entries = []
        
        for source in self.sources:
            entries = await self._read_source(source, filter)
            all_entries.extend(entries)
        
        # Sort by timestamp descending
        all_entries.sort(key=lambda e: e.timestamp, reverse=True)
        
        # Apply pagination
        return all_entries[offset:offset + limit]
    
    async def stream_logs(
        self,
        filter: LogFilter
    ) -> AsyncIterator[LogEntry]:
        """Stream logs in real-time."""
        
        for source in self.sources:
            async for entry in self._stream_source(source, filter):
                if filter.matches(entry):
                    yield entry
    
    async def _read_source(
        self,
        source: dict,
        filter: LogFilter
    ) -> List[LogEntry]:
        """Read logs from a single source."""
        
        # Implementation would read from file
        pass
    
    async def _stream_source(
        self,
        source: dict,
        filter: LogFilter
    ) -> AsyncIterator[LogEntry]:
        """Stream logs from a single source."""
        
        # Implementation would use file watching
        pass

class LogSearch:
    def __init__(self, log_reader: LogReader):
        self.log_reader = log_reader
        
    async def search(
        self,
        query: str,
        filters: Optional[LogFilter] = None,
        limit: int = 100
    ) -> List[LogEntry]:
        """Full-text search across logs."""
        
        if filters is None:
            filters = LogFilter()
        
        filters.search_text = query
        
        return await self.log_reader.read_logs(filters, limit=limit)
```

### Frontend Component

```javascript
class LogViewer {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      maxLines: options.maxLines || 1000,
      autoScroll: options.autoScroll !== false,
      showTimestamp: options.showTimestamp !== false,
      showLevel: options.showLevel !== false,
      showSource: options.showSource !== false,
      ...options
    };
    
    this.entries = [];
    this.filter = {
      levels: [],
      sources: [],
      searchText: ''
    };
    this.isStreaming = false;
    
    this.init();
  }
  
  init() {
    this.render();
    this.bindEvents();
  }
  
  render() {
    this.container.innerHTML = `
      <div class="log-viewer">
        <div class="log-toolbar">
          <div class="log-filters">
            <select class="level-filter" multiple>
              <option value="debug">Debug</option>
              <option value="info" selected>Info</option>
              <option value="warn" selected>Warn</option>
              <option value="error" selected>Error</option>
            </select>
            <select class="source-filter">
              <option value="">All Sources</option>
              <option value="system">System</option>
              <option value="daemon">Daemon</option>
              <option value="cascade">Cascade</option>
              <option value="agent">Agent</option>
            </select>
            <input type="text" class="search-input" placeholder="Search logs...">
          </div>
          <div class="log-actions">
            <button class="btn-stream">Stream</button>
            <button class="btn-clear">Clear</button>
            <button class="btn-export">Export</button>
          </div>
        </div>
        <div class="log-content"></div>
      </div>
    `;
    
    this.logContent = this.container.querySelector('.log-content');
  }
  
  bindEvents() {
    // Level filter
    this.container.querySelector('.level-filter')
      .addEventListener('change', (e) => {
        this.filter.levels = Array.from(e.target.selectedOptions)
          .map(o => o.value);
        this.applyFilter();
      });
    
    // Source filter
    this.container.querySelector('.source-filter')
      .addEventListener('change', (e) => {
        this.filter.sources = e.target.value ? [e.target.value] : [];
        this.applyFilter();
      });
    
    // Search
    let searchTimeout;
    this.container.querySelector('.search-input')
      .addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.filter.searchText = e.target.value;
          this.applyFilter();
        }, 300);
      });
    
    // Stream button
    this.container.querySelector('.btn-stream')
      .addEventListener('click', () => {
        this.toggleStream();
      });
    
    // Clear button
    this.container.querySelector('.btn-clear')
      .addEventListener('click', () => {
        this.clear();
      });
    
    // Export button
    this.container.querySelector('.btn-export')
      .addEventListener('click', () => {
        this.export();
      });
  }
  
  addEntry(entry) {
    this.entries.push(entry);
    
    // Trim if exceeds max lines
    if (this.entries.length > this.options.maxLines) {
      this.entries.shift();
    }
    
    this.renderEntry(entry);
    
    if (this.options.autoScroll) {
      this.scrollToBottom();
    }
  }
  
  renderEntry(entry) {
    const line = document.createElement('div');
    line.className = `log-line log-${entry.level}`;
    
    if (this.options.showTimestamp) {
      const timestamp = document.createElement('span');
      timestamp.className = 'log-timestamp';
      timestamp.textContent = new Date(entry.timestamp).toLocaleTimeString();
      line.appendChild(timestamp);
    }
    
    if (this.options.showLevel) {
      const level = document.createElement('span');
      level.className = `log-level log-level-${entry.level}`;
      level.textContent = entry.level.toUpperCase();
      line.appendChild(level);
    }
    
    if (this.options.showSource) {
      const source = document.createElement('span');
      source.className = 'log-source';
      source.textContent = `[${entry.source}]`;
      line.appendChild(source);
    }
    
    const message = document.createElement('span');
    message.className = 'log-message';
    message.textContent = entry.message;
    line.appendChild(message);
    
    this.logContent.appendChild(line);
  }
  
  applyFilter() {
    const filtered = this.entries.filter(entry => {
      if (this.filter.levels.length && 
          !this.filter.levels.includes(entry.level)) {
        return false;
      }
      
      if (this.filter.sources.length && 
          !this.filter.sources.includes(entry.source)) {
        return false;
      }
      
      if (this.filter.searchText) {
        const search = this.filter.searchText.toLowerCase();
        if (!entry.message.toLowerCase().includes(search)) {
          return false;
        }
      }
      
      return true;
    });
    
    // Re-render
    this.logContent.innerHTML = '';
    filtered.forEach(entry => this.renderEntry(entry));
  }
  
  async toggleStream() {
    if (this.isStreaming) {
      this.stopStream();
    } else {
      await this.startStream();
    }
  }
  
  async startStream() {
    this.isStreaming = true;
    this.container.querySelector('.btn-stream').textContent = 'Stop';
    
    // Connect to WebSocket or polling endpoint
    this.streamEndpoint = '/api/logs/stream';
    this.startPolling();
  }
  
  stopStream() {
    this.isStreaming = false;
    this.container.querySelector('.btn-stream').textContent = 'Stream';
    
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }
  
  startPolling() {
    let lastTimestamp = null;
    
    this.pollInterval = setInterval(async () => {
      const params = new URLSearchParams();
      if (lastTimestamp) {
        params.append('after', lastTimestamp);
      }
      
      const response = await fetch(`/api/logs?${params}`);
      const entries = await response.json();
      
      for (const entry of entries) {
        this.addEntry(entry);
        lastTimestamp = entry.timestamp;
      }
    }, 1000);
  }
  
  clear() {
    this.entries = [];
    this.logContent.innerHTML = '';
  }
  
  export() {
    const content = this.entries
      .map(e => `[${e.timestamp}] [${e.level.toUpperCase()}] [${e.source}] ${e.message}`)
      .join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.log`;
    a.click();
    
    URL.revokeObjectURL(url);
  }
  
  scrollToBottom() {
    this.logContent.scrollTop = this.logContent.scrollHeight;
  }
}
```

## Backwards Compatibility

- Log format backwards compatible
- New log fields handled gracefully

## Security Considerations

- Sensitive data in logs should be redacted
- Access control for log viewing

## References

- @ref:specs/ui-specification
- SIP 36: UI Specification
- SIP 43: MCP Daemon
- SIP 52: Daemon Locks

## Copyright

This document is in the public domain.
