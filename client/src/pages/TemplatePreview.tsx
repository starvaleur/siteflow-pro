import { AppShell } from "@/components/siteflow/AppShell";
import { CreateSiteDialog } from "@/components/siteflow/CreateSiteDialog";
import { SiteRenderer } from "@/components/siteflow/SiteRenderer";
import { useIsMobile } from "@/hooks/useMobile";
import { getTemplate, templateCatalog } from "../../../shared/siteflow";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Monitor, Tablet, Smartphone } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import type { DeviceMode } from "../../../shared/siteflow";

export default function TemplatePreview() {
  const [, params] = useRoute("/templates/:key");
  const [, setLocation] = useLocation();
  const key = params?.key ?? "nexus-saas";
  const template = useMemo(() => getTemplate(key), [key]);
  const summary = templateCatalog.find((item) => item.key === key) ?? templateCatalog[0];
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const isMobile = useIsMobile();
  const [dialog, setDialog] = useState(false);
  const utils = trpc.useUtils();
  const createSite = trpc.siteflow.create.useMutation({ onSuccess: (data) => { utils.siteflow.list.invalidate(); setLocation(`/editor/${data.site.id}`); } });
  const previewDevice = isMobile && device === "desktop" ? "mobile" : device;
  const width = previewDevice === "desktop" ? "100%" : previewDevice === "tablet" ? "min(100%, 760px)" : "100%";
  return <AppShell title={summary.name} action={<button onClick={() => setDialog(true)} className="siteflow-primary-btn !py-2 text-xs">Utiliser ce template<ArrowUpRight className="h-3.5 w-3.5" /></button>}><div className="mb-6 flex items-start justify-between gap-6"><div><button onClick={() => setLocation("/templates")} className="mb-4 flex items-center gap-1 text-xs font-bold text-[#6266CF]"><ArrowLeft className="h-3.5 w-3.5" />Bibliothèque</button><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#797CD9]">{summary.category}</p><h2 className="mt-1 font-display text-5xl tracking-[-.045em]">{summary.name}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#707387]">{summary.description}</p></div><div className="hidden items-center gap-1 rounded-xl border border-[#E3E3EB] bg-white p-1 md:flex">{([{ key: "desktop", icon: Monitor }, { key: "tablet", icon: Tablet }, { key: "mobile", icon: Smartphone }] as const).map((item) => <button key={item.key} onClick={() => setDevice(item.key)} className={`grid h-9 w-9 place-items-center rounded-lg ${device === item.key ? "bg-[#F0F0FF] text-[#2925D8]" : "text-[#787B8D]"}`}><item.icon className="h-4 w-4" /></button>)}</div></div><div className="grid gap-6 xl:grid-cols-[1fr_265px]"><div className="overflow-hidden rounded-2xl border border-[#DFE0E9] bg-[#ECECF3] p-5 shadow-[0_14px_44px_rgba(17,20,72,.08)]"><div className="mx-auto overflow-hidden bg-white shadow-[0_10px_40px_rgba(17,20,72,.15)]" style={{ width }}><SiteRenderer nodes={template.pages[0].elementTree} device={previewDevice} /></div></div><aside className="rounded-2xl border border-[#E4E4EC] bg-white p-5"><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#8A8D9C]">Le système</p><h3 className="mt-2 font-display text-3xl">Une base qui s’adapte.</h3><div className="mt-5 space-y-3">{["3 pages prêtes à ajuster", "Arbre d’éléments éditable", "Styles responsive isolés", "Aperçu et publication inclus"].map((text) => <div key={text} className="flex gap-2 text-xs leading-5 text-[#696C7F]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2925D8]" />{text}</div>)}</div><button onClick={() => setDialog(true)} className="siteflow-primary-btn mt-6 w-full justify-center">Utiliser {summary.name}</button></aside></div><CreateSiteDialog open={dialog} onClose={() => setDialog(false)} onCreate={(name, templateKey) => createSite.mutate({ name, templateKey })} initialTemplate={key} loading={createSite.isPending} /></AppShell>;
}
