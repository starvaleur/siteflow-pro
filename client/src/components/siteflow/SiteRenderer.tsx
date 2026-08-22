import { type CSSProperties, type PointerEvent, useMemo } from "react";
import type { DeviceMode, ElementNode } from "../../../../shared/siteflow";

type RendererProps = {
  nodes: ElementNode[];
  device?: DeviceMode;
  selectedId?: string | null;
  editable?: boolean;
  onSelect?: (node: ElementNode) => void;
  onResize?: (node: ElementNode, width: number) => void;
  onMove?: (node: ElementNode, delta: { x: number; y: number }) => void;
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
  return { ...node.styles, ...compactDefaults, ...overrides } as CSSProperties;
}

function NodeFrame({ node, device, selectedId, editable, onSelect, onResize, onMove, children }: NodeRendererProps & { node: ElementNode; children: React.ReactNode }) {
  const selected = editable && selectedId === node.id;
  const selectedStyle = selected ? "siteflow-node-selected" : "";

  function drag(kind: "move" | "resize", event: PointerEvent<HTMLButtonElement>) {
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
      className={`siteflow-node relative ${selectedStyle}`}
      onClick={(event) => {
        if (!editable) return;
        event.stopPropagation();
        onSelect?.(node);
      }}
    >
      {children}
      {selected ? (
        <>
          <div className="siteflow-selection-label"><span>{node.name}</span><button aria-label="Déplacer l’élément" onPointerDown={(event) => drag("move", event)}>↕</button></div>
          <button className="siteflow-resize-handle" aria-label="Redimensionner l’élément" onPointerDown={(event) => drag("resize", event)} />
        </>
      ) : null}
    </div>
  );
}

function NodeView(props: NodeRendererProps & { node: ElementNode }) {
  const { node, device = "desktop", selectedId, editable, onSelect, onResize, onMove } = props;
  const style = useMemo(() => elementStyles(node, device), [device, node]);
  const children = node.children.map((child) => <NodeView key={child.id} {...props} node={child} />);
  if (!node.visible) return null;
  const frame = (content: React.ReactNode) => <NodeFrame {...props}>{content}</NodeFrame>;
  const copy = (node.props.text as string) ?? "";

  switch (node.type) {
    case "section": return frame(<section style={style}>{children}</section>);
    case "container": return frame(<div style={style}>{children}</div>);
    case "heading": return frame(<h2 style={style}>{copy}</h2>);
    case "paragraph": return frame(<p style={style}>{copy}</p>);
    case "button": return frame(<a href={(node.props.href as string) ?? "#"} onClick={(event) => editable && event.preventDefault()} style={style}>{(node.props.label as string) ?? "Action"}</a>);
    case "image": return frame(<img src={(node.props.src as string) ?? ""} alt={(node.props.alt as string) ?? ""} style={style} />);
    case "grid": return frame(<div style={style}>{children}</div>);
    case "card": return frame(<article style={style}><h3 className="mb-3 font-semibold text-[#11172B]">{(node.props.title as string) ?? node.name}</h3><p className="m-0 text-sm leading-6 text-[#62667B]">{(node.props.text as string) ?? ""}</p>{children}</article>);
    case "navbar": return frame(<nav style={style} className="flex items-center justify-between gap-6"><span className="font-display text-2xl font-normal text-[#2925D8]">{(node.props.brand as string) ?? "Marque"}</span><div className="flex items-center gap-5 text-sm font-semibold text-[#51556A]">{((node.props.links as string[]) ?? []).map((link) => <span key={link}>{link}</span>)}</div></nav>);
    case "footer": return frame(<footer style={style}>{(node.props.text as string) ?? ""}{children}</footer>);
    case "form": return frame(<form style={style} onSubmit={(event) => event.preventDefault()}><h3 className="mb-2 font-display text-3xl text-[#11172B]">{(node.props.title as string) ?? "Restons en contact"}</h3><input aria-label="Email" className="mb-3 w-full rounded-lg border border-[#DCDCE7] px-3 py-3 text-sm" placeholder="Votre email" /><textarea aria-label="Message" className="mb-3 min-h-24 w-full rounded-lg border border-[#DCDCE7] px-3 py-3 text-sm" placeholder="Votre message" /><button className="rounded-lg bg-[#2925D8] px-4 py-3 text-sm font-bold text-white">{(node.props.button as string) ?? "Envoyer"}</button></form>);
    case "divider": return frame(<div style={style} />);
    case "spacer": return frame(<div aria-hidden="true" style={style} />);
    default: return frame(<div style={style}>{children}</div>);
  }
}

export function SiteRenderer({ nodes, ...props }: RendererProps) {
  return <>{nodes.map((node) => <NodeView key={node.id} {...props} node={node} />)}</>;
}
