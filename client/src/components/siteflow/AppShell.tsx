import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { BarChart3, BookOpen, ChevronDown, CircleHelp, Code2, FileText, LayoutTemplate, Plus, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useLocation } from "wouter";

type AppShellProps = { children: ReactNode; title?: string; action?: ReactNode; chrome?: "standard" | "dashboard" };

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
      {!compact ? <span className="whitespace-nowrap text-[20px] font-extrabold leading-none tracking-[-.05em] text-[#11172B]">SiteFlow <em className="not-italic text-[#2925D8]">Pro</em></span> : null}
    </div>
  );
}

export function AppShell({ children, title, action, chrome = "standard" }: AppShellProps) {
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
    <div className="min-h-screen bg-white text-[#11172B]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[136px] flex-col border-r border-[#E3E4EA] bg-white lg:flex">
        <div className="border-b border-[#E9EAF0] px-3 py-5"><SiteFlowLogo /></div>
        <nav className="flex-1 px-2 py-4" aria-label="Navigation principale">
          <p className="px-2 pb-2 text-[9px] font-extrabold uppercase tracking-[.13em] text-[#9295A5]">Workspace</p>
          {navigation.map((item) => {
            const active = location === item.path || (item.path !== "/" && location.startsWith(item.path));
            return <button key={item.path} onClick={() => setLocation(item.path)} className={cn("siteflow-nav-item", active && "siteflow-nav-item-active")}><item.icon className="h-4 w-4" />{item.label}</button>;
          })}
          <div className="my-4 border-t border-[#EEEFF5]" />
          <button onClick={() => setLocation("/templates")} className="siteflow-upgrade-card">
            <Sparkles className="h-4 w-4 text-[#2925D8]" />
            <span><strong>La bibliothèque Pro</strong><small>Explorez vos points de départ.</small></span>
          </button>
        </nav>
        <div className="space-y-1 border-t border-[#ECECF2] p-2">
          <button className="siteflow-nav-item"><CircleHelp className="h-4 w-4" />Aide et feedback</button>
          <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-[#F4F4F9]">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#EEF0FF] text-[10px] font-extrabold text-[#2925D8]">{(user.name || "U").slice(0, 1).toUpperCase()}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold">{user.name || "Mon compte"}</span><span className="block text-[10px] text-[#85889A]">Free Plan</span></span>
          </button>
        </div>
      </aside>
      <div className="lg:pl-[136px]">
        {chrome === "standard" ? <header className="sticky top-0 z-20 flex min-h-[72px] items-center justify-between border-b border-[#E7E7EF] bg-white px-5 lg:px-8">
          <div className="flex items-center gap-3"><button className="grid h-9 w-9 place-items-center rounded-lg border border-[#E3E3EC] bg-white lg:hidden" onClick={() => setLocation("/")} aria-label="Aller au tableau de bord"><Code2 className="h-4 w-4" /></button>{title ? <h1 className="text-[20px] font-bold tracking-[-.03em]">{title}</h1> : null}</div>
          <div className="flex items-center gap-3">{action}</div>
        </header> : null}
        <main className={chrome === "dashboard" ? "px-5 py-5 lg:px-7 lg:pb-7 lg:pt-[68px]" : "p-5 lg:p-7"}>{children}</main>
      </div>
    </div>
  );
}

export function CreateSiteButton({ onClick, compact = false }: { onClick: () => void; compact?: boolean }) {
  return <button className={cn("siteflow-primary-btn", compact && "h-10 px-4 text-sm")} onClick={onClick}><Plus className="h-4 w-4" />Créer un site</button>;
}
