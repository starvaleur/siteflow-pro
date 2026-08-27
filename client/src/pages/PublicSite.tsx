import { SiteRenderer } from "@/components/siteflow/SiteRenderer";
import { trpc } from "@/lib/trpc";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { useRoute } from "wouter";
import type { ElementNode } from "../../../shared/siteflow";

export default function PublicSite() {
  const [, params] = useRoute("/s/:slug");
  const slug = params?.slug ?? "";
  const query = trpc.siteflow.public.useQuery({ slug }, { enabled: Boolean(slug), retry: false });
  const page = useMemo(() => query.data?.pages.find((item) => item.isHomepage) ?? query.data?.pages[0], [query.data]);
  if (query.isLoading) return <div className="grid min-h-screen place-items-center bg-[#F8F8FC]"><div className="siteflow-loader" /></div>;
  if (query.isError || !query.data || !page) return <main className="grid min-h-screen place-items-center bg-[#F8F8FC] px-5"><section className="text-center"><p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#6E72D5]">SiteFlow Pro</p><h1 className="mt-3 font-display text-5xl">Cette page n’est pas disponible.</h1><p className="mt-3 text-sm text-[#74778A]">Le site demandé n’est pas publié ou n’existe plus.</p><a href="/" className="siteflow-primary-btn mt-6 inline-flex"><ArrowLeft className="h-4 w-4" />Retour à SiteFlow</a></section></main>;
  return <main style={{ background: query.data.site.theme.background, color: query.data.site.theme.foreground, fontFamily: query.data.site.theme.fontBody }}><SiteRenderer nodes={page.elementTree as ElementNode[]} theme={query.data.site.theme} /></main>;
}
