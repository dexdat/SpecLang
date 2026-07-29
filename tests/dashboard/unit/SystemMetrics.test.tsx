// SPECLANG-GENERATED: UI Testing - System Metrics Unit Tests
// DO NOT EDIT MANUALLY
// Source: @speclang/ui.testing

/**
 * Unit Tests for System Metrics
 *
 * Tests system stats helper functions.
 */

import { describe, it, expect } from "vitest";
import { mockSystemStats } from "../../mocks/fixtures";

describe("System Metrics", () => {
  describe("Memory metrics", () => {
    it("should calculate memory usage percentage", () => {
      const percentage =
        (mockSystemStats.memory_used_mb / mockSystemStats.memory_total_mb) *
        100;
      expect(percentage).toBe(25);
    });

    it("should format memory for display", () => {
      const formatMemory = (mb: number): string => {
        if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
        return `${mb} MB`;
      };

      expect(formatMemory(512)).toBe("512 MB");
      expect(formatMemory(2048)).toBe("2.0 GB");
    });

    it("should identify high memory usage", () => {
      const isHighUsage = (percentage: number) => percentage > 80;
      const usage =
        (mockSystemStats.memory_used_mb / mockSystemStats.memory_total_mb) *
        100;
      expect(isHighUsage(usage)).toBe(false);
    });
  });

  describe("CPU metrics", () => {
    it("should have valid CPU percentage", () => {
      expect(mockSystemStats.cpu_percent).toBeGreaterThanOrEqual(0);
      expect(mockSystemStats.cpu_percent).toBeLessThanOrEqual(100);
    });

    it("should format CPU for display", () => {
      const formatCPU = (percent: number): string => `${percent.toFixed(1)}%`;
      expect(formatCPU(25.5)).toBe("25.5%");
    });

    it("should identify high CPU usage", () => {
      const isHighCPU = (percent: number) => percent > 80;
      expect(isHighCPU(mockSystemStats.cpu_percent)).toBe(false);
    });
  });

  describe("Disk metrics", () => {
    it("should calculate disk usage percentage", () => {
      const percentage =
        (mockSystemStats.disk_used_gb / mockSystemStats.disk_total_gb) * 100;
      expect(percentage).toBeCloseTo(17.6, 1);
    });
  });

  describe("Health status", () => {
    const getSystemHealth = (
      cpu: number,
      memory: number,
    ): "healthy" | "warning" | "critical" => {
      if (cpu > 90 || memory > 90) return "critical";
      if (cpu > 70 || memory > 70) return "warning";
      return "healthy";
    };

    it("should report healthy when metrics are low", () => {
      const health = getSystemHealth(25.5, 25);
      expect(health).toBe("healthy");
    });

    it("should report warning when metrics are moderate", () => {
      const health = getSystemHealth(75, 65);
      expect(health).toBe("warning");
    });

    it("should report critical when metrics are high", () => {
      const health = getSystemHealth(95, 85);
      expect(health).toBe("critical");
    });
  });
});
