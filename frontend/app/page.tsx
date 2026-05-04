import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import NavBar from "@/components/landing/NavigationBar";
import AboutSection from "@/components/landing/AboutSection";
import TeamSection from "@/components/landing/TeamSection";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main>
        <HeroSection />
        <AboutSection />
        <FeaturesSection />
        <CTASection />
        <TeamSection />
      </main>
      <Footer />
    </div>
  );
}
