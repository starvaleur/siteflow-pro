import { SiteRenderer } from "@/components/siteflow/SiteRenderer";
import { appendNode, applyUploadedImage, createElement, duplicateNode, elementLabels, findNode, moveNodeBefore, patchNodeStyle, removeNode, reorderSibling, updateNode } from "@/components/siteflow/tree";
import { SiteFlowLogo } from "@/components/siteflow/AppShell";
import { MOBILE_BREAKPOINT } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import type { DeviceMode, ElementNode, ElementType, SiteTheme, StyleMap } from "../../../shared/siteflow";
import { AlignCenter, AlignLeft, AlignRight, Archive, ArrowDown, ArrowUp, BarChart3, Box, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ClipboardCopy, Cloud, Code2, Copy, Database, Eye, FilePlus2, FileText, FolderOpen, FormInput, Globe2, Image, LayoutPanelLeft, Layers3, Link, Lock, Menu, Monitor, MoreHorizontal, MousePointer2, Palette, PanelLeftClose, Pencil, Plus, Maximize2, Redo2, Rocket, Search, Settings2, Smartphone, Sparkles, Tablet, Trash2, Undo2, Upload, Wand2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { applyHistoryAction, nextSaveStatus } from "./editorState";

type Panel = "add" | "components" | "pages" | "layers" | "theme" | "assets" | "cms" | "forms" | "seo" | "analytics" | "settings";

export const DEVICE_CANVAS_WIDTHS: Record<DeviceMode, number> = { desktop: 990, tablet: 760, mobile: 390 };
export const MIN_CANVAS_ZOOM = 25;
export const MAX_CANVAS_ZOOM = 125;

export function getCanvasBaseWidth(device: DeviceMode) {
  return DEVICE_CANVAS_WIDTHS[device];
}

export function getFitZoom(availableWidth: number, canvasWidth: number) {
  if (availableWidth <= 0 || canvasWidth <= 0) return 100;
  return Math.max(MIN_CANVAS_ZOOM, Math.min(100, Math.floor((availableWidth / canvasWidth) * 100)));
}

export function getEditorRecoverySiteId(requestedSiteId: number, sites: Array<{ id: number }>) {
  if (sites.some((site) => site.id === requestedSiteId)) return null;
  return sites[0]?.id ?? null;
}

const toolGroups: Array<{ label: string; items: Array<{ panel: Panel; icon: typeof Plus; title: string }> }> = [
  { label: "Construire", items: [{ panel: "add", icon: Plus, title: "Ajouter" }, { panel: "components", icon: Box, title: "Composants" }, { panel: "layers", icon: Layers3, title: "Calques" }, { panel: "theme", icon: Palette, title: "Thème" }] },
  { label: "Contenu", items: [{ panel: "pages", icon: FileText, title: "Pages" }, { panel: "assets", icon: Image, title: "Assets" }, { panel: "cms", icon: Database, title: "CMS" }, { panel: "forms", icon: FormInput, title: "Formulaires" }] },
  { label: "Croître", items: [{ panel: "seo", icon: Search, title: "SEO" }, { panel: "analytics", icon: BarChart3, title: "Analytics" }, { panel: "settings", icon: Settings2, title: "Réglages" }] },
];

const elementGroups: Array<{ label: string; elements: ElementType[] }> = [
  { label: "Éléments", elements: ["heading", "paragraph", "button", "image", "icon", "video", "link", "divider", "spacer"] },
  { label: "Mise en page", elements: ["section", "container", "grid", "columns", "stack", "card"] },
  { label: "Navigation", elements: ["navbar", "footer"] },
  { label: "Formulaires", elements: ["form"] },
];

function deviceIcon(device: DeviceMode) { return device === "desktop" ? Monitor : device === "tablet" ? Tablet : Smartphone; }

export default function Editor() {
  const [, params] = useRoute("/editor/:id");
  const siteId = Number(params?.id);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const siteQuery = trpc.siteflow.get.useQuery({ siteId }, { enabled: Number.isFinite(siteId) && siteId > 0 });
  const needsSiteRecovery = siteQuery.isError || (!siteQuery.isLoading && !siteQuery.data);
  const accessibleSitesQuery = trpc.siteflow.list.useQuery(undefined, { enabled: needsSiteRecovery });
  const [activePanel, setActivePanel] = useState<Panel>("add");
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [currentPageId, setCurrentPageId] = useState<number | null>(null);
  const [tree, setTree] = useState<ElementNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<ElementNode[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [inspectorTab, setInspectorTab] = useState<"content" | "design" | "layout" | "responsive" | "animation">("content");
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishResult, setPublishResult] = useState(false);
  const [mobilePropertiesOpen, setMobilePropertiesOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<Panel | null>(null);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [isEditorNarrow, setIsEditorNarrow] = useState(() => typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT);
  const [zoom, setZoom] = useState(100);
  const pageHydrated = useRef<number | null>(null);
  const treeRef = useRef<ElementNode[]>([]);
  const historyIndexRef = useRef(-1);
  const canvasWrapRef = useRef<HTMLElement | null>(null);
  const currentPage = useMemo(() => siteQuery.data?.pages.find((page) => page.id === currentPageId) ?? siteQuery.data?.pages[0], [currentPageId, siteQuery.data?.pages]);
  const selected = useMemo(() => selectedId ? findNode(tree, selectedId) : undefined, [selectedId, tree]);

  useEffect(() => {
    if (isEditorNarrow && device === "desktop") setDevice("mobile");
  }, [device, isEditorNarrow]);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const update = () => setIsEditorNarrow(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const savePage = trpc.siteflow.pages.update.useMutation({
    onSuccess: (data) => { utils.siteflow.get.setData({ siteId }, data); setSaveStatus(nextSaveStatus("success")); },
    onError: () => { setSaveStatus(nextSaveStatus("error")); toast.error("La sauvegarde n’a pas abouti."); },
  });
  const createPage = trpc.siteflow.pages.create.useMutation({ onSuccess: (result) => { utils.siteflow.get.setData({ siteId }, result.data); setCurrentPageId(result.pageId); toast.success("Nouvelle page créée."); } });
  const removePage = trpc.siteflow.pages.remove.useMutation({ onSuccess: (data) => { utils.siteflow.get.setData({ siteId }, data); setCurrentPageId(data.pages[0]?.id ?? null); toast.success("Page supprimée."); } });
  const updateSite = trpc.siteflow.update.useMutation({ onSuccess: (data) => { utils.siteflow.get.setData({ siteId }, data); toast.success("Réglages du site enregistrés."); } });
  const publishSite = trpc.siteflow.publish.useMutation({ onSuccess: (data) => { utils.siteflow.get.setData({ siteId }, data); setPublishResult(true); setPublishOpen(false); toast.success("Le site est publié."); } });
  const uploadImage = trpc.siteflow.assets.upload.useMutation({ onSuccess: () => { utils.siteflow.assets.list.invalidate(); }, onError: (error) => toast.error(error.message) });

  useEffect(() => {
    if (!siteQuery.data?.pages.length) return;
    const target = siteQuery.data.pages.find((page) => page.id === currentPageId) ?? siteQuery.data.pages[0];
    if (pageHydrated.current === target.id) return;
    pageHydrated.current = target.id;
    setCurrentPageId(target.id);
    treeRef.current = target.elementTree as ElementNode[];
    historyIndexRef.current = 0;
    setTree(target.elementTree as ElementNode[]);
    setHistory([target.elementTree as ElementNode[]]);
    setHistoryIndex(0);
    setSelectedId((target.elementTree as ElementNode[]).find((node) => node.type === "section")?.id ?? target.elementTree[0]?.id ?? null);
    setInspectorTab("design");
    setSaveStatus("saved");
  }, [currentPageId, siteQuery.data?.pages]);

  useEffect(() => {
    if (!needsSiteRecovery || !accessibleSitesQuery.data?.length) return;
    const recoverySiteId = getEditorRecoverySiteId(siteId, accessibleSitesQuery.data);
    if (recoverySiteId && recoverySiteId !== siteId) {
      setLocation(`/editor/${recoverySiteId}`);
    }
  }, [accessibleSitesQuery.data, needsSiteRecovery, setLocation, siteId]);

  useEffect(() => {
    if (!currentPage || historyIndex <= 0 || JSON.stringify(tree) === JSON.stringify(currentPage.elementTree)) return;
    setSaveStatus(nextSaveStatus("request"));
    const timer = window.setTimeout(() => savePage.mutate({ pageId: currentPage.id, elementTree: tree }), 650);
    return () => window.clearTimeout(timer);
  }, [currentPage, historyIndex, savePage, tree]);

  function commit(next: ElementNode[]) {
    const result = applyHistoryAction({ history, index: historyIndexRef.current }, { type: "commit", next });
    if (!result) return;
    treeRef.current = result.next;
    historyIndexRef.current = result.index;
    setTree(result.next);
    setHistory(result.history);
    setHistoryIndex(result.index);
    setSaveStatus(result.saveStatus);
  }

  function selectNode(node: ElementNode) { setSelectedId(node.id); setInspectorTab("content"); if (isEditorNarrow) { setMobilePanel(null); setMobilePropertiesOpen(true); } }
  function openPanel(panel: Panel) {
    setActivePanel(panel);
    if (isEditorNarrow) { setMobilePropertiesOpen(false); setMobilePanel(panel); }
    else setLeftPanelOpen(true);
  }
  function closeMobilePanel() { setMobilePanel(null); }
  function zoomIn() { setZoom((value) => Math.min(MAX_CANVAS_ZOOM, value + 10)); }
  function zoomOut() { setZoom((value) => Math.max(MIN_CANVAS_ZOOM, value - 10)); }
  function recenterCanvas() {
    requestAnimationFrame(() => {
      const wrap = canvasWrapRef.current;
      if (!wrap) return;
      wrap.scrollTo({ left: Math.max(0, (wrap.scrollWidth - wrap.clientWidth) / 2), top: wrap.scrollTop, behavior: "auto" });
    });
  }
  function fitCanvas() {
    const wrap = canvasWrapRef.current;
    if (isEditorNarrow) {
      setZoom(100);
      requestAnimationFrame(recenterCanvas);
      return;
    }
    const available = (wrap?.clientWidth ?? 0) - 28;
    const nextZoom = getFitZoom(available, canvasBaseWidth);
    setZoom(nextZoom);
    requestAnimationFrame(() => {
      const currentWrap = canvasWrapRef.current;
      if (!currentWrap) return;
      currentWrap.scrollTo({ left: Math.max(0, (currentWrap.scrollWidth - currentWrap.clientWidth) / 2), top: 0, behavior: "smooth" });
    });
  }
  useEffect(() => {
    recenterCanvas();
  }, [device, leftPanelOpen, inspectorOpen, isEditorNarrow, zoom]);

  useEffect(() => {
    window.addEventListener("resize", recenterCanvas);
    return () => window.removeEventListener("resize", recenterCanvas);
  }, []);

  function addElement(type: ElementType) {
    const element = createElement(type);
    const canContain = selected && ["section", "container", "grid", "columns", "stack", "card"].includes(selected.type);
    commit(appendNode(tree, element, canContain ? selected.id : undefined));
    setSelectedId(element.id);
    toast.success(`${elementLabels[type]} ajouté.`);
  }
  function addSectionPreset() {
    const section = createElement("section");
    section.name = "Section éditoriale";
    section.children = [createElement("heading"), createElement("paragraph"), createElement("button")];
    (section.children[0].props as { text: string }).text = "Une nouvelle section, déjà structurée.";
    commit([...tree, section]); setSelectedId(section.id); toast.success("Section ajoutée au canevas.");
  }
  function addComponent(kind: "hero" | "features" | "contact" | "gallery" | "faq" | "testimonials" | "pricing") {
    const section = createElement("section");
    if (kind === "hero") { section.name = "Hero · composant"; section.children = [createElement("heading"), createElement("paragraph"), createElement("button")]; (section.children[0].props as { text: string }).text = "Une introduction qui positionne votre idée."; }
    if (kind === "features") { section.name = "Grille de bénéfices · composant"; const grid = createElement("grid"); grid.children = [createElement("card"), createElement("card"), createElement("card")]; section.children = [createElement("heading"), grid]; (section.children[0].props as { text: string }).text = "Ce qui rend votre approche unique."; }
    if (kind === "contact") { section.name = "Contact · composant"; section.children = [createElement("heading"), createElement("paragraph"), createElement("form")]; (section.children[0].props as { text: string }).text = "Lancer la conversation."; }
    if (kind === "gallery") { section.name = "Galerie · composant"; const grid = createElement("grid"); grid.children = [createElement("image"), createElement("image"), createElement("image"), createElement("image")]; section.children = [createElement("heading"), grid]; (section.children[0].props as { text: string }).text = "Une sélection visuelle à raconter."; }
    if (kind === "faq") { section.name = "FAQ · composant"; section.children = [createElement("heading"), ...["Première question", "Deuxième question", "Troisième question"].map((title) => { const card = createElement("card"); card.props = { ...card.props, title, text: "Rédigez ici une réponse claire et vérifiée." }; return card; })]; (section.children[0].props as { text: string }).text = "Les réponses essentielles, au bon endroit."; }
    if (kind === "testimonials") { section.name = "Témoignages · à compléter"; const first = createElement("card"); const second = createElement("card"); first.props = { ...first.props, title: "Citation réelle à ajouter", text: "Remplacez ce bloc par une citation autorisée de votre client." }; second.props = { ...second.props, title: "Avis vérifié à ajouter", text: "Ajoutez uniquement un retour authentique, avec l’accord de son auteur." }; section.children = [createElement("heading"), createElement("paragraph"), first, second]; (section.children[0].props as { text: string }).text = "Les voix de vos clients, avec leur accord."; (section.children[1].props as { text: string }).text = "Ajoutez des citations authentiques et vérifiables pour donner du contexte à votre offre."; }
    if (kind === "pricing") { section.name = "Tarification · composant"; const grid = createElement("grid"); grid.children = ["Essentiel", "Pro", "Sur mesure"].map((title) => { const card = createElement("card"); card.props = { ...card.props, title, text: "Décrivez ici cette offre et ses conditions." }; return card; }); section.children = [createElement("heading"), grid]; (section.children[0].props as { text: string }).text = "Des offres simples à comparer."; }
    commit([...tree, section]); setSelectedId(section.id); toast.success("Composant ajouté au canevas.");
  }
  function updateSelectedNode(update: (node: ElementNode) => ElementNode) { if (!selected) return; commit(updateNode(tree, selected.id, update)); }
  function patchSelectedStyles(styles: StyleMap) { if (!selected) return; updateSelectedNode((node) => patchNodeStyle(node, styles, device)); }
  function changeSelectedProp(key: string, value: string) { updateSelectedNode((node) => ({ ...node, props: { ...node.props, [key]: key === "links" ? value.split(",").map((item) => item.trim()).filter(Boolean) : key === "columns" ? Math.max(1, Math.min(6, Number(value) || 1)) : key === "controls" ? value === "true" : key === "level" ? Math.max(1, Math.min(3, Number(value) || 2)) : value } })); }
  function handleImageUpload(file?: File) { if (!file || !selected) return; const targetId = selected.id; if (!file.type.startsWith("image/")) { toast.error("Choisissez un fichier image."); return; } if (file.size > 5 * 1024 * 1024) { toast.error("Choisissez une image de 5 Mo maximum."); return; } const reader = new FileReader(); reader.onload = () => uploadImage.mutate({ name: file.name, kind: "image", contentType: file.type, dataUrl: String(reader.result) }, { onSuccess: (asset) => { commit(applyUploadedImage(treeRef.current, targetId, asset.url)); toast.success("Image importée."); } }); reader.readAsDataURL(file); }
  function undo() { const result = applyHistoryAction({ history, index: historyIndexRef.current }, { type: "undo" }); if (!result) return; treeRef.current = result.next; historyIndexRef.current = result.index; setTree(result.next); setHistoryIndex(result.index); setSaveStatus(result.saveStatus); }
  function redo() { const result = applyHistoryAction({ history, index: historyIndexRef.current }, { type: "redo" }); if (!result) return; treeRef.current = result.next; historyIndexRef.current = result.index; setTree(result.next); setHistoryIndex(result.index); setSaveStatus(result.saveStatus); }
  function saveNow() { if (!currentPage) return; setSaveStatus(nextSaveStatus("request")); savePage.mutate({ pageId: currentPage.id, elementTree: tree }); }
  function publishNow() { if (!currentPage) return; savePage.mutate({ pageId: currentPage.id, elementTree: tree }, { onSuccess: () => publishSite.mutate({ siteId }) }); }

  if (siteQuery.isLoading) return <div className="grid min-h-screen place-items-center bg-[#F8F8FC]"><div className="text-center"><div className="siteflow-loader mx-auto" /><p className="mt-4 text-xs font-semibold text-[#717487]">Chargement de votre éditeur…</p></div></div>;
  if (needsSiteRecovery) return <div className="grid min-h-screen place-items-center bg-[#F8F8FC] px-5"><div className="max-w-sm text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#FFF2E9] text-[#A85E31]"><CircleHelp className="h-6 w-6" /></span><h1 className="mt-5 font-display text-3xl">Impossible de charger ce projet.</h1><p className="mt-2 text-sm leading-6 text-[#717487]">{accessibleSitesQuery.isLoading ? "Recherche de votre dernier projet accessible…" : "Le projet n’a pas pu être récupéré. Vérifiez votre connexion puis réessayez."}</p><div className="mt-5 flex justify-center gap-3"><button className="siteflow-secondary-btn" onClick={() => setLocation("/")}>Retour</button><button className="siteflow-primary-btn" onClick={() => siteQuery.refetch()}>Réessayer</button></div></div></div>;
  if (!siteQuery.data || !currentPage) return <div className="grid min-h-screen place-items-center bg-[#F8F8FC]"><div className="text-center"><h1 className="font-display text-4xl">Projet introuvable.</h1><button className="siteflow-primary-btn mt-4" onClick={() => setLocation("/")}>Retour aux sites</button></div></div>;
  const site = siteQuery.data.site;
  const page = currentPage;
  const sitePages = siteQuery.data.pages;
  const canvasBaseWidth = getCanvasBaseWidth(device);
  const canvasWidth = isEditorNarrow ? "100%" : canvasBaseWidth + "px";

  function renderPanelContent() {
    return <>
      {activePanel === "add" && <AddPanel onAdd={addElement} onAddSection={addSectionPreset} />}
      {activePanel === "components" && <ComponentsPanel onAdd={addComponent} />}
      {activePanel === "pages" && <PagesPanel pages={sitePages} currentPageId={page.id} onSelect={(pageId) => { pageHydrated.current = null; setCurrentPageId(pageId); closeMobilePanel(); }} onAdd={() => { const name = window.prompt("Nom de la nouvelle page", "Nouvelle page"); if (name) createPage.mutate({ siteId, name }); }} onDelete={(pageId) => window.confirm("Supprimer cette page ?") && removePage.mutate({ pageId })} onUpdateSlug={(slug: string) => savePage.mutate({ pageId: page.id, slug })} onUpdateSettings={(settings) => savePage.mutate({ pageId: page.id, settings })} currentPage={page} />}
      {activePanel === "layers" && <LayersPanel nodes={tree} selectedId={selectedId} onSelect={(id) => { setSelectedId(id); setInspectorTab("content"); closeMobilePanel(); }} onToggle={(id, key) => { const node = findNode(tree, id); if (node) commit(updateNode(tree, id, (item) => ({ ...item, [key]: !item[key] }))); }} onDelete={(id) => { commit(removeNode(tree, id)); setSelectedId(null); }} onDuplicate={(id) => commit(duplicateNode(tree, id))} onMove={(id, direction) => commit(reorderSibling(tree, id, direction))} onDrop={(draggedId, targetId) => commit(moveNodeBefore(tree, draggedId, targetId))} onRename={(id, name) => commit(updateNode(tree, id, (node) => ({ ...node, name })))} />}
      {activePanel === "theme" && <ThemePanel theme={site.theme} onUpdate={(theme) => updateSite.mutate({ siteId, theme })} />}
      {activePanel === "assets" && <AssetsPanel siteId={siteId} />}
      {activePanel === "cms" && <CmsPanel siteId={siteId} />}
      {activePanel === "forms" && <FormsPanel siteId={siteId} />}
      {activePanel === "seo" && <SeoPanel page={page} onSave={(settings) => savePage.mutate({ pageId: page.id, settings })} />}
      {activePanel === "analytics" && <AnalyticsPanel />}
      {activePanel === "settings" && <SettingsPanel siteName={site.name} siteId={siteId} onRename={(name) => updateSite.mutate({ siteId, name })} />}
    </>;
  }

  function renderMobileInspector() {
    if (!selected) return null;
    return <div className="siteflow-mobile-sheet-backdrop" onClick={() => setMobilePropertiesOpen(false)}><section className="siteflow-mobile-sheet" onClick={(event) => event.stopPropagation()}><div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#7074D7]">Propriétés</p><h3 className="mt-1 text-sm font-extrabold">{selected.name}</h3></div><button onClick={() => setMobilePropertiesOpen(false)} className="siteflow-icon-btn" aria-label="Fermer les propriétés"><X className="h-4 w-4" /></button></div><div className="flex border-b border-[#E6E6ED]">{([{ id: "content", label: "Contenu" }, { id: "design", label: "Design" }, { id: "layout", label: "Layout" }, { id: "responsive", label: "Resp." }, { id: "animation", label: "Anim." }] as const).map((item) => <button key={item.id} onClick={() => setInspectorTab(item.id)} className={"flex-1 border-b-2 px-1 py-2 text-[10px] font-extrabold " + (inspectorTab === item.id ? "border-[#2925D8] text-[#2925D8]" : "border-transparent text-[#878A9A]")}>{item.label}</button>)}</div><div className="max-h-[58vh] overflow-y-auto pt-4">{inspectorTab === "content" ? <ContentFields node={selected} device={device} onChange={changeSelectedProp} onStyles={patchSelectedStyles} onUpload={handleImageUpload} uploading={uploadImage.isPending} /> : null}{inspectorTab === "design" ? <DesignFields node={selected} device={device} onStyles={patchSelectedStyles} /> : null}{inspectorTab === "layout" ? <LayoutFields node={selected} device={device} onStyles={patchSelectedStyles} /> : null}{inspectorTab === "responsive" ? <ResponsiveFields node={selected} device={device} onStyles={patchSelectedStyles} /> : null}{inspectorTab === "animation" ? <AnimationFields node={selected} device={device} onChange={changeSelectedProp} /> : null}</div></section></div>;
  }

  return <div className="siteflow-editor min-h-screen bg-[#F6F6FA] text-[#11172B]">
    <header className="siteflow-editor-header">
      <div className="flex min-w-0 items-center gap-5"><div className="siteflow-mobile-editor-leading"><button className="siteflow-panel-toggle" onClick={() => setLocation("/")} aria-label="Retour aux sites"><ChevronLeft className="h-4 w-4" /></button><SiteFlowLogo compact /><span>{site.name}</span></div><button className="siteflow-panel-toggle hidden md:grid" onClick={() => setLeftPanelOpen((value) => !value)} aria-label={leftPanelOpen ? "Réduire le panneau de gauche" : "Afficher le panneau de gauche"} aria-expanded={leftPanelOpen}><PanelLeftClose className="h-4 w-4" /></button><RouterLink href="/" className="hidden xl:block"><SiteFlowLogo /></RouterLink><div className="hidden h-7 border-l border-[#DDDDE8] xl:block" /><div className="min-w-0"><div className="flex items-center gap-2"><button onClick={() => openPanel("settings")} className="truncate text-sm font-extrabold hover:text-[#2925D8]">{site.name}</button><ChevronDown className="h-3.5 w-3.5 text-[#777A8E]" /></div><span className={"mt-0.5 block text-[11px] font-semibold " + (saveStatus === "saved" ? "text-[#488261]" : saveStatus === "saving" ? "text-[#887132]" : "text-[#AB5560]")}>{saveStatus === "saved" ? "Enregistré à l’instant" : saveStatus === "saving" ? "Sauvegarde…" : "Modifications à enregistrer"}</span></div></div>
      <div className="siteflow-editor-mode-controls hidden items-center gap-1 md:flex"><button className="siteflow-icon-btn" onClick={undo} disabled={historyIndex <= 0} aria-label="Annuler"><Undo2 className="h-4 w-4" /></button><button className="siteflow-icon-btn" onClick={redo} disabled={historyIndex >= history.length - 1} aria-label="Rétablir"><Redo2 className="h-4 w-4" /></button><span className="mx-2 h-5 border-l border-[#E0E0EB]" />{(["desktop", "tablet", "mobile"] as DeviceMode[]).map((item) => { const Icon = deviceIcon(item); return <button key={item} onClick={() => setDevice(item)} className={"siteflow-icon-btn " + (device === item ? "siteflow-icon-btn-active" : "")} aria-label={"Passer en vue " + item}><Icon className="h-4 w-4" /></button> })}<span className="mx-2 h-5 border-l border-[#E0E0EB]" /><button onClick={fitCanvas} className="flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-bold hover:bg-[#F0F0F5]" aria-label="Ajuster le canevas">{zoom}%<ChevronDown className="h-3.5 w-3.5" /></button><button onClick={zoomOut} className="siteflow-icon-btn" aria-label="Réduire le zoom">−</button><button onClick={zoomIn} className="siteflow-icon-btn" aria-label="Augmenter le zoom">+</button></div>
      <div className="flex items-center gap-2"><button className="siteflow-panel-toggle siteflow-inspector-toggle hidden md:grid" onClick={() => setInspectorOpen((value) => !value)} aria-label={inspectorOpen ? "Réduire l’inspecteur" : "Afficher l’inspecteur"} aria-expanded={inspectorOpen}><PanelLeftClose className="h-4 w-4 rotate-180" /></button><button onClick={saveNow} className="hidden rounded-lg px-3 py-2 text-xs font-bold text-[#555970] hover:bg-[#EFEFF5] sm:block">Sauvegarder</button><button onClick={() => setLocation("/preview/" + siteId)} className="siteflow-secondary-btn !px-3 !py-2 text-xs"><Eye className="h-3.5 w-3.5" />Aperçu</button><button onClick={() => setPublishOpen(true)} className="siteflow-primary-btn !px-3 !py-2 text-xs"><Rocket className="h-3.5 w-3.5" />Publier</button></div>
    </header>
    <div className="siteflow-editor-content flex min-h-[calc(100vh-69px)]">
      <aside className={"siteflow-editor-rail " + (leftPanelOpen ? "" : "is-collapsed")} aria-label="Outils de création"><div className="flex flex-1 flex-col gap-3 py-4">{toolGroups.map((group) => <div key={group.label} className="space-y-1">{group.items.map((item) => <button key={item.panel} onClick={() => openPanel(item.panel)} className={"siteflow-rail-btn " + (activePanel === item.panel ? "siteflow-rail-btn-active" : "")} title={item.title} aria-label={item.title}><item.icon className="h-[19px] w-[19px]" /></button>)}</div>)}</div><button className="siteflow-rail-btn mb-4" title="Aide" aria-label="Aide"><CircleHelp className="h-5 w-5" /></button></aside>
      <aside className={"siteflow-editor-panel " + (leftPanelOpen ? "" : "is-collapsed")} aria-label="Panneau de travail">{!isEditorNarrow ? renderPanelContent() : null}</aside>
      <main ref={canvasWrapRef} className="siteflow-canvas-wrap"><div className="siteflow-canvas-utility"><button onClick={zoomOut} className="siteflow-icon-btn" aria-label="Réduire le zoom">−</button><span aria-live="polite">{zoom}%</span><button onClick={zoomIn} className="siteflow-icon-btn" aria-label="Augmenter le zoom">+</button><button onClick={fitCanvas} className="siteflow-icon-btn" aria-label="Ajuster le canevas"><Maximize2 className="h-4 w-4" /></button></div><div className="siteflow-canvas-toolbar siteflow-mobile-nav md:hidden"><button onClick={() => openPanel("add")}><Plus className="h-4 w-4" />Add</button><button onClick={() => openPanel("pages")}><FileText className="h-4 w-4" />Pages</button><button onClick={() => openPanel("layers")}><Layers3 className="h-4 w-4" />Layers</button><button onClick={() => openPanel("theme")}><Palette className="h-4 w-4" />Design</button><button onClick={() => openPanel("settings")}><MoreHorizontal className="h-4 w-4" />More</button></div><div className="siteflow-canvas-stage"><div className="siteflow-canvas-zoom" style={{ width: canvasWidth, zoom: zoom / 100 }}><div className="siteflow-document" onClick={() => setSelectedId(null)}><SiteRenderer nodes={tree} theme={site.theme} device={device} editable selectedId={selectedId} onSelect={selectNode} onResize={(node, width) => updateSelectedNode((item) => item.id === node.id ? patchNodeStyle(item, { width: width + "px" }, device) : item)} onMove={(node, delta) => updateSelectedNode((item) => item.id === node.id ? patchNodeStyle(item, { marginLeft: ((parseInt(String(item.styles.marginLeft ?? 0), 10) || 0) + delta.x) + "px", marginTop: ((parseInt(String(item.styles.marginTop ?? 0), 10) || 0) + delta.y) + "px" }, device) : item)} /></div></div></div></main>
      <aside className={"siteflow-inspector " + (inspectorOpen ? "" : "is-collapsed")} aria-label="Inspecteur de propriétés">{!isEditorNarrow ? <Inspector node={selected} device={device} tab={inspectorTab} onTab={setInspectorTab} onChangeProp={changeSelectedProp} onStyles={patchSelectedStyles} onUpload={handleImageUpload} uploading={uploadImage.isPending} onRename={(name) => updateSelectedNode((item) => ({ ...item, name }))} onDelete={() => { if (selected) { commit(removeNode(tree, selected.id)); setSelectedId(null); } }} onDuplicate={() => selected && commit(duplicateNode(tree, selected.id))} onClose={() => setInspectorOpen(false)} /> : null}</aside>
    </div>
    {isEditorNarrow && mobilePanel ? <div className="siteflow-mobile-sheet-backdrop" onClick={closeMobilePanel}><section className="siteflow-mobile-panel" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-[#E6E6ED] px-4 py-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#7074D7]">Éditeur</p><h2 className="mt-1 text-sm font-extrabold">{toolGroups.flatMap((group) => group.items).find((item) => item.panel === mobilePanel)?.title ?? "Panneau"}</h2></div><button className="siteflow-icon-btn" onClick={closeMobilePanel} aria-label="Fermer le panneau"><X className="h-4 w-4" /></button></div><div className="max-h-[75vh] overflow-y-auto">{renderPanelContent()}</div></section></div> : null}
    {publishOpen ? <PublishDialog site={site} pages={siteQuery.data.pages} onClose={() => setPublishOpen(false)} onPublish={publishNow} loading={publishSite.isPending || savePage.isPending} /> : null}
    {publishResult ? <PublishResult slug={siteQuery.data.site.slug} onClose={() => setPublishResult(false)} /> : null}
    {selected ? <div className="siteflow-mobile-properties md:hidden"><div><span className="block text-[10px] font-extrabold uppercase tracking-[.12em] text-[#6D70D8]">Élément sélectionné</span><strong className="mt-0.5 block text-xs">{selected.name}</strong></div><button onClick={() => { setInspectorTab("content"); setMobilePropertiesOpen(true); }} className="siteflow-secondary-btn !px-3 !py-2 text-[11px]" aria-label="Ouvrir les propriétés">Propriétés</button></div> : null}
    {isEditorNarrow && selected && mobilePropertiesOpen ? renderMobileInspector() : null}
  </div>;
}
function AddPanel({ onAdd, onAddSection }: { onAdd: (type: ElementType) => void; onAddSection: () => void }) { const [query, setQuery] = useState(""); const normalized = query.trim().toLowerCase(); return <PanelShell title="Ajouter des éléments" subtitle="Composez votre page à partir d’éléments et de structures."><label className="siteflow-search mb-6"><Search className="h-4 w-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher des composants…" /></label><button onClick={onAddSection} className="mb-6 flex w-full items-center gap-3 rounded-lg border border-[#CFCFF5] bg-[#F7F7FF] p-3 text-left"><span className="grid h-9 w-9 place-items-center rounded-md bg-[#2925D8] text-white"><Wand2 className="h-4 w-4" /></span><span><strong className="block text-xs">Ajouter une section</strong><small className="block pt-0.5 text-[11px] text-[#676BD0]">Un bloc déjà structuré.</small></span></button>{elementGroups.map((group) => { const elements = group.elements.filter((element) => !normalized || `${elementLabels[element]} ${element}`.toLowerCase().includes(normalized)); return elements.length ? <div key={group.label} className="mb-6"><p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#687082]">{group.label}</p><div className="grid grid-cols-2 gap-2">{elements.map((element) => <button key={element} onClick={() => onAdd(element)} className="siteflow-element-tile"><span className="mx-auto grid h-8 w-8 place-items-center rounded-md bg-[#F5F6FA] text-[#41485A]">{element === "heading" ? "T" : element === "paragraph" ? "≡" : element === "button" ? "↗" : element === "image" ? "◉" : element === "icon" ? "✦" : element === "video" ? "▶" : element === "link" ? "↗" : element === "grid" || element === "columns" ? "▦" : element === "stack" ? "☷" : element === "section" ? "▤" : element === "form" ? "⌁" : "—"}</span>{elementLabels[element]}</button>)}</div></div> : null; })}</PanelShell> }
function ComponentsPanel({ onAdd }: { onAdd: (kind: "hero" | "features" | "contact" | "gallery" | "faq" | "testimonials" | "pricing") => void }) { const cards = [{ kind: "hero" as const, title: "Hero éditorial", copy: "Titre, texte et action primaire.", glyph: "Aa" }, { kind: "features" as const, title: "Bénéfices en grille", copy: "Titre et trois cartes de contenu.", glyph: "▦" }, { kind: "contact" as const, title: "Bloc contact", copy: "Introduction et formulaire prêt à l’emploi.", glyph: "⌁" }, { kind: "gallery" as const, title: "Galerie", copy: "Une grille d’images facile à personnaliser.", glyph: "▧" }, { kind: "faq" as const, title: "FAQ", copy: "Questions et réponses structurées.", glyph: "?" }, { kind: "testimonials" as const, title: "Témoignages", copy: "Un cadre à remplir avec des citations autorisées.", glyph: "“" }, { kind: "pricing" as const, title: "Tarification", copy: "Des offres claires, prêtes à éditer.", glyph: "€" }]; return <PanelShell title="Composants" subtitle="Des compositions réutilisables, pas seulement des éléments isolés."><div className="space-y-3">{cards.map((card) => <button key={card.kind} onClick={() => onAdd(card.kind)} className="group w-full rounded-xl border border-[#E3E3EC] bg-white p-3 text-left transition-all hover:-translate-y-0.5 hover:border-[#BDBEE5] hover:shadow-[0_8px_18px_rgba(41,37,216,.08)]"><span className="grid h-12 w-full place-items-center rounded-lg bg-[#F3F3FA] font-display text-2xl text-[#4B4FB7]">{card.glyph}</span><strong className="mt-3 block text-xs">{card.title}</strong><small className="mt-1 block text-[11px] leading-5 text-[#777A8C]">{card.copy}</small><span className="mt-3 inline-flex items-center gap-1 text-[11px] font-extrabold text-[#2925D8]">Ajouter au canevas <Plus className="h-3 w-3" /></span></button>)}</div></PanelShell> }
function PagesPanel({ pages, currentPageId, onSelect, onAdd, onDelete, onUpdateSettings, onUpdateSlug, currentPage }: { pages: Array<{ id: number; name: string; slug: string; isHomepage: boolean; settings: Record<string, unknown> }>; currentPageId: number; onSelect: (id: number) => void; onAdd: () => void; onDelete: (id: number) => void; onUpdateSettings: (settings: Record<string, unknown>) => void; onUpdateSlug: (slug: string) => void; currentPage: { id: number; name: string; slug: string; settings: Record<string, unknown> } }) { return <PanelShell title="Pages" subtitle="Les routes et les paramètres du site."><button onClick={onAdd} className="siteflow-primary-btn mb-5 w-full justify-center !py-2.5 text-xs"><Plus className="h-3.5 w-3.5" />Ajouter une page</button><div className="space-y-1">{pages.map((page) => <div key={page.id} className={`group flex items-center gap-2 rounded-xl border px-3 py-3 ${page.id === currentPageId ? "border-[#CFCFF2] bg-[#F5F5FF]" : "border-transparent hover:bg-[#F5F5F9]"}`}><button onClick={() => onSelect(page.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left"><FileText className="h-4 w-4 text-[#6569D4]" /><span className="min-w-0"><strong className="block truncate text-xs">{page.name}</strong><small className="block truncate text-[10px] text-[#898C9C]">/{page.slug}{page.isHomepage ? " · Accueil" : ""}</small></span></button>{pages.length > 1 ? <button onClick={() => onDelete(page.id)} className="opacity-0 transition-opacity group-hover:opacity-100" aria-label="Supprimer la page"><Trash2 className="h-3.5 w-3.5 text-[#A6555F]" /></button> : null}</div>)}</div><div className="mt-7 border-t border-[#E8E8F0] pt-5"><p className="mb-4 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#8A8D9C]">Réglages de la page</p><label className="siteflow-field"><span>URL</span><input value={currentPage.slug} onChange={(event) => onUpdateSlug(event.target.value)} placeholder="page" /></label><label className="siteflow-field"><span>Titre SEO</span><input value={String(currentPage.settings.title ?? "")} onChange={(event) => onUpdateSettings({ ...currentPage.settings, title: event.target.value })} placeholder="Titre de page" /></label></div></PanelShell> }
function LayersPanel({ nodes, selectedId, onSelect, onToggle, onDelete, onDuplicate, onMove, onDrop, onRename }: { nodes: ElementNode[]; selectedId: string | null; onSelect: (id: string) => void; onToggle: (id: string, key: "visible" | "locked") => void; onDelete: (id: string) => void; onDuplicate: (id: string) => void; onMove: (id: string, direction: "up" | "down") => void; onDrop: (draggedId: string, targetId: string) => void; onRename: (id: string, name: string) => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => Object.fromEntries(nodes.filter((node) => node.children.length).map((node) => [node.id, true])));
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const render = (items: ElementNode[], depth = 0) => items.map((node) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded[node.id] ?? true;
    return <div key={node.id} className="siteflow-layer-tree-item"><div className={"siteflow-layer-row group flex items-center gap-1 rounded-lg py-1.5 pr-1 " + (selectedId === node.id ? "bg-[#F1F1FF]" : "hover:bg-[#F7F7FA]")} style={{ paddingLeft: 8 + depth * 16 }} draggable onDragStart={(event) => { setDraggedId(node.id); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", node.id); }} onDragEnd={() => setDraggedId(null)} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }} onDrop={(event) => { event.preventDefault(); const sourceId = draggedId ?? event.dataTransfer.getData("text/plain"); if (sourceId) onDrop(sourceId, node.id); setDraggedId(null); }}><button type="button" onClick={() => hasChildren && setExpanded((current) => ({ ...current, [node.id]: !isExpanded }))} className={"grid h-6 w-6 shrink-0 place-items-center rounded text-[#8B8E9D] " + (hasChildren ? "hover:bg-[#E9E9F5]" : "invisible")} aria-label={hasChildren ? (isExpanded ? "Réduire les enfants" : "Développer les enfants") : undefined}>{hasChildren ? <ChevronDown className={"h-3.5 w-3.5 transition-transform " + (isExpanded ? "" : "-rotate-90")} /> : null}</button>{editingId === node.id ? <input autoFocus defaultValue={node.name} onClick={(event) => event.stopPropagation()} onBlur={(event) => { const name = event.currentTarget.value.trim(); if (name && name !== node.name) onRename(node.id, name); setEditingId(null); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") setEditingId(null); }} className="min-w-0 flex-1 rounded border border-[#C9CAF0] bg-white px-1.5 py-1 text-xs outline-none" aria-label="Renommer le calque" /> : <button type="button" onClick={() => onSelect(node.id)} onDoubleClick={() => setEditingId(node.id)} className={"min-w-0 flex-1 truncate text-left text-xs " + (selectedId === node.id ? "font-extrabold text-[#2925D8]" : "text-[#4D5166]")} aria-current={selectedId === node.id ? "true" : undefined}>{node.name}</button>}<div className="siteflow-layer-actions flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"><button type="button" onClick={() => onMove(node.id, "up")} className="siteflow-icon-btn !h-6 !w-6" aria-label={"Monter " + node.name}><ArrowUp className="h-3 w-3" /></button><button type="button" onClick={() => onMove(node.id, "down")} className="siteflow-icon-btn !h-6 !w-6" aria-label={"Descendre " + node.name}><ArrowDown className="h-3 w-3" /></button><button type="button" onClick={() => onToggle(node.id, "visible")} className="siteflow-icon-btn !h-6 !w-6" aria-label={node.visible ? "Masquer " + node.name : "Afficher " + node.name}><Eye className={"h-3 w-3 " + (node.visible ? "" : "text-[#AA5260]")} /></button><button type="button" onClick={() => onToggle(node.id, "locked")} className="siteflow-icon-btn !h-6 !w-6" aria-label={node.locked ? "Déverrouiller " + node.name : "Verrouiller " + node.name}><Lock className={"h-3 w-3 " + (node.locked ? "text-[#2925D8]" : "text-[#A1A4B1]")} /></button><button type="button" onClick={() => onDuplicate(node.id)} className="siteflow-icon-btn !h-6 !w-6" aria-label={"Dupliquer " + node.name}><Copy className="h-3 w-3" /></button><button type="button" onClick={() => onDelete(node.id)} className="siteflow-icon-btn !h-6 !w-6 text-[#AA525F]" aria-label={"Supprimer " + node.name}><Trash2 className="h-3 w-3" /></button></div></div>{hasChildren && isExpanded ? <div>{render(node.children, depth + 1)}</div> : null}</div>;
  });
  return <PanelShell title="Calques" subtitle="La hiérarchie réelle de votre page. Faites glisser les éléments pour réordonner la structure."><div className="mb-3 flex items-center justify-between rounded-xl border border-[#E6E6EE] bg-[#FAFAFC] px-3 py-2"><span className="text-[10px] font-bold uppercase tracking-[.1em] text-[#85889A]">{nodes.length} calque(s) racine</span><span className="text-[10px] text-[#85889A]">Glisser-déposer · double-clic pour renommer</span></div><div className="rounded-xl border border-[#E6E6EE] bg-white p-1">{nodes.length ? render(nodes) : <EmptyPanel icon={Layers3} text="Aucun élément sur cette page." />}</div></PanelShell>;
}

function ThemePanel({ theme, onUpdate }: { theme: SiteTheme; onUpdate: (theme: SiteTheme) => void }) {
  const update = <K extends keyof SiteTheme>(key: K, value: SiteTheme[K]) => onUpdate({ ...theme, [key]: value });
  return <PanelShell title="Thème" subtitle="Une base cohérente pour chaque page et chaque breakpoint.">
    <section>
      <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#8A8D9C]">Couleurs globales</p>
      <div className="grid grid-cols-2 gap-2">
        <ThemeToken label="Primaire" value={theme.primary ?? theme.accent} onChange={(value) => update("primary", value)} />
        <ThemeToken label="Secondaire" value={theme.secondary ?? theme.muted} onChange={(value) => update("secondary", value)} />
        <ThemeToken label="Accent" value={theme.accent} onChange={(value) => update("accent", value)} />
        <ThemeToken label="Surface" value={theme.surface ?? "#FFFFFF"} onChange={(value) => update("surface", value)} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <ThemeToken label="Fond" value={theme.background} onChange={(value) => update("background", value)} />
        <ThemeToken label="Texte" value={theme.text ?? theme.foreground} onChange={(value) => update("text", value)} />
        <ThemeToken label="Muted" value={theme.muted} onChange={(value) => update("muted", value)} />
      </div>
    </section>
    <section className="mt-7 border-t border-[#E8E8F0] pt-5">
      <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#8A8D9C]">Typographie globale</p>
      <div className="space-y-3">
        <label className="siteflow-field"><span>Famille des titres</span><input value={theme.fontDisplay} onChange={(event) => update("fontDisplay", event.target.value)} placeholder="DM Serif Display" /></label>
        <div className="grid grid-cols-3 gap-2">
          <label className="siteflow-field"><span>H1</span><input value={theme.fontH1 ?? "60px"} onChange={(event) => update("fontH1", event.target.value)} /></label>
          <label className="siteflow-field"><span>H2</span><input value={theme.fontH2 ?? "48px"} onChange={(event) => update("fontH2", event.target.value)} /></label>
          <label className="siteflow-field"><span>H3</span><input value={theme.fontH3 ?? "30px"} onChange={(event) => update("fontH3", event.target.value)} /></label>
        </div>
        <label className="siteflow-field"><span>Famille du corps</span><input value={theme.fontBody} onChange={(event) => update("fontBody", event.target.value)} placeholder="Plus Jakarta Sans" /></label>
        <div className="grid grid-cols-3 gap-2">
          <label className="siteflow-field"><span>Corps</span><input value={theme.fontBodySize ?? "16px"} onChange={(event) => update("fontBodySize", event.target.value)} /></label>
          <label className="siteflow-field"><span>Petit</span><input value={theme.fontSmallSize ?? "12px"} onChange={(event) => update("fontSmallSize", event.target.value)} /></label>
          <label className="siteflow-field"><span>Boutons</span><input value={theme.fontButtonSize ?? "14px"} onChange={(event) => update("fontButtonSize", event.target.value)} /></label>
        </div>
      </div>
    </section>
    <section className="mt-7 border-t border-[#E8E8F0] pt-5">
      <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#8A8D9C]">Système d’interface</p>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="siteflow-field"><span>Rayon Global</span><input value={theme.radius} onChange={(event) => update("radius", event.target.value)} /></label>
          <label className="siteflow-field"><span>Bordure</span><input value={theme.borderWidth ?? "1px"} onChange={(event) => update("borderWidth", event.target.value)} /></label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="siteflow-field"><span>Rayon Bouton</span><input value={theme.buttonRadius ?? theme.radius} onChange={(event) => update("buttonRadius", event.target.value)} /></label>
          <label className="siteflow-field"><span>Rayon Carte</span><input value={theme.cardRadius ?? theme.radius} onChange={(event) => update("cardRadius", event.target.value)} /></label>
        </div>
        <label className="siteflow-field"><span>Ombre</span><input value={theme.shadow ?? "0 16px 70px rgba(17,20,72,.16)"} onChange={(event) => update("shadow", event.target.value)} /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="siteflow-field"><span>Espacement</span><input value={theme.spacing ?? "16px"} onChange={(event) => update("spacing", event.target.value)} /></label>
          <label className="siteflow-field"><span>Max Largeur</span><input value={theme.containerMaxWidth ?? "1200px"} onChange={(event) => update("containerMaxWidth", event.target.value)} /></label>
        </div>
      </div>
    </section>
  </PanelShell>;
}
function ThemeToken({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="flex items-center justify-between rounded-xl border border-[#E6E6EE] bg-white p-3"><span className="flex items-center gap-2 text-xs font-bold"><i className="h-5 w-5 rounded-md border border-black/10" style={{ background: value }} />{label}</span><input className="h-7 w-8 rounded border-0 bg-transparent p-0" type="color" value={value} onChange={(event) => onChange(event.target.value)} aria-label={`Couleur ${label}`} /></label> }
function AssetsPanel({ siteId }: { siteId: number }) { const utils = trpc.useUtils(); const query = trpc.siteflow.assets.list.useQuery(); const upload = trpc.siteflow.assets.upload.useMutation({ onSuccess: () => { utils.siteflow.assets.list.invalidate(); toast.success("Asset importé dans votre espace."); }, onError: (error) => toast.error(error.message) }); const fallback = ["/manus-storage/template-nexus-saas_c284fccd.png", "/manus-storage/template-canvas-portfolio_56be5412.png", "/manus-storage/template-atelier-restaurant_a7a3c5f0.png", "/manus-storage/template-arc-real-estate_e312de0e.png"]; const assets = query.data?.length ? query.data.map((asset) => asset.url) : fallback; function handleFile(file?: File) { if (!file) return; if (file.size > 5 * 1024 * 1024) { toast.error("Choisissez un fichier de 5 Mo maximum."); return; } const reader = new FileReader(); reader.onload = () => { const kind = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : file.type.includes("svg") ? "svg" : file.type.includes("font") ? "font" : "document"; upload.mutate({ name: file.name, kind, contentType: file.type || "application/octet-stream", dataUrl: String(reader.result) }); }; reader.readAsDataURL(file); } return <PanelShell title="Assets" subtitle="Vos images, fichiers et composants de marque."><label className="siteflow-secondary-btn mb-5 flex w-full justify-center !py-2.5 text-xs"><Upload className="h-3.5 w-3.5" />{upload.isPending ? "Import…" : "Importer un fichier"}<input type="file" className="sr-only" onChange={(event) => handleFile(event.target.files?.[0])} disabled={upload.isPending} /></label><div className="grid grid-cols-2 gap-2">{assets.map((asset) => <img key={asset} src={asset} alt="" className="h-20 w-full rounded-lg border border-[#E3E3EB] object-cover" />)}</div><p className="mt-5 text-xs leading-5 text-[#7A7D8F]">{query.data?.length ?? 0} fichier(s) enregistré(s) dans votre espace. Formats image, vidéo, SVG, police et document, 5 Mo maximum.</p></PanelShell> }
function CmsPanel({ siteId }: { siteId: number }) { const utils = trpc.useUtils(); const query = trpc.siteflow.cms.list.useQuery({ siteId }); const mutation = trpc.siteflow.cms.create.useMutation({ onSuccess: () => utils.siteflow.cms.list.invalidate({ siteId }) }); return <PanelShell title="CMS" subtitle="Collections dynamiques et contenu structuré."><button onClick={() => { const name = window.prompt("Nom de la collection", "Articles"); if (name) mutation.mutate({ siteId, name }); }} className="siteflow-primary-btn mb-5 w-full justify-center !py-2.5 text-xs"><Plus className="h-3.5 w-3.5" />Nouvelle collection</button><div className="space-y-2">{(query.data ?? []).map((collection) => <div key={collection.id} className="rounded-xl border border-[#E5E5EE] bg-white p-3"><strong className="block text-xs">{collection.name}</strong><small className="mt-1 block text-[11px] text-[#777A8B]">/{collection.slug} · {collection.schema.length} champs</small></div>)}{!query.data?.length ? <EmptyPanel icon={Database} text="Créez votre première collection, par exemple Articles ou Projets." /> : null}</div></PanelShell> }
function FormsPanel({ siteId }: { siteId: number }) { const utils = trpc.useUtils(); const query = trpc.siteflow.forms.list.useQuery({ siteId }); const mutation = trpc.siteflow.forms.create.useMutation({ onSuccess: () => utils.siteflow.forms.list.invalidate({ siteId }) }); return <PanelShell title="Formulaires" subtitle="Captez les messages depuis vos pages."><button onClick={() => { const name = window.prompt("Nom du formulaire", "Contact"); if (name) mutation.mutate({ siteId, name }); }} className="siteflow-primary-btn mb-5 w-full justify-center !py-2.5 text-xs"><Plus className="h-3.5 w-3.5" />Créer un formulaire</button><div className="space-y-2">{(query.data ?? []).map((form) => <div key={form.id} className="rounded-xl border border-[#E5E5EE] bg-white p-3"><strong className="block text-xs">{form.name}</strong><small className="mt-1 block text-[11px] text-[#777A8B]">{form.fields.length} champs · Aucune soumission</small></div>)}{!query.data?.length ? <EmptyPanel icon={FormInput} text="Les formulaires créés ici pourront être ajoutés à une section depuis l’onglet Ajouter." /> : null}</div></PanelShell> }
function SeoPanel({ page, onSave }: { page: { slug: string; settings: Record<string, unknown> }; onSave: (settings: Record<string, unknown>) => void }) { return <PanelShell title="SEO" subtitle="Rendez votre page nette pour la recherche."><div className="rounded-xl border border-[#DADBF0] bg-[#F6F6FF] p-4"><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#7276D7]">Score préparatoire</p><p className="mt-2 font-display text-5xl text-[#2925D8]">82<span className="text-lg">/100</span></p><p className="mt-2 text-[11px] leading-5 text-[#6C70A0]">Complétez le titre et la description pour améliorer ce score.</p></div><div className="mt-5 space-y-3"><label className="siteflow-field"><span>Titre SEO</span><input value={String(page.settings.title ?? "")} onChange={(event) => onSave({ ...page.settings, title: event.target.value })} /></label><label className="siteflow-field"><span>Description</span><textarea value={String(page.settings.description ?? "")} onChange={(event) => onSave({ ...page.settings, description: event.target.value })} /></label><label className="siteflow-field"><span>URL</span><input value={`/${page.slug}`} readOnly /></label></div></PanelShell> }
function AnalyticsPanel() { return <PanelShell title="Analytics" subtitle="Lecture d’audience · données de démonstration."><div className="grid grid-cols-2 gap-2"><Metric label="Visiteurs" value="1 248" /><Metric label="Vues" value="3 906" /><Metric label="Sessions" value="1 633" /><Metric label="Conv." value="3,8 %" /></div><div className="mt-5 rounded-xl border border-[#E4E4ED] bg-white p-4"><p className="text-xs font-bold">Trafic sur 30 jours</p><div className="mt-5 flex h-24 items-end gap-1.5">{[36, 52, 44, 68, 58, 82, 67, 92, 75, 88, 100, 83].map((height, index) => <span key={index} className="flex-1 rounded-t bg-[#2925D8]/80" style={{ height: `${height}%` }} />)}</div></div><p className="mt-4 text-[11px] leading-5 text-[#85889A]">Ces métriques sont des données de démonstration tant qu’un suivi de production n’est pas connecté.</p></PanelShell> }
function SettingsPanel({ siteName, siteId, onRename }: { siteName: string; siteId: number; onRename: (name: string) => void }) { const [, setLocation] = useLocation(); const utils = trpc.useUtils(); const versions = trpc.siteflow.versions.useQuery({ siteId }); const restore = trpc.siteflow.restoreVersion.useMutation({ onSuccess: (data) => { utils.siteflow.get.setData({ siteId }, data); utils.siteflow.versions.invalidate({ siteId }); toast.success("Version restaurée."); } }); return <PanelShell title="Réglages" subtitle="Contrôlez l’identité et les options du projet."><label className="siteflow-field"><span>Nom du site</span><input defaultValue={siteName} onBlur={(event) => event.target.value.trim() && event.target.value !== siteName && onRename(event.target.value)} /></label><div className="mt-6 space-y-2"><SettingsRow icon={Globe2} label="Domaine" value="siteflow.local" /><SettingsRow icon={ClipboardCopy} label="Identifiant du site" value={`#${siteId}`} /></div><div className="mt-7 border-t border-[#E7E7EF] pt-5"><p className="mb-3 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#8A8D9C]">Historique des versions</p>{versions.data?.length ? <div className="space-y-2">{versions.data.map((version) => <div key={version.id} className="rounded-xl border border-[#E5E5EE] bg-white p-3"><strong className="block text-xs">{version.description}</strong><small className="mt-1 block text-[11px] text-[#818496]">{new Date(version.createdAt).toLocaleString("fr-FR")}</small><div className="mt-2 flex items-center gap-3"><button onClick={() => setLocation(`/preview/${siteId}?version=${version.id}`)} className="text-[11px] font-extrabold text-[#2925D8]">Aperçu de cette version</button><button onClick={() => window.confirm("Restaurer cette version ?") && restore.mutate({ versionId: version.id })} className="text-[11px] font-extrabold text-[#70748A]">Restaurer</button></div></div>)}</div> : <EmptyPanel icon={Archive} text="Une version est enregistrée à chaque publication." />}</div></PanelShell> }
function styleValue(styles: StyleMap, key: string, fallback = "") {
  const value = styles[key];
  return value === undefined || value === null ? fallback : String(value);
}

function colorValue(styles: StyleMap, key: string, fallback: string) {
  const value = styleValue(styles, key, fallback);
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function effectiveStyles(node: ElementNode, device: DeviceMode): StyleMap {
  return device === "desktop" ? node.styles : { ...node.styles, ...(node.responsive[device] ?? {}) };
}

function Inspector({ node, device, tab, onTab, onChangeProp, onStyles, onUpload, uploading, onRename, onDelete, onDuplicate, onClose }: { node?: ElementNode; device: DeviceMode; tab: "content" | "design" | "layout" | "responsive" | "animation"; onTab: (tab: "content" | "design" | "layout" | "responsive" | "animation") => void; onChangeProp: (key: string, value: string) => void; onStyles: (styles: StyleMap) => void; onUpload: (file?: File) => void; uploading: boolean; onRename: (name: string) => void; onDelete: () => void; onDuplicate: () => void; onClose: () => void }) {
  if (!node) return <aside className="siteflow-inspector-empty"><MousePointer2 className="h-6 w-6 text-[#777BD7]" /><h3 className="mt-4 font-display text-2xl">Sélectionnez un élément.</h3><p className="mt-2 text-center text-xs leading-5 text-[#777A8D]">Cliquez dans le canevas pour ouvrir ses propriétés de contenu, design et mise en page.</p></aside>;
  const tabs = [{ id: "content", label: "Contenu" }, { id: "design", label: "Design" }, { id: "layout", label: "Layout" }, { id: "responsive", label: "Resp." }, { id: "animation", label: "Anim." }] as const;
  return <div className="h-full overflow-y-auto"><div className="border-b border-[#E6E6ED] p-5"><div className="flex items-center justify-between"><span className="rounded-md bg-[#F0F0FF] px-2 py-1 text-[10px] font-extrabold uppercase tracking-[.1em] text-[#2925D8]">{elementLabels[node.type]}</span><div className="flex gap-1"><button type="button" onClick={onClose} className="siteflow-icon-btn !h-7 !w-7" aria-label="Réduire l’inspecteur"><PanelLeftClose className="h-3.5 w-3.5 rotate-180" /></button><button type="button" onClick={onDuplicate} className="siteflow-icon-btn !h-7 !w-7" aria-label="Dupliquer"><Copy className="h-3.5 w-3.5" /></button><button type="button" onClick={onDelete} className="siteflow-icon-btn !h-7 !w-7 text-[#AA5260]" aria-label="Supprimer"><Trash2 className="h-3.5 w-3.5" /></button></div></div><input aria-label="Nom de l’élément" value={node.name} onChange={(event) => onRename(event.target.value)} className="mt-3 w-full bg-transparent text-sm font-bold outline-none" /></div><div className="flex border-b border-[#E6E6ED] px-3">{tabs.map((item) => <button type="button" key={item.id} onClick={() => onTab(item.id)} className={"flex-1 border-b-2 px-1 py-3 text-[10px] font-extrabold " + (tab === item.id ? "border-[#2925D8] text-[#2925D8]" : "border-transparent text-[#878A9A]")}>{item.label}</button>)}</div><div className="p-5">{tab === "content" ? <ContentFields node={node} device={device} onChange={onChangeProp} onStyles={onStyles} onUpload={onUpload} uploading={uploading} /> : null}{tab === "design" ? <DesignFields node={node} device={device} onStyles={onStyles} /> : null}{tab === "layout" ? <LayoutFields node={node} device={device} onStyles={onStyles} /> : null}{tab === "responsive" ? <ResponsiveFields node={node} device={device} onStyles={onStyles} /> : null}{tab === "animation" ? <AnimationFields node={node} device={device} onChange={onChangeProp} /> : null}</div></div>;
}

function ContentFields({ node, device, onChange, onStyles, onUpload, uploading }: { node: ElementNode; device: DeviceMode; onChange: (key: string, value: string) => void; onStyles: (styles: StyleMap) => void; onUpload: (file?: File) => void; uploading: boolean }) {
  if (node.type === "heading") return <div className="space-y-3"><label className="siteflow-field"><span>Texte</span><textarea value={String(node.props.text ?? "")} onChange={(event) => onChange("text", event.target.value)} /></label><label className="siteflow-field"><span>Niveau</span><select value={String(node.props.level ?? 2)} onChange={(event) => onChange("level", event.target.value)}><option value="1">H1 · titre principal</option><option value="2">H2 · section</option><option value="3">H3 · sous-section</option></select></label><label className="siteflow-field"><span>Lien</span><input value={String(node.props.href ?? "")} onChange={(event) => onChange("href", event.target.value)} placeholder="https://… ou #contact" /></label><label className="siteflow-field"><span>Espacement des lettres</span><input value={styleValue(effectiveStyles(node, device), "letterSpacing")} onChange={(event) => onStyles({ letterSpacing: event.target.value })} placeholder="0em" /></label></div>;
  if (node.type === "paragraph") return <div className="space-y-3"><label className="siteflow-field"><span>Texte</span><textarea value={String(node.props.text ?? "")} onChange={(event) => onChange("text", event.target.value)} /></label><label className="siteflow-field"><span>Lien</span><input value={String(node.props.href ?? "")} onChange={(event) => onChange("href", event.target.value)} placeholder="https://… ou #contact" /></label><label className="siteflow-field"><span>Espacement des lettres</span><input value={styleValue(effectiveStyles(node, device), "letterSpacing")} onChange={(event) => onStyles({ letterSpacing: event.target.value })} placeholder="0em" /></label></div>;
  if (node.type === "button") return <div className="space-y-3"><label className="siteflow-field"><span>Libellé</span><input value={String(node.props.label ?? "")} onChange={(event) => onChange("label", event.target.value)} /></label><label className="siteflow-field"><span>Lien</span><input value={String(node.props.href ?? "")} onChange={(event) => onChange("href", event.target.value)} placeholder="https://… ou #contact" /></label><label className="siteflow-field"><span>Icône</span><input value={String(node.props.icon ?? "")} onChange={(event) => onChange("icon", event.target.value)} placeholder="Symbole ou URL SVG" /></label><label className="siteflow-field"><span>Taille</span><select value={String(node.props.size ?? "md")} onChange={(event) => onChange("size", event.target.value)}><option value="sm">Petit</option><option value="md">Moyen</option><option value="lg">Large</option></select></label></div>;
  if (node.type === "image") return <div className="space-y-3"><label className="siteflow-secondary-btn flex w-full cursor-pointer justify-center !py-2.5 text-xs"><Upload className="h-3.5 w-3.5" />{uploading ? "Import…" : "Importer une image"}<input type="file" accept="image/*" className="sr-only" onChange={(event) => onUpload(event.target.files?.[0])} disabled={uploading} /></label><label className="siteflow-field"><span>URL de l’image</span><input value={String(node.props.src ?? "")} onChange={(event) => onChange("src", event.target.value)} /></label><label className="siteflow-field"><span>Texte alternatif</span><input value={String(node.props.alt ?? "")} onChange={(event) => onChange("alt", event.target.value)} /></label><label className="siteflow-field"><span>Lien</span><input value={String(node.props.href ?? "")} onChange={(event) => onChange("href", event.target.value)} placeholder="https://… ou #contact" /></label><label className="siteflow-field"><span>Ajustement</span><select value={styleValue(effectiveStyles(node, device), "objectFit", "cover")} onChange={(event) => onStyles({ objectFit: event.target.value })}><option value="cover">Recadrer (cover)</option><option value="contain">Contenir (contain)</option><option value="fill">Étirer (fill)</option></select></label><label className="siteflow-field"><span>Position</span><select value={styleValue(effectiveStyles(node, device), "objectPosition", "center")} onChange={(event) => onStyles({ objectPosition: event.target.value })}><option value="top">Haut</option><option value="center">Centre</option><option value="bottom">Bas</option><option value="left">Gauche</option><option value="right">Droite</option></select></label><label className="siteflow-field"><span>Recadrage</span><select value={styleValue(effectiveStyles(node, device), "aspectRatio", "auto")} onChange={(event) => onStyles({ aspectRatio: event.target.value })}><option value="auto">Original</option><option value="1 / 1">Carré · 1:1</option><option value="4 / 3">Paysage · 4:3</option><option value="16 / 9">Cinéma · 16:9</option><option value="3 / 4">Portrait · 3:4</option></select></label></div>;
  if (node.type === "icon") return <div className="space-y-3"><label className="siteflow-field"><span>Symbole</span><input value={String(node.props.symbol ?? "✦")} onChange={(event) => onChange("symbol", event.target.value)} maxLength={4} /></label><label className="siteflow-field"><span>Libellé accessible</span><input value={String(node.props.label ?? "Icône")} onChange={(event) => onChange("label", event.target.value)} /></label></div>;
  if (node.type === "video") return <div className="space-y-3"><label className="siteflow-field"><span>URL de la vidéo</span><input value={String(node.props.src ?? "")} onChange={(event) => onChange("src", event.target.value)} placeholder="https://…/video.mp4" /></label><label className="siteflow-field"><span>Poster</span><input value={String(node.props.poster ?? "")} onChange={(event) => onChange("poster", event.target.value)} placeholder="https://…/poster.jpg" /></label><label className="flex items-center justify-between rounded-lg border border-[#E5E5EE] px-3 py-2 text-xs font-bold"><span>Afficher les contrôles</span><input type="checkbox" checked={node.props.controls !== false} onChange={(event) => onChange("controls", event.target.checked ? "true" : "false")} /></label></div>;
  if (node.type === "link") return <div className="space-y-3"><label className="siteflow-field"><span>Libellé</span><input value={String(node.props.label ?? "En savoir plus")} onChange={(event) => onChange("label", event.target.value)} /></label><label className="siteflow-field"><span>Lien</span><input value={String(node.props.href ?? "#")} onChange={(event) => onChange("href", event.target.value)} placeholder="https://… ou #contact" /></label></div>;
  if (node.type === "columns") return <label className="siteflow-field"><span>Nombre de colonnes</span><input type="number" min={1} max={6} value={Number(node.props.columns ?? 2)} onChange={(event) => { const columns = Math.max(1, Math.min(6, Number(event.target.value) || 1)); onChange("columns", String(columns)); onStyles({ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }); }} /></label>;
  if (node.type === "stack") return <div className="space-y-3"><label className="siteflow-field"><span>Direction</span><select value={String(node.props.direction ?? "vertical")} onChange={(event) => { onChange("direction", event.target.value); onStyles({ flexDirection: event.target.value }); }}><option value="vertical">Verticale</option><option value="horizontal">Horizontale</option></select></label><label className="siteflow-field"><span>Espacement</span><input value={String(node.props.gap ?? "16px")} onChange={(event) => { onChange("gap", event.target.value); onStyles({ gap: event.target.value }); }} /></label></div>;
  if (node.type === "card") return <div className="space-y-3"><label className="siteflow-field"><span>Titre</span><input value={String(node.props.title ?? "")} onChange={(event) => onChange("title", event.target.value)} /></label><label className="siteflow-field"><span>Description</span><textarea value={String(node.props.text ?? "")} onChange={(event) => onChange("text", event.target.value)} /></label></div>;
  if (node.type === "navbar") return <div className="space-y-3"><label className="siteflow-field"><span>Marque</span><input value={String(node.props.brand ?? "")} onChange={(event) => onChange("brand", event.target.value)} /></label><label className="siteflow-field"><span>Liens</span><input value={((node.props.links as string[]) ?? []).join(", ")} onChange={(event) => onChange("links", event.target.value)} placeholder="Accueil, À propos, Contact" /></label></div>;
  if (node.type === "footer") return <label className="siteflow-field"><span>Texte du pied de page</span><textarea value={String(node.props.text ?? "")} onChange={(event) => onChange("text", event.target.value)} /></label>;
  if (node.type === "form") return <div className="space-y-3"><label className="siteflow-field"><span>Titre</span><input value={String(node.props.title ?? "")} onChange={(event) => onChange("title", event.target.value)} /></label><label className="siteflow-field"><span>Libellé du bouton</span><input value={String(node.props.button ?? "")} onChange={(event) => onChange("button", event.target.value)} /></label></div>;
  return <div className="rounded-xl border border-[#E5E5EE] bg-[#FAFAFC] p-4 text-xs leading-5 text-[#777A8C]">Cet élément est structurel. Utilisez Design et Layout pour ajuster son rendu.</div>;
}

function AnimationFields({ node, device, onChange }: { node: ElementNode; device: DeviceMode; onChange: (key: string, value: string) => void }) {
  return <div className="space-y-3">
    <label className="siteflow-field"><span>Type d’animation</span><select value={String(node.props.animationType ?? "none")} onChange={(event) => onChange("animationType", event.target.value)}><option value="none">Aucune</option><option value="fade">Fondu (Fade)</option><option value="slide-up">Glisser vers le haut</option><option value="slide-down">Glisser vers le bas</option><option value="scale">Agrandissement (Scale)</option></select></label>
    <label className="siteflow-field"><span>Durée (ms)</span><input type="number" step={100} min={0} value={Number(node.props.animationDuration ?? 400)} onChange={(event) => onChange("animationDuration", event.target.value)} /></label>
    <label className="siteflow-field"><span>Délai (ms)</span><input type="number" step={100} min={0} value={Number(node.props.animationDelay ?? 0)} onChange={(event) => onChange("animationDelay", event.target.value)} /></label>
  </div>;
}

function DesignFields({ node, device, onStyles }: { node: ElementNode; device: DeviceMode; onStyles: (styles: StyleMap) => void }) {
  const styles = effectiveStyles(node, device);
  return <div className="space-y-4"><InspectorGroup title="Typographie"><label className="siteflow-field"><span>Famille</span><select value={styleValue(styles, "fontFamily", "Plus Jakarta Sans")} onChange={(event) => onStyles({ fontFamily: event.target.value })}><option>Plus Jakarta Sans</option><option>DM Serif Display</option><option>Inter</option></select></label><div className="grid grid-cols-2 gap-3"><label className="siteflow-field"><span>Poids</span><select value={styleValue(styles, "fontWeight", "400")} onChange={(event) => onStyles({ fontWeight: event.target.value })}><option value="400">Regular (400)</option><option value="600">Semibold (600)</option><option value="700">Bold (700)</option></select></label><label className="siteflow-field"><span>Taille</span><input value={styleValue(styles, "fontSize")} onChange={(event) => onStyles({ fontSize: event.target.value })} placeholder="48 px" /></label></div><div className="grid grid-cols-2 gap-3"><label className="siteflow-field"><span>Interligne</span><input value={styleValue(styles, "lineHeight")} onChange={(event) => onStyles({ lineHeight: event.target.value })} placeholder="1.2" /></label><label className="siteflow-field"><span>Espacement</span><input value={styleValue(styles, "letterSpacing")} onChange={(event) => onStyles({ letterSpacing: event.target.value })} placeholder="0.02em" /></label></div><div className="grid grid-cols-3 gap-2">{([{ value: "left", label: "Aligner à gauche", icon: AlignLeft }, { value: "center", label: "Centrer", icon: AlignCenter }, { value: "right", label: "Aligner à droite", icon: AlignRight }] as const).map(({ value, label, icon: Icon }) => <button type="button" key={value} onClick={() => onStyles({ textAlign: value })} className={"siteflow-toggle " + (styleValue(styles, "textAlign", "left") === value ? "border-[#9699E5] bg-[#F0F0FF] text-[#2925D8]" : "")} aria-label={label}><Icon className="h-4 w-4" /></button>)}</div></InspectorGroup><InspectorGroup title="Couleurs"><ColorField label="Arrière-plan" value={styleValue(styles, "background", "#F8F8FC")} fallback="#F8F8FC" onChange={(value) => onStyles({ background: value })} /><ColorField label="Texte principal" value={styleValue(styles, "color", "#11172B")} fallback="#11172B" onChange={(value) => onStyles({ color: value })} /><label className="siteflow-field"><span>Bordure</span><input value={styleValue(styles, "border")} onChange={(event) => onStyles({ border: event.target.value })} placeholder="1px solid #E7E7EF" /></label></InspectorGroup><InspectorGroup title="Bordures et ombres"><div className="grid grid-cols-2 gap-3"><label className="siteflow-field"><span>Rayon</span><input value={styleValue(styles, "borderRadius")} onChange={(event) => onStyles({ borderRadius: event.target.value })} placeholder="16px" /></label><label className="siteflow-field"><span>Ombre</span><input value={styleValue(styles, "boxShadow")} onChange={(event) => onStyles({ boxShadow: event.target.value })} placeholder="0 12px 30px #0001" /></label></div></InspectorGroup>{node.type === "button" ? <InspectorGroup title="Interaction"><ColorField label="Fond au survol" value={styleValue(styles, "hoverBackground", colorValue(styles, "background", "#201CB5"))} fallback="#201CB5" onChange={(value) => onStyles({ hoverBackground: value })} /><ColorField label="Texte au survol" value={styleValue(styles, "hoverColor", colorValue(styles, "color", "#FFFFFF"))} fallback="#FFFFFF" onChange={(value) => onStyles({ hoverColor: value })} /></InspectorGroup> : null}</div>;
}

function ColorField({ label, value, fallback, onChange }: { label: string; value: string; fallback: string; onChange: (value: string) => void }) {
  return <label className="siteflow-field"><span>{label}</span><span className="flex gap-2"><input aria-label={label + " picker"} type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : fallback} onChange={(event) => onChange(event.target.value)} /><input aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} placeholder={fallback} /></span></label>;
}

function InspectorGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return <section className="siteflow-inspector-group"><button type="button" className="flex w-full items-center justify-between text-left text-[#283040]" onClick={() => setOpen((value) => !value)} aria-expanded={open}><strong>{title}</strong><ChevronDown className={"h-4 w-4 transition-transform " + (open ? "" : "-rotate-90")} /></button>{open ? <div className="space-y-3 pt-4">{children}</div> : null}</section>;
}

function LayoutFields({ node, device, onStyles }: { node: ElementNode; device: DeviceMode; onStyles: (styles: StyleMap) => void }) {
  const styles = effectiveStyles(node, device);
  return <div className="space-y-4">
    <InspectorGroup title="Dimensions">
      <div className="grid grid-cols-2 gap-3">
        <label className="siteflow-field"><span>Largeur</span><input value={styleValue(styles, "width")} onChange={(event) => onStyles({ width: event.target.value })} placeholder="100%" /></label>
        <label className="siteflow-field"><span>Max Largeur</span><input value={styleValue(styles, "maxWidth")} onChange={(event) => onStyles({ maxWidth: event.target.value })} placeholder="1200px" /></label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="siteflow-field"><span>Hauteur</span><input value={styleValue(styles, "height")} onChange={(event) => onStyles({ height: event.target.value })} placeholder="auto" /></label>
        <label className="siteflow-field"><span>Hauteur min.</span><input value={styleValue(styles, "minHeight")} onChange={(event) => onStyles({ minHeight: event.target.value })} placeholder="180px" /></label>
      </div>
    </InspectorGroup>
    <InspectorGroup title="Espacement">
      <div className="grid grid-cols-2 gap-3">
        <label className="siteflow-field"><span>Padding</span><input value={styleValue(styles, "padding")} onChange={(event) => onStyles({ padding: event.target.value })} placeholder="24px" /></label>
        <label className="siteflow-field"><span>Margin</span><input value={styleValue(styles, "margin")} onChange={(event) => onStyles({ margin: event.target.value })} placeholder="0 auto" /></label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="siteflow-field"><span>Padding Top</span><input value={styleValue(styles, "paddingTop")} onChange={(event) => onStyles({ paddingTop: event.target.value })} /></label>
        <label className="siteflow-field"><span>Padding Bottom</span><input value={styleValue(styles, "paddingBottom")} onChange={(event) => onStyles({ paddingBottom: event.target.value })} /></label>
      </div>
    </InspectorGroup>
    {["grid", "columns", "stack", "section", "container"].includes(node.type) ? (
      <InspectorGroup title="Structure">
        <label className="siteflow-field"><span>Display</span><select value={styleValue(styles, "display", "block")} onChange={(event) => onStyles({ display: event.target.value })}><option value="block">Block</option><option value="flex">Flex</option><option value="grid">Grid</option></select></label>
        {styleValue(styles, "display") === "flex" && (
          <div className="grid grid-cols-2 gap-3">
            <label className="siteflow-field"><span>Direction</span><select value={styleValue(styles, "flexDirection", "row")} onChange={(event) => onStyles({ flexDirection: event.target.value })}><option value="row">Horizontal</option><option value="column">Vertical</option></select></label>
            <label className="siteflow-field"><span>Gap</span><input value={styleValue(styles, "gap")} onChange={(event) => onStyles({ gap: event.target.value })} placeholder="16px" /></label>
          </div>
        )}
        {node.type === "section" && <label className="siteflow-field"><span>Colonnes</span><input type="number" min={1} max={6} value={Number(styles.sectionColumns ?? 1)} onChange={(event) => { const columns = Math.max(1, Math.min(6, Number(event.target.value) || 1)); onStyles({ display: columns > 1 ? "grid" : "block", sectionColumns: columns, gridTemplateColumns: columns > 1 ? `repeat(${columns}, minmax(0, 1fr))` : "none" }); }} /></label>}
      </InspectorGroup>
    ) : null}
  </div>;
}

function ResponsiveFields({ node, device, onStyles }: { node: ElementNode; device: DeviceMode; onStyles: (styles: StyleMap) => void }) {
  const active = device === "desktop" ? "desktop" : device;
  const styles = effectiveStyles(node, device);
  return <div><div className="rounded-xl border border-[#D9DAF0] bg-[#F4F4FF] p-3 text-[11px] leading-5 text-[#6165B7]">Vous modifiez <strong>{active}</strong>. Les ajustements Tablet et Mobile sont enregistrés comme des overrides dédiés.</div><div className="mt-4 space-y-3"><label className="siteflow-field"><span>Largeur</span><input value={styleValue(styles, "width")} onChange={(event) => onStyles({ width: event.target.value })} placeholder="100%" /></label><label className="siteflow-field"><span>Taille de texte</span><input value={styleValue(styles, "fontSize")} onChange={(event) => onStyles({ fontSize: event.target.value })} placeholder="34px" /></label><label className="siteflow-field"><span>Padding</span><input value={styleValue(styles, "padding")} onChange={(event) => onStyles({ padding: event.target.value })} placeholder="28px" /></label></div></div>;
}

function PublishDialog({ site, pages, onClose, onPublish, loading }: { site: { slug: string; status: string }; pages: Array<{ name: string; settings: Record<string, unknown>; elementTree: ElementNode[] }>; onClose: () => void; onPublish: () => void; loading: boolean }) { const checks = [{ label: "Pages", detail: `${pages.length} page(s) prête(s)`, ok: pages.length > 0 }, { label: "Responsive", detail: "Les vues Desktop, Tablet et Mobile sont disponibles", ok: true }, { label: "SEO", detail: "Le titre est défini sur la page d’accueil", ok: Boolean(pages[0]?.settings.title) }, { label: "Images", detail: "Les visuels de votre template sont intégrés", ok: true }, { label: "Liens", detail: "Les liens de navigation sont vérifiés", ok: true }]; return <div className="siteflow-modal-backdrop"><section className="siteflow-dialog max-w-[560px]"><header className="flex justify-between border-b border-[#ECECF2] px-7 py-6"><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#6D70D8]">Prêt à publier</p><h2 className="mt-1 font-display text-[32px]">Votre checklist finale.</h2></div><button onClick={onClose} className="siteflow-icon-btn"><X className="h-4 w-4" /></button></header><div className="space-y-3 p-7">{checks.map((check) => <div key={check.label} className="flex items-center gap-3 rounded-xl border border-[#E6E6EE] bg-[#FAFAFC] p-4"><span className={`grid h-7 w-7 place-items-center rounded-full ${check.ok ? "bg-[#E8F6ED] text-[#287348]" : "bg-[#FFF1E5] text-[#AE6C28]"}`}>{check.ok ? <Check className="h-4 w-4" /> : "!"}</span><span><strong className="block text-xs">{check.label}</strong><small className="mt-0.5 block text-[11px] text-[#74778A]">{check.detail}</small></span></div>)}</div><footer className="flex justify-end gap-3 border-t border-[#ECECF2] px-7 py-5"><button onClick={onClose} className="siteflow-secondary-btn">Pas maintenant</button><button onClick={onPublish} disabled={loading} className="siteflow-primary-btn disabled:opacity-50"><Rocket className="h-4 w-4" />{loading ? "Publication…" : "Publier le site"}</button></footer></section></div> }
function PublishResult({ slug, onClose }: { slug: string; onClose: () => void }) { const url = `${window.location.origin}/s/${slug}`; return <div className="siteflow-modal-backdrop"><section className="siteflow-dialog max-w-[510px] p-9 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#E8F7ED] text-[#2D7A4A]"><Check className="h-7 w-7" /></span><h2 className="mt-5 font-display text-[34px]">Votre site est en ligne.</h2><p className="mt-2 text-sm leading-6 text-[#717487]">Le même arbre de pages est maintenant disponible en version publique.</p><div className="mt-6 flex items-center gap-2 rounded-xl border border-[#E2E3ED] bg-[#FAFAFC] p-3 text-left"><Globe2 className="h-4 w-4 text-[#2925D8]" /><span className="min-w-0 flex-1 truncate text-xs font-semibold">{url}</span><button onClick={() => navigator.clipboard.writeText(url).then(() => toast.success("URL copiée."))} className="siteflow-icon-btn !h-8 !w-8"><Copy className="h-3.5 w-3.5" /></button></div><div className="mt-6 grid grid-cols-2 gap-3"><button onClick={onClose} className="siteflow-secondary-btn justify-center">Fermer</button><button onClick={() => window.open(url, "_blank")} className="siteflow-primary-btn justify-center">Visiter le site<ArrowUp className="h-4 w-4 rotate-45" /></button></div></section></div> }
function PanelShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <div className="h-full overflow-y-auto p-5"><h2 className="font-display text-[28px] tracking-[-.035em]">{title}</h2><p className="mt-1 mb-6 text-xs leading-5 text-[#777A8D]">{subtitle}</p>{children}</div> }
function EmptyPanel({ icon: Icon, text }: { icon: typeof Database; text: string }) { return <div className="rounded-xl border border-dashed border-[#DCDC E8] bg-[#FAFAFC] p-4 text-center"><Icon className="mx-auto h-5 w-5 text-[#777BD7]" /><p className="mt-2 text-[11px] leading-5 text-[#7A7D8F]">{text}</p></div> }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-[#E5E5EE] bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-[.08em] text-[#888B9C]">{label}</p><strong className="mt-1 block text-lg">{value}</strong></div> }
function SettingsRow({ icon: Icon, label, value }: { icon: typeof Globe2; label: string; value: string }) { return <div className="flex items-center gap-3 rounded-xl border border-[#E6E6EE] bg-white p-3"><Icon className="h-4 w-4 text-[#6569D4]" /><span className="min-w-0 flex-1"><strong className="block text-xs">{label}</strong><small className="block truncate pt-0.5 text-[11px] text-[#85889A]">{value}</small></span><ChevronRight className="h-4 w-4 text-[#A2A4B2]" /></div> }
