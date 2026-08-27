import { describe, expect, it } from "vitest";
import ErrorBoundary from "./ErrorBoundary";

describe("ErrorBoundary", () => {
  it("derives an error state and renders a recovery action for render failures", () => {
    const error = new Error("controlled render failure");
    const nextState = ErrorBoundary.getDerivedStateFromError(error);
    const boundary = new ErrorBoundary({ children: null });
    boundary.state = nextState;

    const output = boundary.render() as { props: { children: unknown } };
    const rendered = JSON.stringify(output);

    expect(nextState).toEqual({ hasError: true, error });
    expect(rendered).toContain("Cette vue a rencontré un problème.");
    expect(rendered).toContain("Recharger la vue");
    expect(rendered).toContain("controlled render failure");
  });
});
