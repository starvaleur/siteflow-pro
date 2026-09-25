import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import type { ElementNode, PageSettings, SiteTheme } from "../shared/siteflow";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const workspaces = mysqlTable("workspaces", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const sites = mysqlTable("sites", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull(),
  templateKey: varchar("templateKey", { length: 80 }).default("blank").notNull(),
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
  isFavorite: boolean("isFavorite").default(false).notNull(),
  theme: json("theme").$type<SiteTheme>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  publishedAt: timestamp("publishedAt"),
});

export const sitePages = mysqlTable("sitePages", {
  id: int("id").autoincrement().primaryKey(),
  siteId: int("siteId").notNull().references(() => sites.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull(),
  isHomepage: boolean("isHomepage").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  settings: json("settings").$type<PageSettings>().notNull(),
  elementTree: json("elementTree").$type<ElementNode[]>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const siteVersions = mysqlTable("siteVersions", {
  id: int("id").autoincrement().primaryKey(),
  siteId: int("siteId").notNull().references(() => sites.id, { onDelete: "cascade" }),
  description: varchar("description", { length: 240 }).notNull(),
  snapshot: json("snapshot").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const assets = mysqlTable("assets", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 180 }).notNull(),
  kind: mysqlEnum("kind", ["image", "video", "svg", "icon", "font", "document"]).default("image").notNull(),
  url: text("url").notNull(),
  folder: varchar("folder", { length: 120 }).default("Bibliothèque").notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const cmsCollections = mysqlTable("cmsCollections", {
  id: int("id").autoincrement().primaryKey(),
  siteId: int("siteId").notNull().references(() => sites.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 140 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull(),
  schema: json("schema").$type<Array<{ name: string; type: string }>>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const cmsItems = mysqlTable("cmsItems", {
  id: int("id").autoincrement().primaryKey(),
  collectionId: int("collectionId").notNull().references(() => cmsCollections.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull(),
  values: json("values").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const forms = mysqlTable("forms", {
  id: int("id").autoincrement().primaryKey(),
  siteId: int("siteId").notNull().references(() => sites.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  fields: json("fields").$type<Array<{ id: string; label: string; type: string; required?: boolean }>>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const formSubmissions = mysqlTable("formSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  formId: int("formId").notNull().references(() => forms.id, { onDelete: "cascade" }),
  values: json("values").$type<Record<string, unknown>>().notNull(),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
