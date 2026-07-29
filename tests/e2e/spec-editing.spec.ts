// SPECLANG-GENERATED: UI Testing - Spec Editing E2E Tests
// DO NOT EDIT MANUALLY
// Source: @speclang/ui.testing

/**
 * E2E Tests for Spec Editing
 *
 * Tests spec editor workflows.
 *
 * Note: These tests require Playwright to run.
 */

import { test, expect, describe } from "@playwright/test";

describe("Spec Editing E2E", () => {
  test("creates new spec", async ({ page }) => {
    await page.goto("/dashboard");

    // Click new spec button
    await page.click('button:has-text("NEW SPEC")');

    // Fill in spec details
    await page.fill('input[placeholder*="id"]', "@specs/new-feature");
    await page.fill('input[placeholder*="layer"]', "3");

    // Click create
    await page.click('button:has-text("CREATE")');

    // Check editor is visible
    const editor = page.locator(".spec-editor");
    await expect(editor).toBeVisible();
  });

  test("validates refs on input", async ({ page }) => {
    await page.goto("/dashboard");

    // Open spec editor
    await page.click('button:has-text("NEW SPEC")');
    await page.click('button:has-text("CREATE")');

    // Type invalid ref
    const editor = page.locator(".editor-textarea");
    await editor.fill("@ref:specs/nonexistent");

    // Check for validation error
    const error = page.locator(".validation-error");
    await expect(error).toContainText(/not found/i);
  });

  test("autocomplete shows ref suggestions", async ({ page }) => {
    await page.goto("/dashboard");

    // Open spec editor
    await page.click('button:has-text("NEW SPEC")');
    await page.click('button:has-text("CREATE")');

    // Type partial ref
    const editor = page.locator(".editor-textarea");
    await editor.fill("@ref:auth");

    // Check autocomplete appears
    const autocomplete = page.locator(".autocomplete-menu");
    await expect(autocomplete).toBeVisible();

    // Check suggestions
    const item = page.locator(".autocomplete-item").first();
    await expect(item).toContainText("@specs/auth");
  });

  test("prevents save on validation errors", async ({ page }) => {
    await page.goto("/dashboard");

    // Open spec editor
    await page.click('button:has-text("NEW SPEC")');
    await page.click('button:has-text("CREATE")');

    // Type invalid content
    const editor = page.locator(".editor-textarea");
    await editor.fill("invalid content");

    // Try to save
    await page.click('button:has-text("SAVE")');

    // Check error message
    const error = page.locator(".save-error");
    await expect(error).toContainText(/cannot save/i);
  });
});
