import { type CSSProperties, type FormEvent, type PointerEvent, useMemo, useState } from "react";
import type { DeviceMode, ElementNode, SiteTheme } from "../../../../shared/siteflow";
import { createElement } from "./tree";
import { trpc } from "@/lib/trpc";

type RendererProps = {
  nodes: ElementNode[];
  device?: DeviceMode;
  selectedId?: string | null;
  editable?: boolean;
  onSelect?: (node: ElementNode) => void;
  onResize?: (node: ElementNode, width: number) => void;
  onMove?: (node: ElementNode, delta: { x: number; y: number }) => void;
  theme?: SiteTheme;
  /** Slug of the published site this is being rendered for. Only set on the public /s/:slug route —
   *  its presence is what lets Form/CollectionList know they're live (vs. being edited/previewed). */
  siteSlug?: string;
};

type NodeRendererProps = Omit<RendererProps, "nodes">;

function elementStyles(node: ElementNode, device: DeviceMode): CSSProperties {
  const overrides = device === "desktop" ? {} : node.responsive[device] ?? {};
  const compactDefaults: CSSProperties = device === "mobile"
    ? node.type === "heading"
      ? { fontSize: "clamp(34px, 10.5vw, 46px)", lineHeight: 1.08 }
      : node.type === "grid"
        ? { gridTemplateColumns: "minmax(0, 1fr)" }
        : node.type === "section"
          ? { paddingLeft: "7vw", paddingRight: "7vw" }
          : {}
    : device === "tablet" && node.type === "heading"
      ? { fontSize: "48px" }
      : {};
  const activeStyles = { ...node.styles, ...overrides };
  const visualStyles = Object.fromEntries(Object.entries(activeStyles).filter(([key]) => key !== "hoverBackground" && key !== "hoverColor"));
  return { ...compactDefaults, ...visualStyles } as CSSProperties;
}

function NodeFrame({ node, device, selectedId, editable, onSelect, onResize, onMove, children }: NodeRendererProps & { node: ElementNode; children: React.ReactNode }) {
  const selected = editable && selectedId === node.id;
  const selectedStyle = selected ? "siteflow-node-selected" : "";
  const interactive = editable && !node.locked;

  function drag(kind: "move" | "resize", event: PointerEvent<HTMLButtonElement>) {
    if (!interactive) return;
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const target = event.currentTarget.closest("[data-site-node]") as HTMLElement | null;
    const baseWidth = target?.getBoundingClientRect().width ?? 300;
    const handleMove = (moveEvent: globalThis.PointerEvent) => {
      if (kind === "resize") onResize?.(node, Math.max(160, Math.round(baseWidth + moveEvent.clientX - startX)));
      else onMove?.(node, { x: Math.round(moveEvent.clientX - startX), y: Math.round(moveEvent.clientY - startY) });
    };
    const handleEnd = () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleEnd);
    };
    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleEnd);
  }

  return (
    <div
      data-site-node={node.id}
      className={`siteflow-node relative ${selectedStyle} ${node.locked ? "siteflow-node-locked" : ""}`}
      onClick={(event) => {
        if (!editable) return;
        event.stopPropagation();
        if (!interactive) return;
        onSelect?.(node);
      }}
    >
      {children}
      {selected ? (
        <>
          <div className="siteflow-selection-label"><span>{node.name}{node.locked ? " · verrouillé" : ""}</span>{interactive ? <button aria-label="Déplacer l’élément" onPointerDown={(event) => drag("move", event)}>↕</button> : null}</div>
          {interactive ? <button className="siteflow-resize-handle" aria-label="Redimensionner l’élément" onPointerDown={(event) => drag("resize", event)} /> : null}
        </>
      ) : null}
    </div>
  );
}

export function headingTagForNode(node: ElementNode): "h1" | "h2" | "h3" {
  const level = Math.max(1, Math.min(3, Number(node.props.level ?? 2)));
  return level === 1 ? "h1" : level === 3 ? "h3" : "h2";
}

