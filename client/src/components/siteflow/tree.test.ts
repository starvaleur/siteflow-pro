import { describe, expect, it } from "vitest";
import { getTemplate } from "../../../../shared/siteflow";
import { appendNode, createElement, duplicateNode, findNode, patchNodeStyle, removeNode, reorderSibling, updateNode } from "./tree";

describe("arbre canonique SiteFlow", () => {
  it("génère un template avec des pages et des arbres utilisables par le renderer", () => {
    const template = getTemplate("nexus-saas");
    expect(template.pages).toHaveLength(3);
    expect(template.pages[0]?.isHomepage).toBe(true);
    expect(template.pages[0]?.elementTree[0]?.type).toBe("navbar");
    expect(template.pages[0]?.elementTree.some((node) => node.type === "section")).toBe(true);
  });

  it("ajoute, met à jour et supprime un élément sans modifier ses voisins", () => {
    const initial = [createElement("heading")];
    const paragraph = createElement("paragraph");
    const appended = appendNode(initial, paragraph);
    expect(appended).toHaveLength(2);
    const updated = updateNode(appended, paragraph.id, (node) => ({ ...node, name: "Introduction" }));
    expect(findNode(updated, paragraph.id)?.name).toBe("Introduction");
    const removed = removeNode(updated, paragraph.id);
    expect(removed).toHaveLength(1);
    expect(removed[0]?.id).toBe(initial[0]?.id);
  });

  it("préserve les styles desktop quand une surcharge mobile est appliquée", () => {
    const heading = createElement("heading");
    const desktop = patchNodeStyle(heading, { fontSize: "60px", color: "#11172B" }, "desktop");
    const mobile = patchNodeStyle(desktop, { fontSize: "34px", width: "100%" }, "mobile");
    expect(mobile.styles.fontSize).toBe("60px");
    expect(mobile.responsive.mobile?.fontSize).toBe("34px");
    expect(mobile.responsive.mobile?.width).toBe("100%");
  });

  it("duplique et réordonne un calque avec un nouvel identifiant", () => {
    const first = createElement("heading");
    const second = createElement("paragraph");
    const duplicate = duplicateNode([first, second], first.id);
    expect(duplicate).toHaveLength(3);
    expect(duplicate[1]?.id).not.toBe(first.id);
    const reordered = reorderSibling(duplicate, second.id, "up");
    expect(reordered[0]?.id).toBe(first.id);
    expect(reordered[1]?.id).toBe(second.id);
  });
});
