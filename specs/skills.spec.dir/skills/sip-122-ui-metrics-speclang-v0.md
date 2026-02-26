---
name: sip-122-ui-metrics-speclang-v0
title: "SIP 122: UI Metrics Component"
version: 0.1.0
description: Metrics and analytics component for SpecLang dashboard
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 122: UI Metrics Component

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the Metrics Component for the SpecLang dashboard, displaying system metrics, performance data, and analytics.

### Quick Start

```yaml
MetricsComponent:
  metrics:
    - name: specs_total
      type: counter
      description: "Total specs in system"
    - name: cascade_duration
      type: histogram
      description: "Cascade execution duration"
    - name: agent_uptime
      type: gauge
      description: "Agent uptime percentage"
      
  visualization:
    - type: line_chart
      metrics: [cascade_duration]
    - type: gauge
      metrics: [agent_uptime]
```

### When to Read This

- **Building dashboard**: Metrics integration
- **Monitoring**: Performance tracking
- **Analytics**: Usage patterns

### Related SIPs

- SIP 36: UI Specification
- SIP 77: Performance

## Abstract

The Metrics Component displays system performance metrics, usage statistics, and analytics in various visualization formats including charts, gauges, and counters.

## Motivation

Users need:
- **Performance**: How fast are cascades?
- **Usage**: How many specs?
- **Trends**: Metrics over time

## Rationale

**Metrics Collection:**

1. Instrument code
2. Collect metrics
3. Store in time-series
4. Visualize with charts

## Specification

### Component Structure

```yaml
MetricsComponent:
  header:
    id: "@specs/ui-metrics"
    version: 1.0.0
    layer: 6
    tags: [ui, metrics, dashboard, analytics]
    
  layout:
    type: dashboard_grid
    position: main_content
    
  visualizations:
    - type: stat_card
      title: "Total Specs"
    - type: line_chart
      title: "Cascade Duration"
    - type: gauge
      title: "Agent Uptime"
    - type: table
      title: "Top Specs by Changes"
```

### Metric Types

```yaml
MetricTypes:
  counter:
    description: "Monotonically increasing value"
    aggregation: sum
    
  gauge:
    description: "Point-in-time value"
    aggregation: last
    
  histogram:
    description: "Distribution of values"
    aggregation: p50, p95, p99
```

### Available Metrics

```yaml
Metrics:
  system:
    - name: specs_total
      type: counter
      description: "Total number of specs"
      
    - name: specs_by_level
      type: gauge
      description: "Specs per layer level"
      
    - name: specs_by_maturity
      type: gauge
      description: "Specs per maturity level"
      
  cascade:
    - name: cascade_total
      type: counter
      description: "Total cascades executed"
      
    - name: cascade_duration_seconds
      type: histogram
      description: "Cascade duration in seconds"
      
    - name: cascade_files_changed
      type: histogram
      description: "Files changed per cascade"
      
    - name: cascade_success_rate
      type: gauge
      description: "Percentage of successful cascades"
      
  agent:
    - name: agent_total
      type: gauge
      description: "Total agents"
      
    - name: agent_active
      type: gauge
      description: "Active agents"
      
    - name: agent_uptime_seconds
      type: gauge
      description: "Agent uptime in seconds"
      
    - name: agent_tasks_completed
      type: counter
      description: "Tasks completed by agents"
      
  performance:
    - name: query_duration_ms
      type: histogram
      description: "Database query duration"
      
    - name: api_response_ms
      type: histogram
      description: "API response time"
      
    - name: memory_usage_bytes
      type: gauge
      description: "Memory usage"
      
    - name: cpu_usage_percent
      type: gauge
      description: "CPU usage percentage"
```

### Metrics Implementation

