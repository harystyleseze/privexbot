import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { ValuePropositions } from "@/components/landing/ValuePropositions";
import { ProductOverview } from "@/components/landing/ProductOverview";
import { Features } from "@/components/landing/Features";
import { Testimonials } from "@/components/landing/Testimonials";
import { Pricing } from "@/components/landing/Pricing";
import { CaseStudies } from "@/components/landing/CaseStudies";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <ValuePropositions />
        <ProductOverview />
        <Features />
        <Testimonials />
        <Pricing />
        <CaseStudies />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
