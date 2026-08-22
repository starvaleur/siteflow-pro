import { z } from "zod";
import {
  addAssetForUser,
  addCollectionForUser,
  createFormForUser,
  createPageForUser,
  createSiteForUser,
  deletePageForUser,
  deleteSiteForUser,
  duplicateSiteForUser,
  getPublicSite,
  getSiteForUser,
  listAssetsForUser,
  listCollectionsForUser,
  listFormsForUser,
  listSitesForUser,
  listVersionsForUser,
  publishSiteForUser,
  restoreVersionForUser,
  updatePageForUser,
  updateSiteForUser,
} from "../db";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";

const nameSchema = z.string().trim().min(2, "Saisissez au moins 2 caractères.").max(160);
const treeSchema = z.array(z.unknown()).max(600, "La page contient trop d’éléments.");

export const siteflowRouter = router({
  list: protectedProcedure.query(({ ctx }) => listSitesForUser(ctx.user.id, ctx.user.name)),
  get: protectedProcedure.input(z.object({ siteId: z.number().int().positive() })).query(({ ctx, input }) => getSiteForUser(ctx.user.id, input.siteId)),
  create: protectedProcedure.input(z.object({ name: nameSchema, templateKey: z.string().min(1).max(80) })).mutation(({ ctx, input }) => createSiteForUser({ userId: ctx.user.id, userName: ctx.user.name, ...input })),
  update: protectedProcedure.input(z.object({ siteId: z.number().int().positive(), name: nameSchema.optional(), isFavorite: z.boolean().optional(), theme: z.unknown().optional() })).mutation(({ ctx, input }) => {
    const { siteId, ...changes } = input;
    return updateSiteForUser(ctx.user.id, siteId, changes);
  }),
  remove: protectedProcedure.input(z.object({ siteId: z.number().int().positive() })).mutation(({ ctx, input }) => deleteSiteForUser(ctx.user.id, input.siteId)),
  duplicate: protectedProcedure.input(z.object({ siteId: z.number().int().positive() })).mutation(({ ctx, input }) => duplicateSiteForUser(ctx.user.id, ctx.user.name, input.siteId)),
  publish: protectedProcedure.input(z.object({ siteId: z.number().int().positive() })).mutation(({ ctx, input }) => publishSiteForUser(ctx.user.id, input.siteId)),
  versions: protectedProcedure.input(z.object({ siteId: z.number().int().positive() })).query(({ ctx, input }) => listVersionsForUser(ctx.user.id, input.siteId)),
  restoreVersion: protectedProcedure.input(z.object({ versionId: z.number().int().positive() })).mutation(({ ctx, input }) => restoreVersionForUser(ctx.user.id, input.versionId)),
  public: publicProcedure.input(z.object({ slug: z.string().min(1).max(180) })).query(({ input }) => getPublicSite(input.slug)),
  pages: router({
    create: protectedProcedure.input(z.object({ siteId: z.number().int().positive(), name: nameSchema })).mutation(({ ctx, input }) => createPageForUser(ctx.user.id, input.siteId, input.name)),
    update: protectedProcedure.input(z.object({ pageId: z.number().int().positive(), name: nameSchema.optional(), slug: z.string().min(1).max(180).optional(), settings: z.record(z.string(), z.unknown()).optional(), elementTree: treeSchema.optional(), isHomepage: z.boolean().optional(), sortOrder: z.number().int().min(0).optional() })).mutation(({ ctx, input }) => {
      const { pageId, ...changes } = input;
      return updatePageForUser(ctx.user.id, pageId, changes as never);
    }),
    remove: protectedProcedure.input(z.object({ pageId: z.number().int().positive() })).mutation(({ ctx, input }) => deletePageForUser(ctx.user.id, input.pageId)),
  }),
  assets: router({
    list: protectedProcedure.query(({ ctx }) => listAssetsForUser(ctx.user.id, ctx.user.name)),
    add: protectedProcedure.input(z.object({ name: nameSchema, kind: z.enum(["image", "video", "svg", "icon", "font", "document"]), url: z.string().url(), folder: z.string().trim().min(1).max(120).optional() })).mutation(({ ctx, input }) => addAssetForUser({ userId: ctx.user.id, userName: ctx.user.name, ...input })),
    upload: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(180), kind: z.enum(["image", "video", "svg", "icon", "font", "document"]), contentType: z.string().trim().min(1).max(120), dataUrl: z.string().min(12).max(7_000_000) })).mutation(async ({ ctx, input }) => {
      const base64 = input.dataUrl.includes(",") ? input.dataUrl.split(",").pop()! : input.dataUrl;
      const data = Buffer.from(base64, "base64");
      if (!data.length || data.length > 5 * 1024 * 1024) throw new Error("Les fichiers sont limités à 5 Mo.");
      const { url } = await storagePut(`${ctx.user.id}-assets/${input.name}`, data, input.contentType);
      return addAssetForUser({ userId: ctx.user.id, userName: ctx.user.name, name: input.name, kind: input.kind, url });
    }),
  }),
  cms: router({
    list: protectedProcedure.input(z.object({ siteId: z.number().int().positive() })).query(({ ctx, input }) => listCollectionsForUser(ctx.user.id, input.siteId)),
    create: protectedProcedure.input(z.object({ siteId: z.number().int().positive(), name: nameSchema })).mutation(({ ctx, input }) => addCollectionForUser(ctx.user.id, input.siteId, input.name)),
  }),
  forms: router({
    list: protectedProcedure.input(z.object({ siteId: z.number().int().positive() })).query(({ ctx, input }) => listFormsForUser(ctx.user.id, input.siteId)),
    create: protectedProcedure.input(z.object({ siteId: z.number().int().positive(), name: nameSchema })).mutation(({ ctx, input }) => createFormForUser(ctx.user.id, input.siteId, input.name)),
  }),
});