```python
from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum
import time

class MetricType(Enum):
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"

@dataclass
class MetricValue:
    name: str
    value: float
    timestamp: datetime
    labels: Dict[str, str] = field(default_factory=dict)
    
    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "value": self.value,
            "timestamp": self.timestamp.isoformat(),
            "labels": self.labels
        }

class MetricsCollector:
    def __init__(self, config: dict):
        self.config = config
        self.counters: Dict[str, float] = {}
        self.gauges: Dict[str, float] = {}
        self.histograms: Dict[str, List[float]] = {}
        
    def increment(self, name: str, value: float = 1, labels: Dict[str, str] = None):
        """Increment a counter."""
        
        key = self._make_key(name, labels)
        self.counters[key] = self.counters.get(key, 0) + value
        
    def set_gauge(self, name: str, value: float, labels: Dict[str, str] = None):
        """Set a gauge value."""
        
        key = self._make_key(name, labels)
        self.gauges[key] = value
        
    def observe(self, name: str, value: float, labels: Dict[str, str] = None):
        """Observe a histogram value."""
        
        key = self._make_key(name, labels)
        if key not in self.histograms:
            self.histograms[key] = []
        self.histograms[key].append(value)
        
    def get(self, name: str, labels: Dict[str, str] = None) -> List[MetricValue]:
        """Get metric values."""
        
        key = self._make_key(name, labels)
        values = []
        timestamp = datetime.utcnow()
        
        if key in self.counters:
            values.append(MetricValue(name, self.counters[key], timestamp, labels))
            
        if key in self.gauges:
            values.append(MetricValue(name, self.gauges[key], timestamp, labels))
            
        if key in self.histograms:
            hist_values = self.histograms[key]
            values.extend([
                MetricValue(f"{name}_p50", self._percentile(hist_values, 50), timestamp, labels),
                MetricValue(f"{name}_p95", self._percentile(hist_values, 95), timestamp, labels),
                MetricValue(f"{name}_p99", self._percentile(hist_values, 99), timestamp, labels),
            ])
            
        return values
    
    def _make_key(self, name: str, labels: Optional[Dict[str, str]]) -> str:
        """Create metric key with labels."""
        
        if not labels:
            return name
        
        label_str = ",".join(f"{k}={v}" for k, v in sorted(labels.items()))
        return f"{name}{{{label_str}}}"
    
    def _percentile(self, values: List[float], p: float) -> float:
        """Calculate percentile."""
        
        if not values:
            return 0
        
        sorted_values = sorted(values)
        idx = int(len(sorted_values) * p / 100)
        return sorted_values[min(idx, len(sorted_values) - 1)]

class MetricsServer:
    def __init__(self, collector: MetricsCollector):
        self.collector = collector
        
    async def handle(self, request) -> Response:
        """Handle metrics request."""
        
        metric_name = request.query.get("name")
        
        if metric_name:
            values = self.collector.get(metric_name)
        else:
            values = self._get_all_metrics()
        
        return Response(
            status_code=200,
            body=json.dumps([v.to_dict() for v in values])
        )
    
    def _get_all_metrics(self) -> List[MetricValue]:
        """Get all metric values."""
        
        values = []
        
        for name in self.collector.counters:
            values.extend(self.collector.get(name))
            
        for name in self.collector.gauges:
            values.extend(self.collector.get(name))
            
        for name in self.collector.histograms:
            values.extend(self.collector.get(name))
            
        return values
```

### Metrics Visualization

