import { describe, expect, it } from "vitest";
import { createElement } from "@/components/siteflow/tree";
import { applyHistoryAction, nextSaveStatus } from "./editorState";

describe("editor save state", () => {
  it("transitions through edit, request, success, and error states", () => {
    expect(nextSaveStatus("edit")).toBe("unsaved");
    expect(nextSaveStatus("request")).toBe("saving");
    expect(nextSaveStatus("success")).toBe("saved");
    expect(nextSaveStatus("error")).toBe("unsaved");
  });

  it("keeps history actions unsaved and branches before autosave", () => {
    const first = [createElement("heading")];
    const second = [createElement("paragraph")];
    const branch = [createElement("button")];
    const initial = { history: [first], index: 0 };
    const afterEdit = applyHistoryAction(initial, { type: "commit", next: second });
    expect(afterEdit?.saveStatus).toBe("unsaved");
    expect(afterEdit?.index).toBe(1);
    const afterUndo = afterEdit && applyHistoryAction(afterEdit, { type: "undo" });
    expect(afterUndo?.next).toBe(first);
    expect(afterUndo?.saveStatus).toBe("unsaved");
    const afterBranch = afterUndo && applyHistoryAction(afterUndo, { type: "commit", next: branch });
    expect(afterBranch?.next).toBe(branch);
    expect(afterBranch?.history).toHaveLength(2);
    const afterRedo = afterBranch && applyHistoryAction(afterBranch, { type: "redo" });
    expect(afterRedo).toBeNull();
    expect(nextSaveStatus("request")).toBe("saving");
    expect(nextSaveStatus("success")).toBe("saved");
    expect(nextSaveStatus("error")).toBe("unsaved");
  });
});
