import { describe, expect, it } from "vitest";
import { getBlankBlueprint, type ElementNode } from "./siteflow";
import { createPublishedSnapshot, materializePublishedSnapshot } from "./publishing";

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

  it("materializes a historical snapshot independently from the current site", () => {
    const currentSite = { id: 42, name: "Current", theme: { primary: "#000000" } };
    const snapshot = createPublishedSnapshot({ name: "Historical", theme: { primary: "#ffffff" } }, [{ slug: "home", elementTree: [{ id: "historical-heading", type: "heading", name: "Heading", visible: true, locked: false, props: { text: "Historical content" }, styles: {}, responsive: {}, children: [] }] }], new Date("2026-08-27T15:00:00.000Z"));

    const preview = materializePublishedSnapshot(currentSite, snapshot);

    expect(preview.site.name).toBe("Historical");
    expect(preview.site.theme).toEqual({ primary: "#ffffff" });
    expect(preview.pages[0]?.elementTree[0]?.props.text).toBe("Historical content");
    expect(currentSite.name).toBe("Current");
  });

  it("keeps successive publication snapshots distinct for historical preview", () => {
    const blueprint = getBlankBlueprint();
    const site = { id: 42, name: "Draft", theme: blueprint.theme };
    const firstPages = structuredClone(blueprint.pages);
    const secondPages = structuredClone(blueprint.pages);
    const heading = findNodeByType(secondPages[0]?.elementTree ?? [], "heading");
    if (heading) heading.props.text = "Version suivante";

    const first = createPublishedSnapshot(site, firstPages, new Date("2026-08-27T16:00:00.000Z"));
    const second = createPublishedSnapshot(site, secondPages, new Date("2026-08-27T17:00:00.000Z"));

    expect(first.pages[0]?.elementTree).not.toEqual(second.pages[0]?.elementTree);
    expect(findNodeByType(first.pages[0]?.elementTree ?? [], "heading")?.props.text).not.toBe("Version suivante");
    expect(findNodeByType(second.pages[0]?.elementTree ?? [], "heading")?.props.text).toBe("Version suivante");
  });
});

function findNodeByType(nodes: ElementNode[], type: ElementNode["type"]): ElementNode | undefined {
  for (const node of nodes) {
    if (node.type === type) return node;
    const nested = findNodeByType(node.children, type);
    if (nested) return nested;
  }
  return undefined;
}
