import { CreateSiteDialog } from "@/components/siteflow/CreateSiteDialog";
import { AppShell, CreateSiteButton } from "@/components/siteflow/AppShell";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowUpRight, ChevronDown, Copy, Ellipsis, Eye, FilePenLine, FolderOpen, Heart, LayoutGrid, List, Pencil, Search, Settings2, Trash2, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

const covers: Record<string, string> = { "nexus-saas": "/manus-storage/template-nexus-saas_c284fccd.png", "atelier-restaurant": "/manus-storage/template-atelier-restaurant_a7a3c5f0.png", "arc-estate": "/manus-storage/template-arc-real-estate_e312de0e.png", "canvas-portfolio": "/manus-storage/template-canvas-portfolio_56be5412.png", blank: "/manus-storage/template-nexus-saas_c284fccd.png" };

export default function Dashboard() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "favorites">("all");
  const utils = trpc.useUtils();
  const sitesQuery = trpc.siteflow.list.useQuery(undefined, { enabled: Boolean(user) });
  const createSite = trpc.siteflow.create.useMutation({ onSuccess: (data) => { utils.siteflow.list.invalidate(); setLocation(`/editor/${data.site.id}`); } });
  const updateSite = trpc.siteflow.update.useMutation({ onSuccess: () => utils.siteflow.list.invalidate() });
  const removeSite = trpc.siteflow.remove.useMutation({ onSuccess: () => utils.siteflow.list.invalidate() });
  const duplicateSite = trpc.siteflow.duplicate.useMutation({ onSuccess: () => utils.siteflow.list.invalidate() });
  const publishSite = trpc.siteflow.publish.useMutation({ onSuccess: () => utils.siteflow.list.invalidate() });
  const visibleSites = useMemo(() => (sitesQuery.data ?? []).filter((site) => {
    const matchesQuery = site.name.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "favorites" ? site.isFavorite : site.status === filter);
    return matchesQuery && matchesFilter;
  }), [filter, query, sitesQuery.data]);

  return <AppShell chrome="dashboard">
    <section className="mb-8 flex items-start justify-between gap-6">
      <div><p className="text-[13px] text-[#626779]">Bienvenue, <strong className="font-bold text-[#171A27]">{user?.name?.split(" ")[0] || "créateur"}</strong></p>
      <p className="mt-1 text-[14px] text-[#666B7D]">Gérez vos sites, suivez leur activité et retrouvez vos derniers travaux.</p></div>
      <CreateSiteButton onClick={() => setCreateOpen(true)} />
    </section>
    <section className="siteflow-dashboard-controls mb-7">
      <label className="siteflow-search"><Search className="h-[18px] w-[18px]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher des sites…" /></label>
      <div className="siteflow-dashboard-filters" role="tablist">{([{ key: "all", label: "Tous" }, { key: "published", label: "Publiés" }, { key: "draft", label: "Brouillons" }, { key: "favorites", label: "Favoris" }] as const).map((item) => <button key={item.key} onClick={() => setFilter(item.key)} className={filter === item.key ? "siteflow-dashboard-filter-active" : ""}>{item.label}</button>)}<button className="siteflow-dashboard-sort">Trier : Récent <ChevronDown className="h-4 w-4" /></button><button className="siteflow-dashboard-view-active" aria-label="Vue grille"><LayoutGrid className="h-4 w-4" /></button><button className="siteflow-dashboard-view" aria-label="Vue liste"><List className="h-4 w-4" /></button></div>
    </section>
    {sitesQuery.isError ? <section className="grid min-h-[360px] place-items-center rounded-xl border border-dashed border-[#DCDDE6] bg-white p-8 text-center"><div><div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-[#F0DADD] bg-[#FFF7F8] text-[#A14B58]">!</div><h3 className="mt-4 text-lg font-bold">Impossible de charger vos sites.</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#717487]">Votre session ou la connexion a peut-être expiré. Réessayez sans perdre votre espace de travail.</p><button onClick={() => sitesQuery.refetch()} className="siteflow-primary-btn mt-5">Réessayer</button></div></section> : sitesQuery.isLoading ? <div className="siteflow-site-grid">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-[470px] animate-pulse rounded-xl bg-[#F4F5F8]" />)}</div> : visibleSites.length ? <div className="siteflow-site-grid">{visibleSites.map((site) => <article key={site.id} className="siteflow-site-card"><div className="relative h-[242px] overflow-hidden border-b border-[#E7E8ED] bg-[#F3F4F7]"><img src={covers[site.templateKey] ?? covers.blank} alt="" className="h-full w-full object-cover object-top" /><span className={`absolute left-4 top-4 rounded-md px-2.5 py-1 text-[11px] font-bold ${site.status === "published" ? "bg-white text-[#202636] shadow-sm" : "bg-white text-[#606677] shadow-sm"}`}>{site.status === "published" ? "Publié" : "Brouillon"}</span></div><div className="p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-[16px] font-bold tracking-[-.02em]">{site.name}</h3><p className="mt-2 text-[13px] text-[#656B7C]">{site.slug}.siteflow.io</p></div><button className="mt-0.5 text-[#383E4D]" aria-label="Options"><Ellipsis className="h-5 w-5" /></button></div><div className="my-4 grid grid-cols-2 border-y border-[#ECECF1] py-3.5 text-[12px]"><span><small className="block text-[#777C8D]">{site.status === "published" ? "Visiteurs (30j)" : "Statut"}</small><strong className="mt-1 block text-[16px] font-semibold">{site.status === "published" ? "12.4k" : "En cours"}</strong></span><span className="border-l border-[#ECECF1] pl-5"><small className="block text-[#777C8D]">Dernière édition</small><strong className="mt-1 block text-[16px] font-semibold">{new Date(site.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</strong></span></div><div className="grid grid-cols-2 gap-2"><button onClick={() => setLocation(`/editor/${site.id}`)} className="siteflow-card-action"><FilePenLine className="h-4 w-4" />{site.status === "published" ? "Éditer" : "Continuer"}</button><button onClick={() => setLocation(`/preview/${site.id}`)} className="siteflow-card-action"><Eye className="h-4 w-4" />Aperçu</button></div><div className="mt-3 flex items-center gap-3 border-t border-[#ECECF1] pt-3 text-[11px] font-semibold text-[#707587]"><button onClick={() => duplicateSite.mutate({ siteId: site.id })} className="hover:text-[#2925D8]"><Copy className="mr-1 inline h-3.5 w-3.5" />Dupliquer</button><button onClick={() => { const name = window.prompt("Nouveau nom du site", site.name); if (name?.trim()) updateSite.mutate({ siteId: site.id, name }); }} className="hover:text-[#2925D8]"><Pencil className="mr-1 inline h-3.5 w-3.5" />Renommer</button><button onClick={() => updateSite.mutate({ siteId: site.id, isFavorite: !site.isFavorite })} className="ml-auto hover:text-[#2925D8]" aria-label="Favori"><Heart className={`h-3.5 w-3.5 ${site.isFavorite ? "fill-current text-[#2925D8]" : ""}`} /></button><button onClick={() => window.confirm(`Supprimer ${site.name} ?`) && removeSite.mutate({ siteId: site.id })} className="text-[#A14B58]" aria-label="Supprimer"><Trash2 className="h-3.5 w-3.5" /></button></div></div></article>)}</div> : <section className="grid min-h-[360px] place-items-center rounded-xl border border-dashed border-[#DCDDE6] bg-white p-8 text-center"><div><div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-[#E8E9F2] bg-[#F8F8FC] text-[#2925D8]"><Wrench className="h-5 w-5" /></div><h3 className="mt-4 text-lg font-bold">Commencez votre premier projet.</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#717487]">Créez une page vierge ou choisissez un template pour composer votre site.</p><button onClick={() => setCreateOpen(true)} className="siteflow-primary-btn mt-5"><ArrowUpRight className="h-4 w-4" />Créer un site</button></div></section>}
    <CreateSiteDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={(name, templateKey) => createSite.mutate({ name, templateKey })} loading={createSite.isPending} />
  </AppShell>;
}
