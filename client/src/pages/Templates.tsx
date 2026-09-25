import { AppShell, CreateSiteButton } from "@/components/siteflow/AppShell";
import { CreateSiteDialog } from "@/components/siteflow/CreateSiteDialog";
import { templateCatalog } from "../../../shared/siteflow";
import { ArrowUpRight, CheckCircle2, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Templates() {
  const [location, setLocation] = useLocation();
  const [category, setCategory] = useState("Tous");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const utils = trpc.useUtils();
  const createSite = trpc.siteflow.create.useMutation({ onSuccess: (data) => { utils.siteflow.list.invalidate(); setLocation(`/editor/${data.site.id}`); } });
  const categories = ["Tous", ...Array.from(new Set(templateCatalog.map((template) => template.category)))];
  const templates = useMemo(() => templateCatalog.filter((template) => (category === "Tous" || template.category === category) && `${template.name} ${template.category}`.toLowerCase().includes(query.toLowerCase())), [category, query]);
  return <AppShell title="Bibliothèque de templates" action={<CreateSiteButton onClick={() => { setSelectedTemplate("blank"); setCreateOpen(true); }} />}>
    <section className="mb-9 grid gap-6 xl:grid-cols-[1fr_auto] xl:items-end"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#6D70D8]">Points de départ</p><h2 className="max-w-2xl font-display text-[42px] leading-none tracking-[-.045em]">Une direction claire avant le premier détail.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-[#6C7082]">Chaque template est importé dans le même modèle de pages et d’éléments que vos sites vierges.</p></div><div className="flex items-center gap-2 rounded-2xl border border-[#E6E6EE] bg-white px-4 py-3 text-xs text-[#6D7082]"><CheckCircle2 className="h-4 w-4 text-[#2925D8]" />10 systèmes de contenu prêts à être adaptés.</div></section>
    <section className="mb-7 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex max-w-full gap-2 overflow-x-auto pb-1">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold ${category === item ? "border-[#2925D8] bg-[#2925D8] text-white" : "border-[#DFE0EA] bg-white text-[#666A7C] hover:border-[#BDBEE1]"}`}>{item}</button>)}</div><label className="siteflow-search w-full lg:w-[280px]"><Search className="h-4 w-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher" /></label></section>
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{templates.map((template) => <article key={template.key} className="group overflow-hidden rounded-2xl border border-[#E3E3EC] bg-white transition-all hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(25,29,93,.11)]"><div className="relative h-48 overflow-hidden bg-[#F0F0F5]"><img src={template.cover} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /><span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#5F6275]">{template.category}</span></div><div className="p-5"><h3 className="font-display text-[28px] tracking-[-.03em]">{template.name}</h3><p className="mt-2 min-h-10 text-xs leading-5 text-[#737688]">{template.description}</p><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={() => setLocation(`/templates/${template.key}`)} className="siteflow-secondary-btn justify-center !px-3 !py-2.5 text-xs">Voir</button><button onClick={() => { setSelectedTemplate(template.key); setCreateOpen(true); }} className="siteflow-primary-btn justify-center !px-3 !py-2.5 text-xs">Utiliser<ArrowUpRight className="h-3.5 w-3.5" /></button></div></div></article>)}</div>
    <CreateSiteDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={(name, templateKey) => createSite.mutate({ name, templateKey })} initialTemplate={selectedTemplate} loading={createSite.isPending} />
  </AppShell>;
}
