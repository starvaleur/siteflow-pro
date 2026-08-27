import { SiteRenderer } from "@/components/siteflow/SiteRenderer";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, History, Monitor, Smartphone, Tablet } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import type { DeviceMode, ElementNode } from "../../../shared/siteflow";

export default function SitePreview() {
  const [, params] = useRoute("/preview/:id");
  const [, setLocation] = useLocation();
  const siteId = Number(params?.id);
  const versionId = useMemo(() => {
    const value = typeof window === "undefined" ? NaN : Number(new URLSearchParams(window.location.search).get("version"));
    return Number.isFinite(value) && value > 0 ? value : undefined;
  }, []);
  const currentQuery = trpc.siteflow.get.useQuery({ siteId }, { enabled: Number.isFinite(siteId) && siteId > 0 && !versionId });
  const versionQuery = trpc.siteflow.versionPreview.useQuery({ versionId: versionId ?? 0 }, { enabled: Boolean(versionId) });
  const query = versionId ? versionQuery : currentQuery;
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const isMobile = useIsMobile();
  const page = useMemo(() => query.data?.pages.find((item) => item.isHomepage) ?? query.data?.pages[0], [query.data]);
  const isHistorical = Boolean(versionId);

  if (query.isLoading) return <div className="grid min-h-screen place-items-center bg-[#F5F5F9]"><div className="text-center"><div className="siteflow-loader mx-auto" /><p className="mt-4 text-xs font-semibold text-[#717487]">Chargement de l’aperçu…</p></div></div>;
  if (query.isError || !query.data || !page) return <main className="grid min-h-screen place-items-center bg-[#F5F5F9] px-5"><section className="max-w-md rounded-2xl border border-[#E3E3EC] bg-white p-8 text-center shadow-[0_12px_40px_rgba(17,20,72,.08)]"><p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#6E72D5]">Aperçu SiteFlow Pro</p><h1 className="mt-3 font-display text-4xl">Aperçu indisponible</h1><p className="mt-3 text-sm leading-6 text-[#74778A]">{isHistorical ? "Cette version ne contient pas de snapshot prévisualisable ou n’est plus accessible." : "Le projet n’a pas pu être chargé. Réessayez ou retournez au tableau de bord."}</p><div className="mt-6 flex justify-center gap-2"><button onClick={() => query.refetch()} className="siteflow-primary-btn">Réessayer</button><button onClick={() => setLocation(`/editor/${siteId}`)} className="siteflow-secondary-btn">Retour</button></div></section></main>;
  const previewDevice = isMobile && device === "desktop" ? "mobile" : device;
  const width = previewDevice === "desktop" ? "min(100%, 1120px)" : previewDevice === "tablet" ? "min(100%, 760px)" : "min(100%, 390px)";
  return <div className="min-h-screen bg-[#ECECF3]"><header className="flex min-h-[68px] items-center justify-between gap-4 border-b border-[#DADAE4] bg-white px-5 sm:px-8"><button onClick={() => setLocation(`/editor/${siteId}`)} className="flex items-center gap-2 text-xs font-bold text-[#4E5270]"><ChevronLeft className="h-4 w-4" />Retour à l’éditeur</button><div className="flex items-center gap-3"><span className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.08em] sm:flex ${isHistorical ? "bg-[#FFF4E9] text-[#A35E28]" : "bg-[#F0F0FF] text-[#5558C8]"}`}>{isHistorical ? <History className="h-3.5 w-3.5" /> : null}{isHistorical ? `Version #${versionId}` : "Aperçu actuel"}</span><div className="flex items-center gap-1 rounded-lg border border-[#E1E1E9] bg-[#FAFAFC] p-1">{([{ key: "desktop", icon: Monitor }, { key: "tablet", icon: Tablet }, { key: "mobile", icon: Smartphone }] as const).map((item) => <button key={item.key} onClick={() => setDevice(item.key)} aria-label={`Aperçu ${item.key}`} className={`grid h-8 w-8 place-items-center rounded-md ${device === item.key ? "bg-white text-[#2925D8] shadow-sm" : "text-[#777A8D]"}`}><item.icon className="h-4 w-4" /></button>)}</div><span className="hidden text-xs text-[#777A8D] sm:block">{isHistorical ? "Snapshot historique" : "Aperçu"} · {page.name}</span></div></header><main className="p-6 sm:p-12"><div className="mx-auto overflow-hidden bg-white shadow-[0_16px_70px_rgba(17,20,72,.16)]" style={{ width }}><SiteRenderer nodes={page.elementTree as ElementNode[]} theme={query.data.site.theme} device={previewDevice} /></div></main></div>;
}

// The preview route intentionally keeps editor chrome out of the rendered site. Add ?version=<id> to inspect a stored publication snapshot.

