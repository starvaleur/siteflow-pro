import { describe, expect, it } from "vitest";
import { MOBILE_BREAKPOINT } from "./useMobile";

describe("mobile editor breakpoint", () => {
  it("uses 768px as the exclusive desktop boundary", () => {
    expect(MOBILE_BREAKPOINT).toBe(768);
    expect(767 < MOBILE_BREAKPOINT).toBe(true);
    expect(768 < MOBILE_BREAKPOINT).toBe(false);
  });
});
