import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import PublicNavbar from "@/components/landing/PublicNavbar";
import Hero from "@/components/landing/Hero";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorks from "@/components/landing/HowItWorks";
import Footer from "@/components/landing/Footer";

export default async function Home() {
  return (
    <>
      <PublicNavbar />
      <main>
        <Hero />
        <FeaturesSection />
        <HowItWorks />
      </main>
      <Footer />
    </>
  );
}