import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import Analytics from "./pages/Analytics";
import PublicSite from "./pages/PublicSite";
import Resources from "./pages/Resources";
import SitePreview from "./pages/SitePreview";
import TemplatePreview from "./pages/TemplatePreview";
import Templates from "./pages/Templates";
import Home from "./pages/Home";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/templates"} component={Templates} />
      <Route path={"/templates/:key"} component={TemplatePreview} />
      <Route path={"/analytics"} component={Analytics} />
      <Route path={"/resources"} component={Resources} />
      <Route path={"/editor/:id"} component={Editor} />
      <Route path={"/preview/:id"} component={SitePreview} />
      <Route path={"/s/:slug"} component={PublicSite} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
