import { AlertTriangle, RotateCcw } from "lucide-react";
import React, { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-[#F8F8FC] px-5 py-10 text-[#11172B]">
          <section className="w-full max-w-lg rounded-[24px] border border-[#E5E5EF] bg-white p-8 text-center shadow-[0_20px_80px_rgba(41,37,216,.08)]">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#FFF1E8] text-[#A85E31]" aria-hidden="true">
              <AlertTriangle className="h-6 w-6" />
            </span>
            <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#7074D7]">SiteFlow Pro</p>
            <h1 className="mt-2 font-display text-3xl leading-tight">Cette vue a rencontré un problème.</h1>
            <p className="mt-3 text-sm leading-6 text-[#717487]">Votre travail enregistré est conservé. Rechargez la vue pour reprendre votre session.</p>
            <button
              onClick={() => window.location.reload()}
              className="siteflow-primary-btn mx-auto mt-6 justify-center"
            >
              <RotateCcw className="h-4 w-4" />
              Recharger la vue
            </button>
            {this.state.error ? (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-[11px] font-bold text-[#777A8D]">Détails techniques</summary>
                <pre className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap rounded-xl bg-[#F7F7FA] p-3 text-[10px] leading-4 text-[#777A8D]">{this.state.error.stack ?? this.state.error.message}</pre>
              </details>
            ) : null}
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
