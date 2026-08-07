import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import NavBar from "@/components/landing/NavigationBar";
import AboutSection from "@/components/landing/AboutSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import TeamSection from "@/components/landing/TeamSection";
import ContactSection from "@/components/landing/ContactSection";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main>
        <HeroSection />
        <AboutSection />
        <HowItWorksSection />
        <FeaturesSection />
        <CTASection />
        <TeamSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}