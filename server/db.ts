import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { assets, cmsCollections, InsertUser, sitePages, siteVersions, sites, users, workspaces, forms } from "../drizzle/schema";
import { buildSiteFromTemplate, makeBlankPage, slugify, type ElementNode, type PageSettings } from "../shared/siteflow";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

function requireDb(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db) throw new Error("La base de données n’est pas disponible.");
  return db;
}

function insertId(result: unknown) {
  const meta = result as Array<{ insertId: number | bigint }>;
  return Number(meta[0]?.insertId);
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  (["name", "email", "loginMethod"] as const).forEach((field) => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = values[field];
    }
  });
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getOrCreateWorkspace(ownerId: number, ownerName?: string | null) {
  const db = requireDb(await getDb());
  const existing = await db.select().from(workspaces).where(eq(workspaces.ownerId, ownerId)).limit(1);
  if (existing[0]) return existing[0];
  const label = `${ownerName?.trim() || "Mon"} espace`;
  const result = await db.insert(workspaces).values({ ownerId, name: label, slug: `${slugify(label)}-${ownerId}` });
  const id = insertId(result);
  const created = await db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
  if (!created[0]) throw new Error("Impossible de créer l’espace de travail.");
  return created[0];
}

export async function listSitesForUser(userId: number, userName?: string | null) {
  const db = requireDb(await getDb());
  const workspace = await getOrCreateWorkspace(userId, userName);
  return db.select().from(sites).where(eq(sites.workspaceId, workspace.id)).orderBy(desc(sites.updatedAt));
}

export async function getSiteForUser(userId: number, siteId: number) {
  const db = requireDb(await getDb());
  const result = await db.select({ site: sites }).from(sites).innerJoin(workspaces, eq(sites.workspaceId, workspaces.id)).where(and(eq(sites.id, siteId), eq(workspaces.ownerId, userId))).limit(1);
  const site = result[0]?.site;
  if (!site) throw new Error("Ce site est introuvable ou vous n’y avez pas accès.");
  const pages = await db.select().from(sitePages).where(eq(sitePages.siteId, site.id)).orderBy(asc(sitePages.sortOrder));
  return { site, pages };
}

export async function createSiteForUser(input: { userId: number; userName?: string | null; name: string; templateKey: string }) {
  const db = requireDb(await getDb());
  const workspace = await getOrCreateWorkspace(input.userId, input.userName);
  const blueprint = buildSiteFromTemplate(input.templateKey);
  const baseSlug = slugify(input.name);
  const result = await db.insert(sites).values({ workspaceId: workspace.id, name: input.name.trim(), slug: `${baseSlug}-${Date.now().toString().slice(-5)}`, templateKey: input.templateKey, theme: blueprint.theme });
  const siteId = insertId(result);
  await db.insert(sitePages).values(blueprint.pages.map((page, index) => ({ siteId, name: page.name, slug: page.slug, isHomepage: page.isHomepage, sortOrder: index, settings: page.settings, elementTree: page.elementTree })));
  return getSiteForUser(input.userId, siteId);
}

export async function updateSiteForUser(userId: number, siteId: number, changes: { name?: string; isFavorite?: boolean; theme?: unknown }) {
  const db = requireDb(await getDb());
  await getSiteForUser(userId, siteId);
  const set: Record<string, unknown> = {};
  if (changes.name !== undefined) set.name = changes.name.trim();
  if (changes.isFavorite !== undefined) set.isFavorite = changes.isFavorite;
  if (changes.theme !== undefined) set.theme = changes.theme;
  if (Object.keys(set).length) await db.update(sites).set(set).where(eq(sites.id, siteId));
  return getSiteForUser(userId, siteId);
}

export async function deleteSiteForUser(userId: number, siteId: number) {
  const db = requireDb(await getDb());
  await getSiteForUser(userId, siteId);
  await db.delete(sites).where(eq(sites.id, siteId));
  return { success: true };
}

