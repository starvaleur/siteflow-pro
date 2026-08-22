import { templateCatalog } from "../../../../shared/siteflow";
import { Check, ChevronLeft, LayoutTemplate, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";

export function CreateSiteDialog({ open, onClose, onCreate, loading, initialTemplate = "blank" }: { open: boolean; onClose: () => void; onCreate: (name: string, templateKey: string) => void; loading?: boolean; initialTemplate?: string }) {
  const [step, setStep] = useState<"choose" | "name">("choose");
  const [selected, setSelected] = useState(initialTemplate);
  const [name, setName] = useState("");
  const selectedTemplate = useMemo(() => templateCatalog.find((template) => template.key === selected), [selected]);
  if (!open) return null;

  return (
    <div className="siteflow-modal-backdrop" role="presentation">
      <section className="siteflow-dialog" role="dialog" aria-modal="true" aria-labelledby="create-site-title">
        <header className="flex items-start justify-between border-b border-[#ECECF2] px-7 py-6">
          <div>{step === "name" ? <button onClick={() => setStep("choose")} className="mb-2 flex items-center gap-1 text-xs font-bold text-[#5F62D9]"><ChevronLeft className="h-3.5 w-3.5" />Retour aux modèles</button> : null}<p className="mb-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#7377D9]">Nouveau projet</p><h2 id="create-site-title" className="font-display text-[32px] tracking-[-.035em]">{step === "choose" ? "Choisissez votre départ." : "Nommez votre site."}</h2></div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-[#6A6E81] hover:bg-[#F3F3F8]" aria-label="Fermer"><X className="h-5 w-5" /></button>
        </header>
        {step === "choose" ? (
          <div className="max-h-[65vh] overflow-y-auto p-7">
            <button onClick={() => setSelected("blank")} className={`mb-5 flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${selected === "blank" ? "border-[#2925D8] bg-[#F3F3FF] shadow-[0_0_0_3px_rgba(41,37,216,.08)]" : "border-[#E5E5EF] hover:border-[#CFCFF0]"}`}><span className="grid h-12 w-12 place-items-center rounded-xl bg-[#11172B] text-white"><LayoutTemplate className="h-5 w-5" /></span><span className="flex-1"><strong className="block text-sm">Page vierge</strong><small className="mt-0.5 block text-xs leading-5 text-[#6E7184]">Commencez avec une structure claire et composez chaque détail.</small></span>{selected === "blank" ? <Check className="h-5 w-5 text-[#2925D8]" /> : null}</button>
            <div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#2925D8]" /><h3 className="text-sm font-bold">Partir d’un template</h3></div>
            <div className="grid gap-3 sm:grid-cols-2">
              {templateCatalog.slice(0, 6).map((template) => <button key={template.key} onClick={() => setSelected(template.key)} className={`overflow-hidden rounded-2xl border text-left transition-all ${selected === template.key ? "border-[#2925D8] shadow-[0_0_0_3px_rgba(41,37,216,.08)]" : "border-[#E5E5EF] hover:-translate-y-0.5 hover:border-[#CFCFF0]"}`}><img src={template.cover} alt="" className="h-24 w-full object-cover" /><span className="flex items-center justify-between px-3 py-3"><span><strong className="block text-sm">{template.name}</strong><small className="text-xs text-[#777A8D]">{template.category}</small></span>{selected === template.key ? <Check className="h-4 w-4 text-[#2925D8]" /> : null}</span></button>)}
            </div>
          </div>
        ) : (
          <div className="p-7"><div className="mb-6 rounded-2xl border border-[#E7E7EF] bg-[#FAFAFD] p-4"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#85889A]">Point de départ</p><p className="mt-1 text-sm font-bold text-[#11172B]">{selected === "blank" ? "Page vierge" : `${selectedTemplate?.name} — ${selectedTemplate?.category}`}</p></div><label className="mb-2 block text-sm font-bold">Nom du site</label><input autoFocus value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && name.trim() && onCreate(name, selected)} placeholder="Ex. Studio Onda" className="siteflow-input h-12 w-full" /><p className="mt-3 text-xs leading-5 text-[#777A8D]">Vous pourrez modifier le domaine et les réglages de publication plus tard.</p></div>
        )}
        <footer className="flex justify-end gap-3 border-t border-[#ECECF2] px-7 py-5"><button onClick={onClose} className="siteflow-secondary-btn">Annuler</button>{step === "choose" ? <button onClick={() => setStep("name")} className="siteflow-primary-btn">Continuer</button> : <button disabled={!name.trim() || loading} onClick={() => onCreate(name, selected)} className="siteflow-primary-btn disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Création…" : "Créer et ouvrir l’éditeur"}</button>}</footer>
      </section>
    </div>
  );
}
