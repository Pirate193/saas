import Link from "next/link";
import {
  FolderOpen,
  FileText,
  Brain,
  MessageSquare,
  Upload,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { HeroHeader } from "@/components/landingpage/header";
import HeroSection from "@/components/landingpage/hero-section";
import Features from "@/components/landingpage/feature-section";
import Testimonials from "@/components/landingpage/Testimonials";
import CallToAction from "@/components/landingpage/calltoaction";
import FooterSection from "@/components/landingpage/footer";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen overflow-hidden  ">
      <HeroHeader />
      <HeroSection />
      <Features />
      <Testimonials />
      <CallToAction />
      <FooterSection />
    </main>
  );
}
