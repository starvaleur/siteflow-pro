import { describe, expect, it } from "vitest";
import { getBlankBlueprint } from "./siteflow";
import { createPublishedSnapshot } from "./publishing";

describe("published snapshot parity", () => {
  it("captures the current editor site and pages without transforming their content", () => {
    const blueprint = getBlankBlueprint();
    const site = { id: 42, name: "Draft", theme: blueprint.theme };
    const pages = blueprint.pages.map((page) => ({ ...page, elementTree: page.elementTree }));
    const publishedAt = new Date("2026-08-27T16:00:00.000Z");

    const snapshot = createPublishedSnapshot(site, pages, publishedAt);

    expect(snapshot.site).toEqual(site);
    expect(snapshot.pages).toEqual(pages);
    expect(snapshot.pages[0]?.elementTree).toBe(pages[0]?.elementTree);
    expect(snapshot.publishedAt).toBe("2026-08-27T16:00:00.000Z");
  });
});
