import { nanoid } from "nanoid";
import type { ElementNode, ElementType, StyleMap } from "../../../../shared/siteflow";

export const elementLabels: Record<ElementType, string> = {
  section: "Section",
  container: "Conteneur",
  heading: "Titre",
  paragraph: "Paragraphe",
  button: "Bouton",
  image: "Image",
  card: "Carte",
  grid: "Grille",
  navbar: "Navigation",
  footer: "Pied de page",
  form: "Formulaire",
  divider: "Séparateur",
  spacer: "Espace",
};

export function createElement(type: ElementType): ElementNode {
  const id = nanoid(10);
  const common = { id, type, name: elementLabels[type], visible: true, locked: false, responsive: {}, children: [] as ElementNode[] };
  const presets: Record<ElementType, Pick<ElementNode, "props" | "styles">> = {
    heading: { props: { text: "Un titre qui attire l’attention" }, styles: { fontFamily: "DM Serif Display", fontSize: "48px", lineHeight: 1.08, color: "#11172B", marginBottom: "18px" } },
    paragraph: { props: { text: "Présentez votre idée avec une phrase claire, utile et mémorable." }, styles: { fontSize: "17px", lineHeight: 1.65, color: "#51556A", maxWidth: "620px", marginBottom: "18px" } },
    button: { props: { label: "Découvrir", href: "#" }, styles: { background: "#2925D8", color: "#ffffff", padding: "14px 20px", borderRadius: "10px", display: "inline-block", fontWeight: 700 } },
    image: { props: { src: "/manus-storage/template-nexus-saas_c284fccd.png", alt: "Visuel de votre site" }, styles: { width: "100%", maxWidth: "720px", borderRadius: "16px", display: "block" } },
    section: { props: {}, styles: { background: "#F8F8FC", padding: "72px 7vw", minHeight: "180px" } },
    container: { props: {}, styles: { maxWidth: "1200px", margin: "0 auto", padding: "24px" } },
    grid: { props: { columns: 3 }, styles: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "18px" } },
    card: { props: { title: "Une carte bien construite", text: "Un espace de contenu précis pour raconter ce qui compte." }, styles: { background: "#ffffff", border: "1px solid #E7E7EF", padding: "28px", borderRadius: "16px" } },
    navbar: { props: { brand: "Votre marque", links: ["Accueil", "À propos", "Contact"] }, styles: { background: "#ffffff", padding: "20px 7vw" } },
    footer: { props: { text: "Construit avec SiteFlow Pro." }, styles: { background: "#11172B", color: "#ffffff", padding: "42px 7vw" } },
    form: { props: { title: "Restons en contact", button: "Envoyer" }, styles: { background: "#ffffff", border: "1px solid #E7E7EF", padding: "30px", borderRadius: "16px", maxWidth: "560px" } },
    divider: { props: {}, styles: { borderTop: "1px solid #E6E6EE", margin: "32px 0" } },
    spacer: { props: {}, styles: { height: "48px" } },
  };
  return { ...common, ...presets[type] };
}

export function findNode(nodes: ElementNode[], id: string): ElementNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findNode(node.children, id);
    if (child) return child;
  }
  return undefined;
}

export function updateNode(nodes: ElementNode[], id: string, update: (node: ElementNode) => ElementNode): ElementNode[] {
  return nodes.map((node) => {
    if (node.id === id) return update(node);
    return { ...node, children: updateNode(node.children, id, update) };
  });
}

export function removeNode(nodes: ElementNode[], id: string): ElementNode[] {
  return nodes.filter((node) => node.id !== id).map((node) => ({ ...node, children: removeNode(node.children, id) }));
}

export function appendNode(nodes: ElementNode[], node: ElementNode, parentId?: string): ElementNode[] {
  if (!parentId) return [...nodes, node];
  return nodes.map((item) => item.id === parentId ? { ...item, children: [...item.children, node] } : { ...item, children: appendNode(item.children, node, parentId) });
}

export function duplicateNode(nodes: ElementNode[], id: string): ElementNode[] {
  const clone = (node: ElementNode): ElementNode => ({ ...node, id: nanoid(10), name: `${node.name} — copie`, children: node.children.map(clone) });
  const result: ElementNode[] = [];
  nodes.forEach((node) => {
    result.push({ ...node, children: duplicateNode(node.children, id) });
    if (node.id === id) result.push(clone(node));
  });
  return result;
}

export function reorderSibling(nodes: ElementNode[], id: string, direction: "up" | "down"): ElementNode[] {
  const ownIndex = nodes.findIndex((node) => node.id === id);
  if (ownIndex !== -1) {
    const target = direction === "up" ? ownIndex - 1 : ownIndex + 1;
    if (target < 0 || target >= nodes.length) return nodes;
    const next = [...nodes];
    [next[ownIndex], next[target]] = [next[target], next[ownIndex]];
    return next;
  }
  return nodes.map((node) => ({ ...node, children: reorderSibling(node.children, id, direction) }));
}

export function moveNodeBefore(nodes: ElementNode[], draggedId: string, targetId: string): ElementNode[] {
  if (draggedId === targetId) return nodes;
  const dragged = findNode(nodes, draggedId);
  if (!dragged || findNode(dragged.children, targetId)) return nodes;
  const withoutDragged = removeNode(nodes, draggedId);
  let inserted = false;
  const insert = (items: ElementNode[]): ElementNode[] => {
    const targetIndex = items.findIndex((node) => node.id === targetId);
    if (targetIndex !== -1) {
      inserted = true;
      return [...items.slice(0, targetIndex), dragged, ...items.slice(targetIndex)];
    }
    return items.map((node) => ({ ...node, children: insert(node.children) }));
  };
  const result = insert(withoutDragged);
  return inserted ? result : nodes;
}

export function patchNodeStyle(node: ElementNode, styles: StyleMap, device: "desktop" | "tablet" | "mobile") {
  if (device === "desktop") return { ...node, styles: { ...node.styles, ...styles } };
  return { ...node, responsive: { ...node.responsive, [device]: { ...node.responsive[device], ...styles } } };
}

export function patchNodeProp(nodes: ElementNode[], id: string, key: string, value: unknown): ElementNode[] {
  return updateNode(nodes, id, (node) => ({ ...node, props: { ...node.props, [key]: value } }));
}

export function applyUploadedImage(nodes: ElementNode[], targetId: string, url: string): ElementNode[] {
  return patchNodeProp(nodes, targetId, "src", url);
}

export function pushHistory(history: ElementNode[][], index: number, next: ElementNode[]) {
  const nextIndex = index + 1;
  return { history: [...history.slice(0, nextIndex), next], index: nextIndex };
}

export function historyUndo(history: ElementNode[][], index: number): { next: ElementNode[]; index: number } | null {
  return index > 0 ? { next: history[index - 1], index: index - 1 } : null;
}

export function historyRedo(history: ElementNode[][], index: number): { next: ElementNode[]; index: number } | null {
  return index < history.length - 1 ? { next: history[index + 1], index: index + 1 } : null;
}

export function flattenTree(nodes: ElementNode[]): ElementNode[] {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children)]);
}
