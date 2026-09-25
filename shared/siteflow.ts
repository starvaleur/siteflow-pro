export type DeviceMode = "desktop" | "tablet" | "mobile";

export type ElementType =
  | "section"
  | "container"
  | "heading"
  | "paragraph"
  | "button"
  | "image"
  | "card"
  | "grid"
  | "navbar"
  | "footer"
  | "form"
  | "collection-list"
  | "divider"
  | "spacer"
  | "icon"
  | "video"
  | "link"
  | "columns"
  | "stack";

export type StyleMap = Record<string, string | number | undefined>;

export type ElementNode = {
  id: string;
  type: ElementType;
  name: string;
  visible: boolean;
  locked: boolean;
  props: Record<string, unknown>;
  styles: StyleMap;
  responsive: Partial<Record<Exclude<DeviceMode, "desktop">, StyleMap>>;
  children: ElementNode[];
};

export type PageSettings = {
  title?: string;
  description?: string;
  socialImage?: string;
  password?: string;
  noIndex?: boolean;
  hideNavigation?: boolean;
};

export type BlueprintPage = {
  name: string;
  slug: string;
  isHomepage: boolean;
  settings: PageSettings;
  elementTree: ElementNode[];
};

export type SiteTheme = {
  name: string;
  background: string;
  foreground: string;
  accent: string;
  muted: string;
  primary?: string;
  secondary?: string;
  surface?: string;
  text?: string;
  fontDisplay: string;
  fontBody: string;
  fontSmall?: string;
  fontH1?: string;
  fontH2?: string;
  fontH3?: string;
  fontBodySize?: string;
  fontSmallSize?: string;
  fontButtonSize?: string;
  radius: string;
  buttonRadius?: string;
  cardRadius?: string;
  borderWidth?: string;
  shadow?: string;
  spacing?: string;
  containerMaxWidth?: string;
};

export type SiteBlueprint = {
  key: string;
  name: string;
  category: string;
  description: string;
  cover: string;
  theme: SiteTheme;
  pages: BlueprintPage[];
};

const ASSETS = {
  nexus: "/manus-storage/template-nexus-saas_c284fccd.png",
  canvas: "/manus-storage/template-canvas-portfolio_56be5412.png",
  atelier: "/manus-storage/template-atelier-restaurant_a7a3c5f0.png",
  arc: "/manus-storage/template-arc-real-estate_e312de0e.png",
};

const indigoTheme: SiteTheme = {
  name: "Indigo Atelier",
  background: "#F8F8FC",
  foreground: "#11172B",
  accent: "#2925D8",
  muted: "#F0F0F6",
  primary: "#2925D8",
  secondary: "#11172B",
  surface: "#FFFFFF",
  text: "#11172B",
  fontDisplay: "DM Serif Display",
  fontBody: "Plus Jakarta Sans",
  fontSmall: "Plus Jakarta Sans",
  fontH1: "DM Serif Display",
  fontH2: "DM Serif Display",
  fontH3: "DM Serif Display",
  fontBodySize: "16px",
  fontSmallSize: "12px",
  fontButtonSize: "14px",
  radius: "16px",
  buttonRadius: "10px",
  cardRadius: "16px",
  borderWidth: "1px",
  shadow: "0 4px 12px rgba(0,0,0,0.05)",
  spacing: "24px",
  containerMaxWidth: "1200px",
};

const buildNode = (
  seed: string,
  index: number,
  type: ElementType,
  name: string,
  props: Record<string, unknown> = {},
  styles: StyleMap = {},
  children: ElementNode[] = []
): ElementNode => ({
  id: `${seed}-${index}-${type}`,
  type,
  name,
  visible: true,
  locked: false,
  props,
  styles,
  responsive: {},
  children,
});