export async function duplicateSiteForUser(userId: number, userName: string | null | undefined, siteId: number) {
  const db = requireDb(await getDb());
  const current = await getSiteForUser(userId, siteId);
  const workspace = await getOrCreateWorkspace(userId, userName);
  const result = await db.insert(sites).values({ workspaceId: workspace.id, name: `${current.site.name} — copie`, slug: `${slugify(current.site.name)}-copie-${Date.now().toString().slice(-5)}`, templateKey: current.site.templateKey, status: "draft", theme: current.site.theme });
  const duplicateId = insertId(result);
  await db.insert(sitePages).values(current.pages.map((page, index) => ({ siteId: duplicateId, name: page.name, slug: page.slug, isHomepage: page.isHomepage, sortOrder: index, settings: page.settings, elementTree: page.elementTree })));
  return getSiteForUser(userId, duplicateId);
}

export async function updatePageForUser(userId: number, pageId: number, changes: { name?: string; slug?: string; settings?: PageSettings; elementTree?: ElementNode[]; isHomepage?: boolean; sortOrder?: number }) {
  const db = requireDb(await getDb());
  const pageResult = await db.select({ page: sitePages }).from(sitePages).innerJoin(sites, eq(sitePages.siteId, sites.id)).innerJoin(workspaces, eq(sites.workspaceId, workspaces.id)).where(and(eq(sitePages.id, pageId), eq(workspaces.ownerId, userId))).limit(1);
  const page = pageResult[0]?.page;
  if (!page) throw new Error("Cette page est introuvable ou vous n’y avez pas accès.");
  const set: Record<string, unknown> = {};
  if (changes.name !== undefined) set.name = changes.name.trim();
  if (changes.slug !== undefined) set.slug = slugify(changes.slug);
  if (changes.settings !== undefined) set.settings = changes.settings;
  if (changes.elementTree !== undefined) set.elementTree = changes.elementTree;
  if (changes.isHomepage !== undefined) set.isHomepage = changes.isHomepage;
  if (changes.sortOrder !== undefined) set.sortOrder = changes.sortOrder;
  if (Object.keys(set).length) await db.update(sitePages).set(set).where(eq(sitePages.id, pageId));
  await db.update(sites).set({ updatedAt: new Date() }).where(eq(sites.id, page.siteId));
  return getSiteForUser(userId, page.siteId);
}

export async function createPageForUser(userId: number, siteId: number, name: string) {
  const db = requireDb(await getDb());
  const current = await getSiteForUser(userId, siteId);
  const slug = `${slugify(name)}-${current.pages.length + 1}`;
  const page = makeBlankPage(name.trim(), slug);
  const result = await db.insert(sitePages).values({ siteId, name: page.name, slug: page.slug, isHomepage: false, sortOrder: current.pages.length, settings: page.settings, elementTree: page.elementTree });
  return { pageId: insertId(result), data: await getSiteForUser(userId, siteId) };
}

export async function deletePageForUser(userId: number, pageId: number) {
  const db = requireDb(await getDb());
  const page = await db.select().from(sitePages).where(eq(sitePages.id, pageId)).limit(1);
  if (!page[0]) throw new Error("Cette page est introuvable.");
  const current = await getSiteForUser(userId, page[0].siteId);
  if (current.pages.length <= 1) throw new Error("Un site doit conserver au moins une page.");
  await db.delete(sitePages).where(eq(sitePages.id, pageId));
  return getSiteForUser(userId, page[0].siteId);
}

export async function publishSiteForUser(userId: number, siteId: number) {
  const db = requireDb(await getDb());
  const current = await getSiteForUser(userId, siteId);
  const now = new Date();
  await db.update(sites).set({ status: "published", publishedAt: now }).where(eq(sites.id, siteId));
  await db.insert(siteVersions).values({ siteId, description: "Publication", snapshot: { site: current.site, pages: current.pages, publishedAt: now.toISOString() } });
  return getSiteForUser(userId, siteId);
}

export async function listVersionsForUser(userId: number, siteId: number) {
  const db = requireDb(await getDb());
  await getSiteForUser(userId, siteId);
  return db.select().from(siteVersions).where(eq(siteVersions.siteId, siteId)).orderBy(desc(siteVersions.createdAt));
}

