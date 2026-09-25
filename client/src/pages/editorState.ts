import type { ElementNode } from "../../../shared/siteflow";

export type SaveStatus = "saved" | "saving" | "unsaved";
export type SaveEvent = "edit" | "request" | "success" | "error";
export type EditorHistoryState = { history: ElementNode[][]; index: number };
export type HistoryAction = { type: "commit"; next: ElementNode[] } | { type: "undo" } | { type: "redo" };
export type HistoryTransition = EditorHistoryState & { next: ElementNode[]; saveStatus: SaveStatus };

export function nextSaveStatus(event: SaveEvent): SaveStatus {
  if (event === "request") return "saving";
  if (event === "success") return "saved";
  if (event === "edit" || event === "error") return "unsaved";
  return "unsaved";
}

export function applyHistoryAction(state: EditorHistoryState, action: HistoryAction): HistoryTransition | null {
  if (action.type === "commit") {
    const index = state.index + 1;
    return { history: [...state.history.slice(0, index), action.next], index, next: action.next, saveStatus: nextSaveStatus("edit") };
  }
  const index = action.type === "undo" ? state.index - 1 : state.index + 1;
  if (index < 0 || index >= state.history.length) return null;
  return { history: state.history, index, next: state.history[index], saveStatus: nextSaveStatus("edit") };
}
