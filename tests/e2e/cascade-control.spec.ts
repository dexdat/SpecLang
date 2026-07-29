// SPECLANG-GENERATED: UI Testing - Cascade Control E2E Tests
// DO NOT EDIT MANUALLY
// Source: @speclang/ui.testing

/**
 * E2E Tests for Cascade Control
 *
 * Tests cascade control workflows.
 *
 * Note: These tests require Playwright to run.
 */

import { test, expect, describe } from "@playwright/test";

describe("Cascade Control E2E", () => {
  test("triggers cascade from UI", async ({ page }) => {
    await page.goto("/dashboard");

    // Click trigger button
    await page.click('button:has-text("TRIGGER")');

    // Check status changed
    const status = page.locator(".cascade-status");
    await expect(status).toContainText(/CASCADING|RUNNING/i);
  });

  test("pauses and resumes cascade", async ({ page }) => {
    await page.goto("/dashboard");

    // Trigger first
    await page.click('button:has-text("TRIGGER")');

    // Wait for running status
    await page.waitForTimeout(500);

    // Click pause
    await page.click('button:has-text("PAUSE")');

    // Check paused status
    const indicator = page.locator(".status-indicator");
    await expect(indicator).toContainText(/PAUSED/i);

    // Click resume
    await page.click('button:has-text("RESUME")');

    // Check running status
    await expect(indicator).toContainText(/RUNNING/i);
  });

  test("aborts with confirmation", async ({ page }) => {
    await page.goto("/dashboard");

    // Trigger
    await page.click('button:has-text("TRIGGER")');
    await page.waitForTimeout(500);

    // Handle dialog
    page.on("dialog", (dialog) => dialog.accept());

    // Click abort
    await page.click('button:has-text("ABORT")');

    // Check idle status
    const status = page.locator(".cascade-status");
    await expect(status).toContainText(/IDLE/i);
  });

  test("finalizes cascade", async ({ page }) => {
    await page.goto("/dashboard");

    // Trigger
    await page.click('button:has-text("TRIGGER")');
    await page.waitForTimeout(500);

    // Handle dialog
    page.on("dialog", (dialog) => dialog.accept());

    // Click finalize
    await page.click('button:has-text("FINALIZE")');

    // Check idle status
    const status = page.locator(".cascade-status");
    await expect(status).toContainText(/IDLE/i);
  });
});
