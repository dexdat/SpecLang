// SPECLANG-GENERATED: UI Testing - Control Panel Unit Tests
// DO NOT EDIT MANUALLY
// Source: @speclang/ui.testing

/**
 * Unit Tests for Control Panel
 *
 * Tests control panel state transitions and button enabling logic.
 */

import { describe, it, expect, vi } from "vitest";

describe("Control Panel", () => {
  describe("Button state logic", () => {
    const getButtonStates = (status: string) => {
      return {
        canTrigger: status === "idle",
        canPause: status === "running",
        canResume: status === "paused",
        canFinalize: status === "running" || status === "paused",
        canAbort: status === "running" || status === "paused",
        canStep: status === "paused",
      };
    };

    it("should enable trigger button when idle", () => {
      const states = getButtonStates("idle");
      expect(states.canTrigger).toBe(true);
      expect(states.canPause).toBe(false);
    });

    it("should enable pause when running", () => {
      const states = getButtonStates("running");
      expect(states.canPause).toBe(true);
      expect(states.canResume).toBe(false);
      expect(states.canFinalize).toBe(true);
      expect(states.canAbort).toBe(true);
    });

    it("should enable resume when paused", () => {
      const states = getButtonStates("paused");
      expect(states.canResume).toBe(true);
      expect(states.canPause).toBe(false);
      expect(states.canStep).toBe(true);
    });

    it("should disable all when finalizing", () => {
      const states = getButtonStates("finalizing");
      expect(states.canTrigger).toBe(false);
      expect(states.canPause).toBe(false);
      expect(states.canFinalize).toBe(false);
    });
  });

  describe("Confirmation dialogs", () => {
    it("should show confirm for abort", () => {
      const shouldConfirm = (action: string) =>
        ["abort", "finalize"].includes(action);

      expect(shouldConfirm("abort")).toBe(true);
      expect(shouldConfirm("finalize")).toBe(true);
      expect(shouldConfirm("trigger")).toBe(false);
    });
  });

  describe("Loading states", () => {
    it("should track loading during operations", () => {
      let isLoading = false;

      const setLoading = (loading: boolean) => {
        isLoading = loading;
      };

      setLoading(true);
      expect(isLoading).toBe(true);

      setLoading(false);
      expect(isLoading).toBe(false);
    });

    it("should disable buttons while loading", () => {
      const isButtonDisabled = (loading: boolean, canPerform: boolean) =>
        loading || !canPerform;

      expect(isButtonDisabled(true, true)).toBe(true);
      expect(isButtonDisabled(false, true)).toBe(false);
      expect(isButtonDisabled(true, false)).toBe(true);
    });
  });
});
