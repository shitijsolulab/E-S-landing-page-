import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/coverline/Header";
import { CitationProvider } from "@/components/coverline/CitationPanel";
import { CtaModal } from "@/components/coverline/CtaModal";
import { Footer } from "@/components/coverline/Footer";

import {
  Hero,
  ProofBand,
  Problem,
  HowItWorks,
  MarketPlanSection,
  YourPanel,
} from "@/components/coverline/SectionsTop";
import {
  PlacementBand,
  Trial,
  Pricing,
  Results,
  FinalCta,
  Faq,
} from "@/components/coverline/SectionsBottom";

const TITLE = "Coverline — Know where every submission belongs";
const DESC =
  "Coverline reads the retail submission, checks it against your carrier panel's actual appetite, ranks the markets that will write it, and tells you what each carrier still needs.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <CitationProvider>
      <div className="bg-background">
        <Header />
        <main>
          <Hero />
          <ProofBand />
          <Problem />
          <HowItWorks />
          <MarketPlanSection />
          <YourPanel />
          <PlacementBand />
          <Trial />
          <Pricing />
          <Results />
          <FinalCta />
          <Faq />
        </main>
        <Footer />
      <CtaModal />
      </div>
    </CitationProvider>
  );
}

