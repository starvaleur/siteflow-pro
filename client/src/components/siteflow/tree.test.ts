import { describe, expect, it } from "vitest";
import { getTemplate } from "../../../../shared/siteflow";
import { appendNode, applyUploadedImage, createElement, duplicateNode, findNode, historyRedo, historyUndo, moveNodeBefore, patchNodeStyle, pushHistory, removeNode, reorderSibling, updateNode } from "./tree";

describe("arbre canonique SiteFlow", () => {
  it("génère les nouveaux éléments de bibliothèque avec des valeurs par défaut valides", () => {
    const nodes = (["icon", "video", "link", "columns", "stack"] as const).map(createElement);
    expect(nodes.map((node) => node.type)).toEqual(["icon", "video", "link", "columns", "stack"]);
    expect(nodes.find((node) => node.type === "video")?.props.controls).toBe(true);
    expect(nodes.find((node) => node.type === "columns")?.props.columns).toBe(2);
    expect(nodes.every((node) => node.visible && !node.locked && Array.isArray(node.children))).toBe(true);
  });

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

  it("conserve la cible d’un upload image quand la sélection change avant le retour", async () => {
    const image = createElement("image");
    const other = createElement("heading");
    const nodes = [image, other];
    const uploadTargetId = image.id;
    let selectedId = image.id;
    const uploadResult = Promise.resolve("https://cdn.example.com/uploaded.png");
    selectedId = other.id;
    const updated = applyUploadedImage(nodes, uploadTargetId, await uploadResult);
    expect(selectedId).toBe(other.id);
    expect(findNode(updated, image.id)?.props.src).toBe("https://cdn.example.com/uploaded.png");
    expect(findNode(updated, other.id)?.props.src).toBeUndefined();
  });

  it("réordonne un calque par glisser-déposer sans créer de cycle", () => {
    const parent = createElement("section");
    const first = createElement("heading");
    const second = createElement("paragraph");
    parent.children = [first, second];
    const moved = moveNodeBefore([parent], second.id, first.id);
    expect(findNode(moved, parent.id)?.children.map((node) => node.id)).toEqual([second.id, first.id]);
    expect(moveNodeBefore([parent], parent.id, first.id)).toEqual([parent]);
  });

  it("conserve les styles desktop lorsqu’un override mobile est modifié", () => {
    const heading = createElement("heading");
    const updated = patchNodeStyle(heading, { fontSize: "32px", color: "#2925D8" }, "mobile");
    expect(updated.styles.fontSize).toBe("48px");
    expect(updated.styles.color).toBe("#11172B");
    expect(updated.responsive.mobile).toMatchObject({ fontSize: "32px", color: "#2925D8" });
  });

  it("gère undo, redo et une nouvelle branche après undo", () => {
    const first = [createElement("heading")];
    const second = [createElement("paragraph")];
    const third = [createElement("button")];
    const initial = { history: [first], index: 0 };
    const afterSecond = pushHistory(initial.history, initial.index, second);
    const afterThird = pushHistory(afterSecond.history, afterSecond.index, third);
    expect(historyUndo(afterThird.history, afterThird.index)?.next).toBe(second);
    expect(historyRedo(afterThird.history, 1)?.next).toBe(third);
    const branch = pushHistory(afterThird.history, 1, [createElement("image")]);
    expect(branch.history).toHaveLength(3);
    expect(branch.history[2]).not.toBe(third);
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