function makeHomePage(seed: string, content: { eyebrow: string; title: string; copy: string; action: string; image: string; cardTitles: string[]; footer: string; }): BlueprintPage {
  const nav = buildNode(seed, 1, "navbar", "Navigation", { brand: "SiteFlow Pro", links: ["Accueil", "À propos", "Services"] }, { padding: "22px 6vw", background: "#ffffff" });
  const hero = buildNode(seed, 2, "section", "Hero", {}, { background: "#F8F8FC", padding: "88px 7vw", minHeight: "520px" }, [
    buildNode(seed, 3, "paragraph", "Sur-titre", { text: content.eyebrow }, { color: "#2925D8", fontSize: "12px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "22px" }),
    buildNode(seed, 4, "heading", "Titre principal", { text: content.title }, { color: "#11172B", fontSize: "60px", lineHeight: 1.04, fontFamily: "DM Serif Display", fontWeight: 400, maxWidth: "720px", marginBottom: "22px" }),
    buildNode(seed, 5, "paragraph", "Texte de présentation", { text: content.copy }, { color: "#51556A", fontSize: "18px", lineHeight: 1.65, maxWidth: "580px", marginBottom: "30px" }),
    buildNode(seed, 6, "button", "Action principale", { label: content.action, href: "#contact" }, { background: "#2925D8", color: "#ffffff", padding: "14px 20px", borderRadius: "10px", fontWeight: 700, display: "inline-block" }),
  ]);
  const featureCards = content.cardTitles.map((title, cardIndex) => buildNode(seed, 8 + cardIndex, "card", title, { title, text: "Une fondation claire, pensée pour transformer l’attention en résultats." }, { background: "#ffffff", border: "1px solid #E7E7EF", padding: "28px", borderRadius: "16px" }));
  const features = buildNode(seed, 7, "section", "Points forts", {}, { background: "#ffffff", padding: "76px 7vw" }, [
    buildNode(seed, 11, "heading", "Titre points forts", { text: "Une présence conçue avec méthode." }, { color: "#11172B", fontSize: "38px", fontFamily: "DM Serif Display", marginBottom: "32px" }),
    buildNode(seed, 12, "grid", "Grille de points forts", { columns: 3 }, { display: "grid", gap: "18px", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }, featureCards),
  ]);
  const visual = buildNode(seed, 13, "image", "Visuel principal", { src: content.image, alt: "Aperçu du projet" }, { width: "100%", maxWidth: "620px", borderRadius: "18px", display: "block", margin: "0 auto", boxShadow: "0 22px 60px rgba(34, 35, 82, 0.12)" });
  const showcase = buildNode(seed, 14, "section", "Présentation visuelle", {}, { background: "#F0F0F6", padding: "64px 7vw" }, [visual]);
  const footer = buildNode(seed, 15, "footer", "Pied de page", { text: content.footer }, { background: "#11172B", color: "#F8F8FC", padding: "42px 7vw", fontSize: "14px" });
  return { name: "Accueil", slug: "home", isHomepage: true, settings: { title: content.title, description: content.copy }, elementTree: [nav, hero, features, showcase, footer] };
}

function makeInformationPage(seed: string, name: string, title: string, text: string): BlueprintPage {
  return {
    name,
    slug: name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-"),
    isHomepage: false,
    settings: { title, description: text },
    elementTree: [
      buildNode(seed, 30, "navbar", "Navigation", { brand: "SiteFlow Pro", links: ["Accueil", name] }, { padding: "22px 6vw", background: "#ffffff" }),
      buildNode(seed, 31, "section", `${name} Hero`, {}, { padding: "110px 7vw", background: "#F8F8FC" }, [
        buildNode(seed, 32, "heading", `${name} titre`, { text: title }, { fontFamily: "DM Serif Display", fontSize: "58px", lineHeight: 1.08, color: "#11172B", maxWidth: "760px", marginBottom: "20px" }),
        buildNode(seed, 33, "paragraph", `${name} texte`, { text }, { fontSize: "18px", lineHeight: 1.7, color: "#51556A", maxWidth: "620px" }),
      ]),
      buildNode(seed, 34, "footer", "Pied de page", { text: "Conçu avec méthode." }, { background: "#11172B", color: "#ffffff", padding: "42px 7vw" }),
    ],
  };
}

export const templateCatalog: Array<Pick<SiteBlueprint, "key" | "name" | "category" | "description" | "cover">> = [
  { key: "nexus-saas", name: "Nexus", category: "SaaS", description: "Une base B2B nette pour un produit ambitieux.", cover: ASSETS.nexus },
  { key: "form-agency", name: "Form", category: "Agence", description: "Un portfolio d’agence qui mène rapidement au contact.", cover: ASSETS.canvas },
  { key: "canvas-portfolio", name: "Canvas", category: "Portfolio", description: "Une composition éditoriale pour mettre le travail au premier plan.", cover: ASSETS.canvas },
  { key: "atelier-restaurant", name: "Atelier", category: "Restaurant", description: "Un univers gastronomique lumineux et réservé.", cover: ASSETS.atelier },
  { key: "arc-estate", name: "Arc", category: "Immobilier", description: "Des propriétés présentées comme des pièces architecturales.", cover: ASSETS.arc },
  { key: "tempo-fitness", name: "Tempo", category: "Fitness", description: "Une marque énergique structurée autour des programmes.", cover: ASSETS.nexus },
  { key: "lumen-photo", name: "Lumen", category: "Photographie", description: "Un espace de travail visuel calme, pensé pour l’image.", cover: ASSETS.canvas },
  { key: "north-consulting", name: "North", category: "Consulting", description: "Une présence experte, concise et rassurante.", cover: ASSETS.nexus },
  { key: "edition-personal", name: "Édition", category: "Personnel", description: "Une carte de visite personnelle avec une vraie perspective.", cover: ASSETS.canvas },
  { key: "mercato-shop", name: "Mercato", category: "Ecommerce", description: "Une vitrine produit éditoriale et orientée conversion.", cover: ASSETS.arc },
];

const copyByTemplate: Record<string, Omit<SiteBlueprint, "key" | "pages">> = {
  "nexus-saas": { name: "Nexus", category: "SaaS", description: "Une base B2B nette pour un produit ambitieux.", cover: ASSETS.nexus, theme: indigoTheme },
  "form-agency": { name: "Form", category: "Agence", description: "Un portfolio d’agence qui mène rapidement au contact.", cover: ASSETS.canvas, theme: { ...indigoTheme, accent: "#B84422", primary: "#B84422" } },
  "canvas-portfolio": { name: "Canvas", category: "Portfolio", description: "Une composition éditoriale pour mettre le travail au premier plan.", cover: ASSETS.canvas, theme: { ...indigoTheme, background: "#F5F0EA", accent: "#A94434", primary: "#A94434" } },
  "atelier-restaurant": { name: "Atelier", category: "Restaurant", description: "Un univers gastronomique lumineux et réservé.", cover: ASSETS.atelier, theme: { ...indigoTheme, background: "#171717", foreground: "#F5EFE5", accent: "#C88A31", muted: "#252525", primary: "#C88A31", surface: "#1A1A1A", text: "#F5EFE5" } },
  "arc-estate": { name: "Arc", category: "Immobilier", description: "Des propriétés présentées comme des pièces architecturales.", cover: ASSETS.arc, theme: { ...indigoTheme, background: "#F3F2EC", accent: "#565E40", primary: "#565E40" } },
  "tempo-fitness": { name: "Tempo", category: "Fitness", description: "Une marque énergique structurée autour des programmes.", cover: ASSETS.nexus, theme: { ...indigoTheme, accent: "#F04A30", primary: "#F04A30" } },
  "lumen-photo": { name: "Lumen", category: "Photographie", description: "Un espace de travail visuel calme, pensé pour l’image.", cover: ASSETS.canvas, theme: { ...indigoTheme, background: "#F3F3F0", foreground: "#171717", accent: "#4B4958", primary: "#4B4958", text: "#171717" } },
  "north-consulting": { name: "North", category: "Consulting", description: "Une présence experte, concise et rassurante.", cover: ASSETS.nexus, theme: { ...indigoTheme, accent: "#1F6D65", primary: "#1F6D65" } },
  "edition-personal": { name: "Édition", category: "Personnel", description: "Une carte de visite personnelle avec une vraie perspective.", cover: ASSETS.canvas, theme: { ...indigoTheme, accent: "#252525", primary: "#252525" } },
  "mercato-shop": { name: "Mercato", category: "Ecommerce", description: "Une vitrine produit éditoriale et orientée conversion.", cover: ASSETS.arc, theme: { ...indigoTheme, accent: "#AA303B", primary: "#AA303B" } },
};

function templateContent(key: string) {
  const catalogItem = templateCatalog.find((item) => item.key === key) ?? templateCatalog[0];
  const descriptions: Record<string, { eyebrow: string; title: string; copy: string; action: string; cards: string[]; }> = {
    "nexus-saas": { eyebrow: "Système d’analyse", title: "La clarté opérationnelle, sans le bruit.", copy: "Nexus rassemble les décisions, les signaux et l’équipe dans une vue qui laisse les priorités parler d’elles-mêmes.", action: "Voir la plateforme", cards: ["Un flux net", "Des données utiles", "Une équipe alignée"] },
    "atelier-restaurant": { eyebrow: "Cuisine de saison", title: "L’instinct du produit, servi avec précision.", copy: "Une table intime qui fait de chaque service un récit composé autour du goût, de la saison et du geste.", action: "Réserver une table", cards: ["Le menu", "Les producteurs", "La table privée"] },
    "arc-estate": { eyebrow: "Architecture habitée", title: "Des lieux qui laissent une empreinte.", copy: "Arc rassemble des résidences singulières dont la matière, la lumière et le terrain construisent une vie plus ample.", action: "Voir les propriétés", cards: ["Sélection privée", "Approche curatée", "Accompagnement"] },
  };
  return descriptions[key] ?? { eyebrow: catalogItem.category, title: `Une présence ${catalogItem.name.toLowerCase()} conçue avec intention.`, copy: catalogItem.description, action: "Découvrir le projet", cards: ["Une direction claire", "Un rythme juste", "Un système durable"] };
}

export function getTemplate(key: string): SiteBlueprint {
  const item = copyByTemplate[key] ?? copyByTemplate["nexus-saas"];
  const content = templateContent(key);
  return {
    key,
    ...item,
    pages: [
      makeHomePage(key, { eyebrow: content.eyebrow, title: content.title, copy: content.copy, action: content.action, image: item.cover, cardTitles: content.cards, footer: `${item.name} — une présence construite avec méthode.` }),
      makeInformationPage(key, "À propos", `Un projet ${item.name.toLowerCase()} à taille humaine.`, item.description),
      makeInformationPage(key, "Contact", "Parlons du prochain chapitre.", "Chaque demande ouvre une conversation simple, sans détour et attentive au contexte."),
    ],
  };
}

export function getBlankBlueprint(): SiteBlueprint {
  return {
    key: "blank",
    name: "Page vierge",
    category: "Blank",
    description: "Un point de départ vide et déjà structuré.",
    cover: ASSETS.nexus,
    theme: indigoTheme,
    pages: [makeHomePage("blank", { eyebrow: "Nouveau projet", title: "Une idée mérite une présence nette.", copy: "Commencez avec une structure claire puis ajustez chaque détail dans l’éditeur SiteFlow Pro.", action: "Commencer", image: ASSETS.nexus, cardTitles: ["Construire", "Ajuster", "Publier"], footer: "Construit dans SiteFlow Pro." })],
  };
}

export function buildSiteFromTemplate(templateKey: string): SiteBlueprint {
  return templateKey === "blank" ? getBlankBlueprint() : getTemplate(templateKey);
}

export function makeBlankPage(name: string, slug: string): BlueprintPage {
  return {
    name,
    slug,
    isHomepage: false,
    settings: { title: name, description: "" },
    elementTree: [
      buildNode(`page-${slug}`, 1, "section", "Section vide", {}, { background: "#F8F8FC", padding: "104px 7vw" }, [
        buildNode(`page-${slug}`, 2, "heading", "Nouveau titre", { text: "Nouveau titre" }, { color: "#11172B", fontFamily: "DM Serif Display", fontSize: "54px", marginBottom: "18px" }),
        buildNode(`page-${slug}`, 3, "paragraph", "Nouveau texte", { text: "Ajoutez votre contenu puis composez votre page avec les éléments SiteFlow Pro." }, { color: "#51556A", fontSize: "18px", lineHeight: 1.6, maxWidth: "620px" }),
      ]),
    ],
  };
}

export function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "site";
}
