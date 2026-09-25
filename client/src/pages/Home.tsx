import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { SiteFlowLogo } from "@/components/siteflow/AppShell";
import { ArrowRight, ChevronRight, Globe2, Layout, MousePointer2, Sparkles, Wand2 } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#F8F8FC] text-[#11172B] selection:bg-[#2925D8] selection:text-white">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-[#E5E5EF]/60 bg-white/80 backdrop-blur-xl">
        <div className="container flex h-20 items-center justify-between">
          <SiteFlowLogo />
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-bold text-[#61657A] transition-colors hover:text-[#2925D8]">Fonctionnalités</a>
            <a href="#templates" className="text-sm font-bold text-[#61657A] transition-colors hover:text-[#2925D8]">Templates</a>
            <a href="#showcase" className="text-sm font-bold text-[#61657A] transition-colors hover:text-[#2925D8]">Showcase</a>
          </nav>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <button onClick={() => setLocation("/dashboard")} className="siteflow-primary-btn">
                Aller au dashboard <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <>
                <button onClick={() => startLogin()} className="hidden text-sm font-bold text-[#61657A] hover:text-[#2925D8] sm:block">Se connecter</button>
                <button onClick={() => startLogin()} className="siteflow-primary-btn">
                  Commencer <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-5 py-24 lg:py-32">
          <div className="bg-dot-grid absolute inset-0 -z-10 opacity-40" />
          <div className="container relative text-center">
            <div className="mx-auto mb-8 flex w-fit items-center gap-2 rounded-full border border-[#D9D9F0] bg-[#F0F0FF] px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#2925D8]">
              <Sparkles className="h-3.5 w-3.5" /> SiteFlow Pro v2.0 est arrivé
            </div>
            <h1 className="mx-auto max-w-4xl font-display text-5xl leading-[1.1] tracking-tight sm:text-7xl lg:text-8xl">
              L’architecture <span className="text-[#2925D8]">no-code</span> poussée à son paroxysme.
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-[#61657A] sm:text-xl">
              Concevez des sites web professionnels avec une précision chirurgicale. Un éditeur canvas haute fidélité, une gestion des calques intuitive et un rendu responsive sans compromis.
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button onClick={() => startLogin()} className="siteflow-primary-btn !px-8 !py-4 !text-base shadow-2xl">
                Lancer l’atelier maintenant <Wand2 className="h-5 w-5" />
              </button>
              <button className="siteflow-secondary-btn !px-8 !py-4 !text-base">
                Explorer les templates
              </button>
            </div>

            {/* Visual Teaser */}
            <div className="relative mt-20 lg:mt-32">
              <div className="absolute -inset-4 -z-10 rounded-[40px] bg-gradient-to-b from-[#2925D8]/10 to-transparent blur-3xl opacity-50" />
              <div className="relative mx-auto max-w-6xl rounded-[32px] border border-white/40 bg-white/40 p-2 shadow-[0_40px_100px_rgba(17,20,70,.12)] backdrop-blur-sm">
                <div className="overflow-hidden rounded-[24px] border border-[#E5E5EF] bg-white shadow-inner">
                  <img 
                    src="/manus-storage/template-nexus-saas_c284fccd.png" 
                    alt="SiteFlow Pro Editor Interface" 
                    className="w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="bg-white py-24 lg:py-32">
          <div className="container">
            <div className="mb-20 text-center">
              <h2 className="font-display text-4xl sm:text-5xl">Conçu pour les exigeants.</h2>
              <p className="mt-4 text-[#61657A]">Des outils de grade professionnel, accessibles sans code.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                { icon: Layout, title: "Canvas Précis", desc: "Un éditeur wysiwyg qui respecte chaque pixel et chaque breakpoint." },
                { icon: Wand2, title: "Vibe Design", desc: "Des styles pré-configurés pour un rendu esthétique instantané." },
                { icon: Globe2, title: "Hébergement Live", desc: "Publiez en un clic sur un domaine sécurisé et optimisé." }
              ].map((f, i) => (
                <div key={i} className="group rounded-[32px] border border-[#E5E5EF] bg-[#F8F8FC] p-8 transition-all hover:border-[#2925D8]/20 hover:bg-white hover:shadow-xl">
                  <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#2925D8] shadow-sm group-hover:bg-[#2925D8] group-hover:text-white transition-colors">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">{f.title}</h3>
                  <p className="mt-4 leading-relaxed text-[#61657A]">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E5EF] bg-white py-12">
        <div className="container flex flex-col items-center justify-between gap-6 md:flex-row">
          <SiteFlowLogo />
          <p className="text-sm text-[#878A9C]">© 2026 SiteFlow Pro. Propulsé par Manus AI.</p>
          <div className="flex gap-6">
            <a href="#" className="text-sm font-bold text-[#61657A] hover:text-[#2925D8]">Twitter</a>
            <a href="#" className="text-sm font-bold text-[#61657A] hover:text-[#2925D8]">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
