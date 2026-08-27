import { describe, expect, it } from "vitest";
import type { SiteTheme } from "../../../../shared/siteflow";
import { createElement, patchNodeStyle } from "./tree";
import { headingTagForNode, themedElementStyles } from "./SiteRenderer";

const theme: SiteTheme = {
  name: "Test theme",
  background: "#101010",
  foreground: "#FAFAFA",
  accent: "#FF6B35",
  muted: "#E8E2D8",
  fontDisplay: "Test Display",
  fontBody: "Test Body",
  radius: "24px",
  primary: "#3B2DBF",
  secondary: "#DCEBFF",
  surface: "#FFF9F0",
  shadow: "0 20px 40px rgba(0,0,0,.2)",
  spacing: "28px",
  fontH1: "72px",
  fontH2: "52px",
  fontH3: "34px",
  fontBodySize: "18px",
  fontSmallSize: "12px",
};

describe("renderer theme mapping", () => {
  it("maps each global color token to a visible element role", () => {
    expect(themedElementStyles(createElement("section"), "desktop", theme).background).toBe(theme.secondary);
    expect(themedElementStyles(createElement("card"), "desktop", theme).background).toBe(theme.surface);
    expect(themedElementStyles(createElement("button"), "desktop", theme).background).toBe(theme.primary);
    expect(themedElementStyles(createElement("link"), "desktop", theme).color).toBe(theme.accent);
  });

  it("keeps a mobile-only override isolated from desktop rendering", () => {
    const heading = patchNodeStyle(createElement("heading"), { fontSize: "32px", color: "#FF6B35" }, "mobile");
    expect(themedElementStyles(heading, "desktop", theme).fontSize).toBe(theme.fontH2);
    expect(themedElementStyles(heading, "mobile", theme).fontSize).toBe("32px");
    expect(themedElementStyles(heading, "mobile", theme).color).toBe("#FF6B35");
  });

  it("maps semantic heading levels and body/small type tokens", () => {
    const heading = createElement("heading");
    heading.props.level = 1;
    expect(headingTagForNode(heading)).toBe("h1");
    expect(themedElementStyles(heading, "desktop", theme)).toMatchObject({ fontFamily: theme.fontDisplay, fontSize: theme.fontH1 });
    expect(themedElementStyles(createElement("paragraph"), "desktop", theme)).toMatchObject({ fontFamily: theme.fontBody, fontSize: theme.fontBodySize });
    expect(themedElementStyles(createElement("footer"), "desktop", theme)).toMatchObject({ fontFamily: theme.fontBody, fontSize: theme.fontSmallSize });
  });

  it("applies UI radius, shadow, and spacing tokens across supported families", () => {
    expect(themedElementStyles(createElement("card"), "desktop", theme)).toMatchObject({ borderRadius: theme.radius, boxShadow: theme.shadow });
    expect(themedElementStyles(createElement("form"), "desktop", theme).borderRadius).toBe(theme.radius);
    expect(themedElementStyles(createElement("image"), "desktop", theme)).toMatchObject({ borderRadius: theme.radius, boxShadow: theme.shadow });
    expect(themedElementStyles(createElement("grid"), "desktop", theme).gap).toBe(theme.spacing);
    expect(themedElementStyles(createElement("columns"), "desktop", theme).gap).toBe(theme.spacing);
    expect(themedElementStyles(createElement("stack"), "desktop", theme).gap).toBe(theme.spacing);
  });
});
