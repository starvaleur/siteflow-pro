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
} from "../components/siteflow/tree";
import { applyHistoryAction, nextSaveStatus } from "./editorState";

describe("editor journey", () => {
  it("keeps the real editing flow consistent from add through preview-ready state", () => {
    const page = getBlankBlueprint().pages[0];
    const root = page.elementTree;
    const parentId = root[0].id;
    const addedButton = createElement("button");
    const selectedId = addedButton.id;
    const afterAdd = appendNode(root, addedButton, parentId);

    expect(findNode(afterAdd, selectedId)?.type).toBe("button");
    expect(findNode(afterAdd, selectedId)?.props.label).toBe("Découvrir");

    const afterEdit = patchNodeProp(afterAdd, selectedId, "label", "Commencer maintenant");
    const mobileParentNode = patchNodeStyle(findNode(afterEdit, parentId)!, { padding: "24px" }, "mobile");
    const afterMobileEdit = updateNode(afterEdit, parentId, () => mobileParentNode);
    const mobileParent = findNode(afterMobileEdit, parentId);
    expect(mobileParent?.responsive.mobile?.padding).toBe("24px");
    expect(findNode(afterMobileEdit, selectedId)?.props.label).toBe("Commencer maintenant");

    const afterDuplicate = duplicateNode(afterMobileEdit, selectedId);
    expect(flattenTree(afterDuplicate).filter((node) => node.type === "button").length).toBe(3);
    expect(findNode(afterDuplicate, selectedId)).toBeDefined();

    const duplicatedButton = findNode(afterDuplicate, parentId)?.children.find((node) => node.id !== selectedId && node.type === "button");
    expect(duplicatedButton).toBeDefined();

    const afterDelete = removeNode(afterDuplicate, duplicatedButton!.id);
    expect(findNode(afterDelete, duplicatedButton!.id)).toBeUndefined();

    let state = { history: [root], index: 0 };
    const commit = applyHistoryAction(state, { type: "commit", next: afterMobileEdit });
    expect(commit?.saveStatus).toBe("unsaved");
    state = { history: commit!.history, index: commit!.index };

    const undo = applyHistoryAction(state, { type: "undo" });
    expect(undo?.next).toEqual(root);
    expect(undo?.saveStatus).toBe("unsaved");
    state = { history: undo!.history, index: undo!.index };

    const redo = applyHistoryAction(state, { type: "redo" });
    expect(redo?.next).toEqual(afterMobileEdit);
    expect(nextSaveStatus("request")).toBe("saving");
    expect(nextSaveStatus("success")).toBe("saved");
    expect(nextSaveStatus("error")).toBe("unsaved");

    const heading = flattenTree(afterMobileEdit).find((node) => node.type === "heading")!;
    heading.props.level = 1;
    expect(headingTagForNode(heading)).toBe("h1");
    const mobileStyles = themedElementStyles(heading, "mobile", pageTheme(page));
    expect(mobileStyles.fontSize).toBeDefined();
  });
});

function pageTheme(_page: ReturnType<typeof getBlankBlueprint>["pages"][number]) {
  return getBlankBlueprint().theme;
}
