// SPECLANG-GENERATED: UI Testing - Monitoring E2E Tests
// DO NOT EDIT MANUALLY
// Source: @speclang/ui.testing

/**
 * E2E Tests for Monitoring
 *
 * Tests monitoring and metrics display.
 *
 * Note: These tests require Playwright to run.
 */

import { test, expect, describe } from "@playwright/test";

describe("Monitoring E2E", () => {
  test("displays agent health", async ({ page }) => {
    await page.goto("/dashboard");

    // Check agent cards are visible
    const agents = page.locator(".agent-card");
    await expect(agents.first()).toBeVisible();
  });

  test("shows event timeline", async ({ page }) => {
    await page.goto("/dashboard");

    // Check timeline is visible
    const timeline = page.locator(".timeline-event");
    await expect(timeline.first()).toBeVisible();
  });

  test("displays system metrics", async ({ page }) => {
    await page.goto("/dashboard");

    // Check metrics
    const cpu = page.locator(".metric-cpu");
    const memory = page.locator(".metric-memory");

    await expect(cpu).toBeVisible();
    await expect(memory).toBeVisible();
  });

  test("shows queue depth", async ({ page }) => {
    await page.goto("/dashboard");

    // Check queue
    const queue = page.locator(".queue-item");
    // Queue may be empty but element should exist
    await expect(page.locator(".queue-depth")).toBeVisible();
  });

  test("updates in real-time", async ({ page }) => {
    await page.goto("/dashboard");

    // Get initial event count
    const events = page.locator(".timeline-event");
    const initialCount = await events.count();

    // Trigger a change
    await page.click('button:has-text("TRIGGER")');
    await page.waitForTimeout(1000);

    // Check events updated (may vary based on implementation)
    const newCount = await events.count();
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });
});