export function themedElementStyles(node: ElementNode, device: DeviceMode, theme?: SiteTheme): CSSProperties {
  const baseStyle = elementStyles(node, device);
  const defaults = createElement(node.type).styles;
  const has = (key: string) => {
    const responsiveValue = device === "desktop" ? undefined : node.responsive[device]?.[key];
    if (responsiveValue !== undefined && responsiveValue !== "") return true;
    const value = node.styles[key];
    return value !== undefined && value !== "" && value !== defaults[key as keyof CSSProperties];
  };
  const level = Math.max(1, Math.min(3, Number(node.props.level ?? 2)));
  const primary = theme?.primary ?? theme?.accent ?? "#2925D8";
  const secondary = theme?.secondary ?? theme?.muted ?? "#F0F0F6";
  const surface = theme?.surface ?? "#FFFFFF";
  const text = theme?.text ?? theme?.foreground ?? "#11172B";
  const res: CSSProperties = { ...baseStyle };

  if (theme) {
    if (!has("borderRadius")) {
      if (node.type === "button") res.borderRadius = theme.buttonRadius ?? theme.radius;
      else if (node.type === "card") res.borderRadius = theme.cardRadius ?? theme.radius;
      else if (["image", "form"].includes(node.type)) res.borderRadius = theme.radius;
    }
    if (!has("borderWidth")) res.borderWidth = theme.borderWidth ?? "1px";
    if (!has("background")) {
      if (["card", "form", "navbar"].includes(node.type)) res.background = surface;
      else if (node.type === "section") res.background = secondary;
      else if (node.type === "button") res.background = primary;
    }
    if (!has("color")) {
      if (node.type === "link") res.color = theme.accent;
      else res.color = text;
    }
    if (!has("boxShadow") && ["card", "image", "form"].includes(node.type)) res.boxShadow = theme.shadow ?? "none";
    
    if (node.type === "heading") {
      res.fontFamily = theme.fontDisplay;
      if (!has("fontSize")) {
        res.fontSize = level === 1 ? theme.fontH1 ?? "60px" : level === 3 ? theme.fontH3 ?? "30px" : theme.fontH2 ?? "48px";
      }
    } else if (["paragraph", "navbar", "footer", "form", "link"].includes(node.type)) {
      res.fontFamily = theme.fontBody;
      if (!has("fontSize")) {
        if (node.type === "footer" || node.type === "link") res.fontSize = theme.fontSmallSize ?? "12px";
        else res.fontSize = theme.fontBodySize ?? "16px";
      }
    } else if (node.type === "button") {
      res.fontFamily = theme.fontBody;
      if (!has("fontSize")) res.fontSize = theme.fontButtonSize ?? "14px";
    }

    if (!has("gap") && ["grid", "columns", "stack"].includes(node.type)) res.gap = theme.spacing ?? "16px";
    if (!has("maxWidth") && node.type === "container") res.maxWidth = theme.containerMaxWidth ?? "1200px";
  }

  return res;
}

type FormField = { id: string; label: string; type: string; required?: boolean; options?: string[] };