```javascript
class MetricsDashboard {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.charts = {};
    
    this.init();
  }
  
  init() {
    this.render();
    this.loadMetrics();
  }
  
  render() {
    this.container.innerHTML = `
      <div class="metrics-dashboard">
        <div class="metrics-grid">
          <div class="metric-card" data-metric="specs_total">
            <div class="metric-title">Total Specs</div>
            <div class="metric-value">-</div>
          </div>
          
          <div class="metric-card" data-metric="cascade_success_rate">
            <div class="metric-title">Success Rate</div>
            <div class="metric-value">-</div>
            <div class="metric-chart"></div>
          </div>
          
          <div class="metric-card" data-metric="agent_uptime">
            <div class="metric-title">Agent Uptime</div>
            <div class="metric-value">-</div>
            <div class="metric-gauge"></div>
          </div>
          
          <div class="metric-card metric-wide" data-metric="cascade_duration">
            <div class="metric-title">Cascade Duration</div>
            <div class="metric-chart-wide"></div>
          </div>
        </div>
      </div>
    `;
  }
  
  async loadMetrics() {
    const response = await fetch('/api/metrics');
    const metrics = await response.json();
    
    this.updateDisplay(metrics);
  }
  
  updateDisplay(metrics) {
    // Update stat cards
    const specsTotal = metrics.find(m => m.name === 'specs_total');
    if (specsTotal) {
      this.updateCard('specs_total', specsTotal.value);
    }
    
    // Update success rate gauge
    const successRate = metrics.find(m => m.name === 'cascade_success_rate');
    if (successRate) {
      this.updateGauge('cascade_success_rate', successRate.value);
    }
    
    // Update uptime gauge
    const uptime = metrics.find(m => m.name === 'agent_uptime_seconds');
    if (uptime) {
      const uptimeHours = (uptime.value / 3600).toFixed(1);
      this.updateGauge('agent_uptime', uptimeHours);
    }
    
    // Update duration chart
    const duration = metrics.filter(m => m.name.startsWith('cascade_duration'));
    if (duration.length) {
      this.updateLineChart('cascade_duration', duration);
    }
  }
  
  updateCard(metricName, value) {
    const card = this.container.querySelector(`[data-metric="${metricName}"]`);
    if (card) {
      card.querySelector('.metric-value').textContent = value;
    }
  }
  
  updateGauge(metricName, value) {
    const gauge = this.container.querySelector(`[data-metric="${metricName}"] .metric-gauge`);
    if (gauge) {
      // Simple gauge visualization
      const percentage = Math.min(100, Math.max(0, value));
      gauge.innerHTML = `
        <svg viewBox="0 0 100 50">
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e5e7eb" stroke-width="8"/>
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" 
            stroke="${this.getGaugeColor(percentage)}" stroke-width="8"
            stroke-dasharray="${percentage * 1.26} 126"/>
        </svg>
      `;
    }
  }
  
  updateLineChart(metricName, data) {
    const chartContainer = this.container.querySelector(`[data-metric="${metricName}"] .metric-chart-wide`);
    if (chartContainer && data.length > 0) {
      const chart = new Chart(chartContainer, {
        type: 'line',
        data: {
          labels: data.map(d => new Date(d.timestamp).toLocaleTimeString()),
          datasets: [{
            label: 'Duration (s)',
            data: data.map(d => d.value),
            borderColor: '#3b82f6',
            fill: true,
            backgroundColor: 'rgba(59, 130, 246, 0.1)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }
  }
  
  getGaugeColor(percentage) {
    if (percentage >= 90) return '#22c55e';
    if (percentage >= 70) return '#eab308';
    return '#ef4444';
  }
}
```

### Time Series Storage

```python
class MetricsStore:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_db()
        
    def _init_db(self):
        """Initialize database schema."""
        
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS metrics (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                value REAL NOT NULL,
                labels TEXT,
                timestamp INTEGER NOT NULL
            )
        """)
        
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_metrics_name_time
            ON metrics(name, timestamp)
        """)
        
        conn.commit()
        
    def write(self, metric: MetricValue):
        """Write metric to storage."""
        
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            INSERT INTO metrics (name, value, labels, timestamp)
            VALUES (?, ?, ?, ?)
        """, (
            metric.name,
            metric.value,
            json.dumps(metric.labels),
            int(metric.timestamp.timestamp())
        ))
        conn.commit()
        
    def query(
        self,
        name: str,
        start_time: datetime,
        end_time: datetime,
        aggregation: str = "avg"
    ) -> List[MetricValue]:
        """Query metrics over time range."""
        
        conn = sqlite3.connect(self.db_path)
        
        agg_func = {
            "avg": "AVG",
            "sum": "SUM", 
            "min": "MIN",
            "max": "MAX",
            "count": "COUNT"
        }.get(aggregation, "AVG")
        
        cursor = conn.execute(f"""
            SELECT name, {agg_func}(value) as value, timestamp
            FROM metrics
            WHERE name = ? AND timestamp >= ? AND timestamp <= ?
            GROUP BY name, timestamp / 300
            ORDER BY timestamp
        """, (
            name,
            int(start_time.timestamp()),
            int(end_time.timestamp())
        ))
        
        results = []
        for row in cursor:
            results.append(MetricValue(
                name=row[0],
                value=row[1],
                timestamp=datetime.fromtimestamp(row[2])
            ))
            
        return results
```

## Backwards Compatibility

- Metric names stable across versions
- New metrics optional

## Security Implications

- Metrics may expose performance data
- Consider rate limiting on metrics endpoint

## References

- @ref:specs/ui-specification
- @ref:specs/performance
- SIP 36: UI Specification
- SIP 77: Performance

## Copyright

This document is in the public domain.
