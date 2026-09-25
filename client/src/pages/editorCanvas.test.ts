import { describe, expect, it } from "vitest";
import { getCanvasBaseWidth, getFitZoom } from "./Editor";

describe("editor canvas workspace", () => {
  it("keeps editor workspace sizing separate from simulated device widths", () => {
    expect(getCanvasBaseWidth("desktop")).toBe(990);
    expect(getCanvasBaseWidth("tablet")).toBe(760);
    expect(getCanvasBaseWidth("mobile")).toBe(390);
  });

  it("fits the simulated page into remaining canvas space without exceeding 100%", () => {
    expect(getFitZoom(960, 990)).toBe(96);
    expect(getFitZoom(1600, 990)).toBe(100);
    expect(getFitZoom(435, 990)).toBe(43);
    expect(getFitZoom(200, 990)).toBe(25);
    expect(getFitZoom(0, 990)).toBe(100);
  });
});
