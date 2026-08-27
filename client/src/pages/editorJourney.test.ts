import { describe, expect, it } from "vitest";
import { getBlankBlueprint } from "../../../shared/siteflow";
import { themedElementStyles, headingTagForNode } from "../components/siteflow/SiteRenderer";
import {
  appendNode,
  createElement,
  duplicateNode,
  findNode,
  flattenTree,
  patchNodeProp,
  patchNodeStyle,
  removeNode,
  updateNode,
  reorderSibling,
} from "../components/siteflow/tree";
import { applyHistoryAction, nextSaveStatus } from "./editorState";

describe("editor journey", () => {
  it("keeps the real editing flow consistent from add through preview-ready state", () => {
    const page = getBlankBlueprint().pages[0];
    let tree = page.elementTree;
    const parentId = tree[0].id;
    
    // 1. Add every element
    const types = ["heading", "paragraph", "button", "image", "icon", "video", "link", "columns", "stack", "card", "divider", "spacer"] as const;
    const addedIds: string[] = [];
    for (const type of types) {
      const el = createElement(type);
      tree = appendNode(tree, el, parentId);
      addedIds.push(el.id);
    }
    
    const flatTree = flattenTree(tree);
    for (const type of types) {
      expect(flatTree.some(node => node.type === type)).toBe(true);
    }

    // 2. Edit
    const btnId = addedIds[2];
    tree = patchNodeProp(tree, btnId, "label", "Commencer maintenant");
    expect(findNode(tree, btnId)?.props.label).toBe("Commencer maintenant");

    // 3. Reorder Layers
    const firstAddedId = addedIds[0];
    tree = reorderSibling(tree, firstAddedId, "down");
    const newParent = findNode(tree, parentId)!;
    const newIndex = newParent.children.findIndex(n => n.id === firstAddedId);
    expect(newIndex).toBeGreaterThan(0);

    // 4. Responsive Override
    const mobileParentNode = patchNodeStyle(findNode(tree, parentId)!, { padding: "24px" }, "mobile");
    tree = updateNode(tree, parentId, () => mobileParentNode);
    expect(findNode(tree, parentId)?.responsive.mobile?.padding).toBe("24px");
    expect(findNode(tree, parentId)?.styles.padding).not.toBe("24px"); // Desktop remains unchanged

    // 5. Duplicate & Delete
    tree = duplicateNode(tree, btnId);
    const duplicatedButton = findNode(tree, parentId)?.children.find((node) => node.id !== btnId && node.type === "button");
    expect(duplicatedButton).toBeDefined();
    tree = removeNode(tree, duplicatedButton!.id);
    expect(findNode(tree, duplicatedButton!.id)).toBeUndefined();

    // 6. Save & History
    let state = { history: [page.elementTree], index: 0 };
    const commit = applyHistoryAction(state, { type: "commit", next: tree });
    expect(commit?.saveStatus).toBe("unsaved");
    state = { history: commit!.history, index: commit!.index };

    const undo = applyHistoryAction(state, { type: "undo" });
    expect(undo?.next).toEqual(page.elementTree);
    expect(undo?.saveStatus).toBe("unsaved");
    state = { history: undo!.history, index: undo!.index };

    const redo = applyHistoryAction(state, { type: "redo" });
    expect(redo?.next).toEqual(tree);
    expect(nextSaveStatus("request")).toBe("saving");
    expect(nextSaveStatus("success")).toBe("saved");
    expect(nextSaveStatus("error")).toBe("unsaved");

    // 7. Preview/Renderer Parity
    const heading = flattenTree(tree).find((node) => node.type === "heading")!;
    heading.props.level = 1;
    expect(headingTagForNode(heading)).toBe("h1");
    const mobileStyles = themedElementStyles(heading, "mobile", pageTheme(page));
    expect(mobileStyles.fontSize).toBeDefined();
  });
});

function pageTheme(_page: ReturnType<typeof getBlankBlueprint>["pages"][number]) {
  return getBlankBlueprint().theme;
}
