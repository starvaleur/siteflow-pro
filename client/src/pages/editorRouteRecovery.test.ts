import { describe, expect, it } from "vitest";
import { getEditorRecoverySiteId } from "./Editor";

describe("editor route recovery", () => {
  it("does not redirect when the requested site is accessible", () => {
    expect(getEditorRecoverySiteId(420001, [{ id: 420001 }, { id: 420002 }])).toBeNull();
  });

  it("recovers a stale route to the first site owned by the session", () => {
    expect(getEditorRecoverySiteId(17, [{ id: 420001 }, { id: 420002 }])).toBe(420001);
  });

  it("does not invent a destination when the session has no sites", () => {
    expect(getEditorRecoverySiteId(17, [])).toBeNull();
  });
});
