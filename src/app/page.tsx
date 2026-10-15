"use client";

import { useState } from "react";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/three/Hero";
import { ProjectsSection } from "@/components/three/ProjectCard";
import { AboutSection } from "@/components/three/About";
import { ContactSection } from "@/components/three/Contact";
import { BootLoader } from "@/components/ui/BootLoader";
import { PipelineSimulator } from "@/components/ui/PipelineSimulator";
import { MLTerminal } from "@/components/ui/MLTerminal";
import { CVPlayground } from "@/components/ui/CVPlayground";
import { BackboneThread } from "@/components/ui/BackboneThread";
import { DataStreamTicker } from "@/components/ui/DataStreamTicker";

export default function Home() {
  const [booted, setBooted] = useState(false);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {!booted && <BootLoader onComplete={() => setBooted(true)} />}

      <Navigation />
      <BackboneThread />

      <main className="pt-16">
        <section id="home">
          <Hero started={booted} />
        </section>

        <section id="work">
          <ProjectsSection />
        </section>

        <section id="about">
          <AboutSection />
        </section>

        <section id="cnn">
          <PipelineSimulator />
        </section>

        <section id="terminal">
          <MLTerminal />
        </section>

        <section id="cv">
          <CVPlayground />
        </section>

        <section id="contact">
          <ContactSection />
        </section>
      </main>

      <DataStreamTicker />
      <Footer />
    </div>
  );
}
