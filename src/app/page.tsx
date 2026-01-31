'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LampContainer } from '@/components/ui/lamp';
import { FlipText } from '@/components/ui/flip-text';
import { Button } from '@/components/ui/Button';

// Landing Page Components
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { Problem } from '@/components/Problem';
import { HowItWorks } from '@/components/HowItWorks';
import { Features } from '@/components/Features';
import { WhyAI } from '@/components/WhyAI';
import { Pricing } from '@/components/Pricing';
import { Testimonials } from '@/components/Testimonials';
import { CallToAction } from '@/components/CallToAction';
import { Footer } from '@/components/Footer';

export default function Home() {
  // State to toggle between Intro and Landing Page
  const [showIntro, setShowIntro] = useState(true);

  if (showIntro) {
    return (
      <LampContainer>
        <div className="flex flex-col items-center justify-center text-center">
          <motion.h1
            initial={{ opacity: 0.5, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.3,
              duration: 0.8,
              ease: "easeInOut",
            }}
            className="mt-8 bg-gradient-to-br from-slate-300 to-slate-500 py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl"
          >
            Understanding Health <br /> Is The Right Way
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-12"
          >
            <Button
              size="lg"
              className="bg-lime-500 hover:bg-lime-400 hover:shadow-lime-500/50 text-slate-950 font-bold px-10 py-8 text-xl rounded-full shadow-[0_0_40px_rgba(132,204,22,0.3)] transition-all duration-300 border-none overflow-hidden"
              onClick={() => setShowIntro(false)}
            >
              <FlipText className="text-xl font-bold">Start The Website</FlipText>
            </Button>
          </motion.div>
        </div>
      </LampContainer>
    );
  }

  return (
    <main className="min-h-screen bg-white selection:bg-lime-200 selection:text-lime-900">
      <Navbar />
      <Hero />
      <Problem />
      <HowItWorks />
      <Features />
      <WhyAI />
      <Pricing />
      <Testimonials />
      <CallToAction />
      <Footer />
    </main>
  );
}