export async function restoreVersionForUser(userId: number, versionId: number) {
  const db = requireDb(await getDb());
  const versionResult = await db.select({ version: siteVersions }).from(siteVersions).innerJoin(sites, eq(siteVersions.siteId, sites.id)).innerJoin(workspaces, eq(sites.workspaceId, workspaces.id)).where(and(eq(siteVersions.id, versionId), eq(workspaces.ownerId, userId))).limit(1);
  const version = versionResult[0]?.version;
  if (!version) throw new Error("Cette version est introuvable ou vous n’y avez pas accès.");
  const snapshot = version.snapshot as { site?: { theme?: unknown }; pages?: Array<{ name: string; slug: string; isHomepage: boolean; sortOrder: number; settings: PageSettings; elementTree: ElementNode[] }> };
  if (!snapshot.pages?.length) throw new Error("Cette version ne contient pas de pages restaurables.");
  await db.delete(sitePages).where(eq(sitePages.siteId, version.siteId));
  await db.insert(sitePages).values(snapshot.pages.map((page, index) => ({ siteId: version.siteId, name: page.name, slug: page.slug, isHomepage: page.isHomepage, sortOrder: page.sortOrder ?? index, settings: page.settings, elementTree: page.elementTree })));
  if (snapshot.site?.theme) await db.update(sites).set({ theme: snapshot.site.theme as never, updatedAt: new Date() }).where(eq(sites.id, version.siteId));
  return getSiteForUser(userId, version.siteId);
}

export async function getPublicSite(slug: string) {
  const db = requireDb(await getDb());
  const site = await db.select().from(sites).where(and(eq(sites.slug, slug), eq(sites.status, "published"))).limit(1);
  if (!site[0]) throw new Error("Ce site n’est pas publié.");
  const pages = await db.select().from(sitePages).where(eq(sitePages.siteId, site[0].id)).orderBy(asc(sitePages.sortOrder));
  return { site: site[0], pages };
}

export async function listAssetsForUser(userId: number, userName?: string | null) {
  const db = requireDb(await getDb());
  const workspace = await getOrCreateWorkspace(userId, userName);
  return db.select().from(assets).where(eq(assets.workspaceId, workspace.id)).orderBy(desc(assets.createdAt));
}

export async function addAssetForUser(input: { userId: number; userName?: string | null; name: string; kind: "image" | "video" | "svg" | "icon" | "font" | "document"; url: string; folder?: string }) {
  const db = requireDb(await getDb());
  const workspace = await getOrCreateWorkspace(input.userId, input.userName);
  const result = await db.insert(assets).values({ workspaceId: workspace.id, name: input.name.trim(), kind: input.kind, url: input.url, folder: input.folder ?? "Bibliothèque" });
  return { id: insertId(result), url: input.url };
}

export async function listCollectionsForUser(userId: number, siteId: number) {
  const db = requireDb(await getDb());
  await getSiteForUser(userId, siteId);
  return db.select().from(cmsCollections).where(eq(cmsCollections.siteId, siteId)).orderBy(asc(cmsCollections.name));
}

export async function addCollectionForUser(userId: number, siteId: number, name: string) {
  const db = requireDb(await getDb());
  await getSiteForUser(userId, siteId);
  const result = await db.insert(cmsCollections).values({ siteId, name: name.trim(), slug: slugify(name), schema: [{ name: "Titre", type: "text" }, { name: "Slug", type: "slug" }] });
  return { id: insertId(result) };
}

export async function listFormsForUser(userId: number, siteId: number) {
  const db = requireDb(await getDb());
  await getSiteForUser(userId, siteId);
  return db.select().from(forms).where(eq(forms.siteId, siteId)).orderBy(desc(forms.createdAt));
}

export async function createFormForUser(userId: number, siteId: number, name: string) {
  const db = requireDb(await getDb());
  await getSiteForUser(userId, siteId);
  const result = await db.insert(forms).values({ siteId, name: name.trim(), fields: [{ id: "email", label: "Email", type: "email", required: true }, { id: "message", label: "Message", type: "textarea" }] });
  return { id: insertId(result) };
}
