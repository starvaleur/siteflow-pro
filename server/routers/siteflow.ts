import { z } from "zod";
import {
  addAssetForUser,
  addCollectionForUser,
  addItemForUser,
  createFormForUser,
  createPageForUser,
  createSiteForUser,
  deletePageForUser,
  deleteSiteForUser,
  duplicateSiteForUser,
  getPublicCollectionItems,
  getPublicSite,
  getSiteForUser,
  getVersionPreviewForUser,
  listAssetsForUser,
  listCollectionsForUser,
  listFormsForUser,
  listItemsForUser,
  listSitesForUser,
  listSubmissionsForUser,
  listVersionsForUser,
  publishSiteForUser,
  removeItemForUser,
  restoreVersionForUser,
  submitPublicForm,
  updateCollectionSchemaForUser,
  updateFormFieldsForUser,
  updateItemForUser,
  updatePageForUser,
  updateSiteForUser,
} from "../db";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";

const nameSchema = z.string().trim().min(2, "Saisissez au moins 2 caractères.").max(160);
const treeSchema = z.array(z.unknown()).max(600, "La page contient trop d’éléments.");
const cmsFieldSchema = z.array(z.object({ name: z.string().trim().min(1).max(80), type: z.enum(["text", "richtext", "image", "number", "boolean", "slug"]) })).min(1).max(30);
const formFieldSchema = z.array(z.object({ id: z.string().trim().min(1).max(60), label: z.string().trim().min(1).max(120), type: z.enum(["text", "email", "textarea", "select", "checkbox"]), required: z.boolean().optional(), options: z.array(z.string()).optional() })).min(1).max(20);

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
  versionPreview: protectedProcedure.input(z.object({ versionId: z.number().int().positive() })).query(({ ctx, input }) => getVersionPreviewForUser(ctx.user.id, input.versionId)),
  restoreVersion: protectedProcedure.input(z.object({ versionId: z.number().int().positive() })).mutation(({ ctx, input }) => restoreVersionForUser(ctx.user.id, input.versionId)),
  public: publicProcedure.input(z.object({ slug: z.string().min(1).max(180) })).query(({ input }) => getPublicSite(input.slug)),
  publicCollection: publicProcedure.input(z.object({ siteSlug: z.string().min(1).max(180), collectionSlug: z.string().min(1).max(180) })).query(({ input }) => getPublicCollectionItems(input.siteSlug, input.collectionSlug)),
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
    create: protectedProcedure.input(z.object({ siteId: z.number().int().positive(), name: nameSchema, schema: cmsFieldSchema.optional() })).mutation(({ ctx, input }) => addCollectionForUser(ctx.user.id, input.siteId, input.name, input.schema)),
    updateSchema: protectedProcedure.input(z.object({ siteId: z.number().int().positive(), collectionId: z.number().int().positive(), schema: cmsFieldSchema })).mutation(({ ctx, input }) => updateCollectionSchemaForUser(ctx.user.id, input.siteId, input.collectionId, input.schema)),
    items: router({
      list: protectedProcedure.input(z.object({ siteId: z.number().int().positive(), collectionId: z.number().int().positive() })).query(({ ctx, input }) => listItemsForUser(ctx.user.id, input.siteId, input.collectionId)),
      create: protectedProcedure.input(z.object({ siteId: z.number().int().positive(), collectionId: z.number().int().positive(), name: nameSchema, values: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => addItemForUser(ctx.user.id, input.siteId, input.collectionId, input.name, input.values)),
      update: protectedProcedure.input(z.object({ siteId: z.number().int().positive(), itemId: z.number().int().positive(), name: nameSchema.optional(), values: z.record(z.string(), z.unknown()).optional() })).mutation(({ ctx, input }) => updateItemForUser(ctx.user.id, input.siteId, input.itemId, { name: input.name, values: input.values })),
      remove: protectedProcedure.input(z.object({ siteId: z.number().int().positive(), itemId: z.number().int().positive() })).mutation(({ ctx, input }) => removeItemForUser(ctx.user.id, input.siteId, input.itemId)),
    }),
  }),
  forms: router({
    list: protectedProcedure.input(z.object({ siteId: z.number().int().positive() })).query(({ ctx, input }) => listFormsForUser(ctx.user.id, input.siteId)),
    create: protectedProcedure.input(z.object({ siteId: z.number().int().positive(), name: nameSchema })).mutation(({ ctx, input }) => createFormForUser(ctx.user.id, input.siteId, input.name)),
    updateFields: protectedProcedure.input(z.object({ siteId: z.number().int().positive(), formId: z.number().int().positive(), fields: formFieldSchema })).mutation(({ ctx, input }) => updateFormFieldsForUser(ctx.user.id, input.siteId, input.formId, input.fields)),
    submissions: protectedProcedure.input(z.object({ siteId: z.number().int().positive(), formId: z.number().int().positive() })).query(({ ctx, input }) => listSubmissionsForUser(ctx.user.id, input.siteId, input.formId)),
    submit: publicProcedure.input(z.object({ formId: z.number().int().positive(), values: z.record(z.string(), z.unknown()) })).mutation(({ input }) => submitPublicForm(input.formId, input.values)),
  }),
});
