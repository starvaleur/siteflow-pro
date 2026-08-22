import { SiteRenderer } from "@/components/siteflow/SiteRenderer";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, Monitor, Smartphone, Tablet } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import type { DeviceMode, ElementNode } from "../../../shared/siteflow";

export default function SitePreview() {
  const [, params] = useRoute("/preview/:id");
  const [, setLocation] = useLocation();
  const siteId = Number(params?.id);
  const query = trpc.siteflow.get.useQuery({ siteId }, { enabled: Number.isFinite(siteId) && siteId > 0 });
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const isMobile = useIsMobile();
  const page = useMemo(() => query.data?.pages.find((item) => item.isHomepage) ?? query.data?.pages[0], [query.data]);
  if (query.isLoading) return <div className="grid min-h-screen place-items-center bg-[#F5F5F9]"><div className="siteflow-loader" /></div>;
  if (!query.data || !page) return <div className="grid min-h-screen place-items-center"><button onClick={() => setLocation("/")} className="siteflow-primary-btn">Retour</button></div>;
  const previewDevice = isMobile && device === "desktop" ? "mobile" : device;
  const width = previewDevice === "desktop" ? "min(100%, 1120px)" : previewDevice === "tablet" ? "min(100%, 760px)" : "min(100%, 390px)";
  return <div className="min-h-screen bg-[#ECECF3]"><header className="flex h-[68px] items-center justify-between border-b border-[#DADAE4] bg-white px-5 sm:px-8"><button onClick={() => setLocation(`/editor/${siteId}`)} className="flex items-center gap-2 text-xs font-bold text-[#4E5270]"><ChevronLeft className="h-4 w-4" />Retour à l’éditeur</button><div className="flex items-center gap-1 rounded-lg border border-[#E1E1E9] bg-[#FAFAFC] p-1">{([{ key: "desktop", icon: Monitor }, { key: "tablet", icon: Tablet }, { key: "mobile", icon: Smartphone }] as const).map((item) => <button key={item.key} onClick={() => setDevice(item.key)} className={`grid h-8 w-8 place-items-center rounded-md ${device === item.key ? "bg-white text-[#2925D8] shadow-sm" : "text-[#777A8D]"}`}><item.icon className="h-4 w-4" /></button>)}</div><span className="hidden text-xs text-[#777A8D] sm:block">Aperçu · {page.name}</span></header><main className="p-6 sm:p-12"><div className="mx-auto overflow-hidden bg-white shadow-[0_16px_70px_rgba(17,20,72,.16)]" style={{ width }}><SiteRenderer nodes={page.elementTree as ElementNode[]} device={previewDevice} /></div></main></div>;
}
