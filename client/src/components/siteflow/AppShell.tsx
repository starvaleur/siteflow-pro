import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { BarChart3, BookOpen, ChevronDown, CircleHelp, Code2, FileText, LayoutTemplate, Plus, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useLocation } from "wouter";

type AppShellProps = { children: ReactNode; title?: string; action?: ReactNode };

const navigation = [
  { label: "Mes sites", path: "/", icon: LayoutTemplate },
  { label: "Templates", path: "/templates", icon: BookOpen },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Ressources", path: "/resources", icon: FileText },
];

export function SiteFlowLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <img src="/manus-storage/siteflow-logo-mark_f1109625.png" alt="" className="h-7 w-7 shrink-0 object-contain" />
      {!compact ? <span className="font-display text-[25px] leading-none tracking-[-0.045em] text-[#2522C5]">SiteFlow <em className="not-italic text-[#11172B]">Pro</em></span> : null}
    </div>
  );
}

export function AppShell({ children, title, action }: AppShellProps) {
  const [location, setLocation] = useLocation();
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-[#F8F8FC]"><div className="siteflow-loader" /></div>;
  }

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F8F8FC] px-5">
        <section className="w-full max-w-md rounded-[24px] border border-[#E5E5EF] bg-white p-9 text-center shadow-[0_20px_80px_rgba(41,37,216,.08)]">
          <div className="mx-auto mb-7 w-fit"><SiteFlowLogo /></div>
          <h1 className="font-display text-4xl leading-tight text-[#11172B]">L’atelier de votre prochain site.</h1>
          <p className="mt-4 text-sm leading-6 text-[#61657A]">Connectez-vous pour retrouver vos espaces, vos sites et vos versions publiées.</p>
          <button onClick={() => startLogin()} className="siteflow-primary-btn mt-7 w-full justify-center">Se connecter</button>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8FC] text-[#11172B]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r border-[#E4E4EC] bg-white lg:flex">
        <div className="border-b border-[#ECECF2] px-6 py-[23px]"><SiteFlowLogo /></div>
        <nav className="flex-1 px-3 py-5" aria-label="Navigation principale">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#9295A5]">Workspace</p>
          {navigation.map((item) => {
            const active = location === item.path || (item.path !== "/" && location.startsWith(item.path));
            return <button key={item.path} onClick={() => setLocation(item.path)} className={cn("siteflow-nav-item", active && "siteflow-nav-item-active")}><item.icon className="h-4 w-4" />{item.label}</button>;
          })}
          <div className="my-5 border-t border-[#EEEFF5]" />
          <button onClick={() => setLocation("/templates")} className="siteflow-upgrade-card">
            <Sparkles className="h-4 w-4 text-[#2925D8]" />
            <span><strong>La bibliothèque Pro</strong><small>Explorez vos points de départ.</small></span>
          </button>
        </nav>
        <div className="space-y-1 border-t border-[#ECECF2] p-3">
          <button className="siteflow-nav-item"><CircleHelp className="h-4 w-4" />Aide et feedback</button>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-[#F4F4F9]">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#EEF0FF] text-xs font-extrabold text-[#2925D8]">{(user.name || "U").slice(0, 1).toUpperCase()}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{user.name || "Mon compte"}</span><span className="block text-xs text-[#85889A]">Plan gratuit</span></span>
            <ChevronDown className="h-4 w-4 text-[#8D90A2]" />
          </button>
        </div>
      </aside>
      <div className="lg:pl-[232px]">
        <header className="sticky top-0 z-20 flex min-h-[76px] items-center justify-between border-b border-[#E7E7EF]/80 bg-[#F8F8FC]/90 px-5 backdrop-blur lg:px-9">
          <div className="flex items-center gap-3"><button className="grid h-9 w-9 place-items-center rounded-lg border border-[#E3E3EC] bg-white lg:hidden" onClick={() => setLocation("/")} aria-label="Aller au tableau de bord"><Code2 className="h-4 w-4" /></button>{title ? <h1 className="font-display text-[30px] tracking-[-.035em]">{title}</h1> : null}</div>
          <div className="flex items-center gap-3">{action}</div>
        </header>
        <main className="p-5 lg:p-9">{children}</main>
      </div>
    </div>
  );
}

export function CreateSiteButton({ onClick, compact = false }: { onClick: () => void; compact?: boolean }) {
  return <button className={cn("siteflow-primary-btn", compact && "h-10 px-4 text-sm")} onClick={onClick}><Plus className="h-4 w-4" />Créer un site</button>;
}