function FormNode({ node, style, siteSlug, editable }: { node: ElementNode; style: CSSProperties; siteSlug?: string; editable?: boolean }) {
  const fields = (Array.isArray(node.props.fields) ? (node.props.fields as FormField[]) : null) ?? [
    { id: "email", label: "Email", type: "email", required: true },
    { id: "message", label: "Message", type: "textarea" },
  ];
  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const submit = trpc.siteflow.forms.submit.useMutation({
    onSuccess: () => setStatus("sent"),
    onError: () => setStatus("error"),
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (editable || !siteSlug) return; // live submission only makes sense on the published public site
    const formId = Number(node.props.formId);
    if (!Number.isFinite(formId) || formId <= 0) { setStatus("error"); return; }
    setStatus("submitting");
    submit.mutate({ formId, values });
  }

  if (status === "sent") {
    return (
      <div style={style}>
        <h3 className="mb-2 font-display text-3xl text-[#11172B]">{(node.props.title as string) ?? "Merci !"}</h3>
        <p className="text-sm text-[#51556A]">Votre message a bien été envoyé.</p>
      </div>
    );
  }

  return (
    <form style={style} onSubmit={onSubmit}>
      <h3 className="mb-2 font-display text-3xl text-[#11172B]">{(node.props.title as string) ?? "Restons en contact"}</h3>
      {fields.map((field) => (
        <div key={field.id} className="mb-3">
          {field.type === "textarea" ? (
            <textarea
              aria-label={field.label}
              required={field.required}
              className="min-h-24 w-full rounded-lg border border-[#DCDCE7] px-3 py-3 text-sm"
              placeholder={field.label}
              value={values[field.id] ?? ""}
              onChange={(event) => setValues((prev) => ({ ...prev, [field.id]: event.target.value }))}
            />
          ) : field.type === "checkbox" ? (
            <label className="flex items-center gap-2 text-sm text-[#51556A]">
              <input
                type="checkbox"
                checked={values[field.id] === "true"}
                onChange={(event) => setValues((prev) => ({ ...prev, [field.id]: event.target.checked ? "true" : "false" }))}
              />
              {field.label}
            </label>
          ) : field.type === "select" ? (
            <select
              aria-label={field.label}
              required={field.required}
              className="w-full rounded-lg border border-[#DCDCE7] px-3 py-3 text-sm"
              value={values[field.id] ?? ""}
              onChange={(event) => setValues((prev) => ({ ...prev, [field.id]: event.target.value }))}
            >
              <option value="" disabled>{field.label}</option>
              {(field.options ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : (
            <input
              aria-label={field.label}
              type={field.type === "email" ? "email" : "text"}
              required={field.required}
              className="w-full rounded-lg border border-[#DCDCE7] px-3 py-3 text-sm"
              placeholder={field.label}
              value={values[field.id] ?? ""}
              onChange={(event) => setValues((prev) => ({ ...prev, [field.id]: event.target.value }))}
            />
          )}
        </div>
      ))}
      <button type="submit" disabled={status === "submitting"} className="rounded-lg bg-[#2925D8] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
        {status === "submitting" ? "Envoi…" : (node.props.button as string) ?? "Envoyer"}
      </button>
      {status === "error" ? <p className="mt-2 text-xs text-[#AA5260]">Une erreur est survenue, réessayez.</p> : null}
      {editable || !siteSlug ? <p className="mt-2 text-[11px] text-[#9A9DB0]">Les envois sont actifs une fois le site publié.</p> : null}
    </form>
  );
}

function CollectionListNode({ node, style, siteSlug }: { node: ElementNode; style: CSSProperties; siteSlug?: string }) {
  const collectionSlug = String(node.props.collectionSlug ?? "");
  const titleField = String(node.props.titleField ?? "Titre");
  const imageField = String(node.props.imageField ?? "");
  const limit = Number(node.props.limit ?? 6);
  const query = trpc.siteflow.publicCollection.useQuery(
    { siteSlug: siteSlug ?? "", collectionSlug },
    { enabled: Boolean(siteSlug && collectionSlug), retry: false },
  );

  if (!siteSlug) {
    return (
      <div style={style}>
        <div className="col-span-full rounded-lg border border-dashed border-[#CFCFF5] bg-[#F7F7FF] p-6 text-center text-xs text-[#676BD0]">
          Liste de collection{collectionSlug ? ` — ${collectionSlug}` : " — aucune collection liée"}. Le contenu réel s’affichera une fois le site publié.
        </div>
      </div>
    );
  }

  const items = (query.data?.items ?? []).slice(0, Math.max(1, limit));
  if (!items.length) return null;

  return (
    <div style={style}>
      {items.map((item) => {
        const values = item.values as Record<string, unknown>;
        const title = (values[titleField] as string) ?? item.name;
        const image = imageField ? (values[imageField] as string) : undefined;
        return (
          <article key={item.id} className="rounded-2xl border border-[#E7E7EF] bg-white p-5">
            {image ? <img src={image} alt={title} className="mb-3 h-36 w-full rounded-lg object-cover" /> : null}
            <h3 className="m-0 font-semibold text-[#11172B]">{title}</h3>
          </article>
        );
      })}
    </div>
  );
}

function NodeView(props: NodeRendererProps & { node: ElementNode }) {
  const { node, device = "desktop", selectedId, editable, onSelect, onResize, onMove, theme } = props;
  const themeAccent = theme?.accent ?? "#2925D8";
  const themeText = theme?.text ?? "#11172B";
  const HeadingTag = headingTagForNode(node);
  const style = useMemo(() => themedElementStyles(node, device, theme), [device, node, theme]);
  const [hovered, setHovered] = useState(false);
  const activeStyles = device === "desktop" ? node.styles : { ...node.styles, ...(node.responsive[device] ?? {}) };
  const hoverStyle = hovered ? { ...(activeStyles.hoverBackground ? { background: String(activeStyles.hoverBackground) } : {}), ...(activeStyles.hoverColor ? { color: String(activeStyles.hoverColor) } : {}) } : {};
  const children = node.children.map((child) => <NodeView key={child.id} {...props} node={child} />);
  
  const animType = String(node.props.animationType ?? "none");
  const animDuration = Number(node.props.animationDuration ?? 400);
  const animDelay = Number(node.props.animationDelay ?? 0);
  const animClass = animType !== "none" ? `siteflow-animate siteflow-animate-${animType}` : "";
  const animStyle = animType !== "none" ? { "--siteflow-anim-duration": `${animDuration}ms`, "--siteflow-anim-delay": `${animDelay}ms` } as CSSProperties : {};

  if (!node.visible) return null;
  const frame = (content: React.ReactNode) => <NodeFrame {...props}>{content}</NodeFrame>;
  const copy = (node.props.text as string) ?? "";
  const wrapLink = (content: React.ReactNode, href?: string) => href ? <a href={href} onClick={(event) => editable && event.preventDefault()} className="block">{content}</a> : content;

  const nodeContent = (() => {
    switch (node.type) {
      case "section": return <section style={style}>{children}</section>;
      case "container": return <div style={style}>{children}</div>;
      case "heading": return wrapLink(<HeadingTag style={style}>{copy}</HeadingTag>, node.props.href as string);
      case "paragraph": return wrapLink(<p style={style}>{copy}</p>, node.props.href as string);
      case "button": {
        const size = String(node.props.size ?? "md");
        const sizeStyle = size === "sm" ? { padding: "8px 14px", fontSize: "12px" } : size === "lg" ? { padding: "18px 28px", fontSize: "18px" } : {};
        return <a href={(node.props.href as string) ?? "#"} onClick={(event) => editable && event.preventDefault()} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)} style={{ ...style, ...sizeStyle, ...hoverStyle }}>{typeof node.props.icon === "string" && node.props.icon && <span className="mr-2">{node.props.icon}</span>}{(node.props.label as string) ?? "Action"}</a>;
      }
      case "image": return wrapLink(<img src={(node.props.src as string) ?? ""} alt={(node.props.alt as string) ?? ""} style={style} />, node.props.href as string);
      case "grid": return <div style={style}>{children}</div>;
      case "card": return <article style={style}><h3 className="mb-3 font-semibold" style={{ color: themeText }}>{(node.props.title as string) ?? node.name}</h3><p className="m-0 text-sm leading-6 text-[#62667B]">{(node.props.text as string) ?? ""}</p>{children}</article>;
      case "navbar": return <nav style={style} className="flex items-center justify-between gap-6"><span className="font-display text-2xl font-normal" style={{ color: themeAccent }}>{(node.props.brand as string) ?? "Marque"}</span><div className="flex items-center gap-5 text-sm font-semibold text-[#51556A]">{((node.props.links as string[]) ?? []).map((link) => <span key={link}>{link}</span>)}</div></nav>;
      case "footer": return <footer style={style}>{(node.props.text as string) ?? ""}{children}</footer>;
      case "form": return <FormNode node={node} style={style} siteSlug={props.siteSlug} editable={editable} />;
      case "collection-list": return <CollectionListNode node={node} style={style} siteSlug={props.siteSlug} />;
      case "divider": return <div style={style} />;
      case "spacer": return <div aria-hidden="true" style={style} />;
      case "icon": return <span role="img" aria-label={(node.props.label as string) ?? "Icône"} style={style}>{(node.props.symbol as string) ?? "✦"}</span>;
      case "video": return node.props.src ? <video controls={node.props.controls !== false} poster={(node.props.poster as string) || undefined} style={style}><source src={String(node.props.src)} /></video> : <div style={{ ...style, display: "grid", placeItems: "center", minHeight: "180px", background: "#EDEDF4", color: "#74778C" }}>Ajoutez une source vidéo</div>;
      case "link": return <a href={(node.props.href as string) ?? "#"} onClick={(event) => editable && event.preventDefault()} style={{ ...style, color: themeAccent }}>{(node.props.label as string) ?? "En savoir plus"}</a>;
      case "columns": return <div style={style}>{children}</div>;
      case "stack": return <div style={style}>{children}</div>;
      default: return <div style={style}>{children}</div>;
    }
  })();

  return frame(<div className={animClass} style={animStyle}>{nodeContent}</div>);
}

export function SiteRenderer({ nodes, theme, siteSlug, ...props }: RendererProps) {
  const rootStyle = theme ? {
    "--siteflow-primary": theme.primary,
    "--siteflow-secondary": theme.secondary,
    "--siteflow-surface": theme.surface,
    "--siteflow-background": theme.background,
    "--siteflow-text": theme.text,
    "--siteflow-accent": theme.accent,
    "--siteflow-muted": theme.muted,
    "--siteflow-shadow": theme.shadow,
    "--siteflow-space": theme.spacing,
    "--siteflow-radius": theme.radius,
    "--siteflow-button-radius": theme.buttonRadius,
    "--siteflow-card-radius": theme.cardRadius,
    "--siteflow-border-width": theme.borderWidth,
    fontFamily: theme.fontBody,
  } as React.CSSProperties : undefined;
  return <div className="siteflow-renderer-root" style={rootStyle}>{nodes.map((node) => <NodeView key={node.id} {...props} theme={theme} siteSlug={siteSlug} node={node} />)}</div>;
}
