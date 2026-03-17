"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Pen, CalendarDays, Send, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import * as THREE from 'three';

export default function Home() {
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const vantaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadVanta = async () => {
      if (typeof window !== "undefined") {
        (window as any).THREE = THREE;
        // @ts-ignore
        const { default: BIRDS } = await import('vanta/dist/vanta.birds.min');
        if (!vantaEffect && vantaRef.current) {
          setVantaEffect(
            BIRDS({
              el: vantaRef.current,
              THREE: window.THREE,
              mouseControls: true,
              touchControls: true,
              gyroControls: false,
              minHeight: 200.00,
              minWidth: 200.00,
              scale: 1.00,
              scaleMobile: 1.00,
              backgroundColor: 0x1f1612, // Deep warm charcoal/espresso backdrop
              color1: 0x8a6e4d, // Muted bronze birds
              color2: 0xbc5d45, // Soft terracotta birds
              birdSize: 1.2,
              wingSpan: 20.0,
              speedLimit: 2.5,
              separation: 80.0,
              alignment: 30.0,
              cohesion: 20.0,
              quantity: 4.0 // Less crowded
            })
          );
        }
      }
    };
    loadVanta();

    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navbar />

      {/* ===================== HERO ===================== */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-[#1f1612]">
        
        {/* Vanta 3D Background */}
        <div ref={vantaRef} className="absolute inset-0 z-0 opacity-80 pointer-events-none" />

        {/* Soft center glow to highlight text */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,169,110,0.08)_0%,transparent_50%)] z-0 pointer-events-none" />

        {/* Decorative lines */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 h-40 w-px bg-gradient-to-b from-transparent via-gold/30 to-transparent hidden lg:block" />
        <div className="absolute right-8 top-1/2 -translate-y-1/2 h-40 w-px bg-gradient-to-b from-transparent via-gold/30 to-transparent hidden lg:block" />

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto mt-16">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="h-px w-12 bg-gold/40" />
            <span className="font-sans text-xs uppercase tracking-[0.3em] text-gold/80">Digital Time Capsule</span>
            <div className="h-px w-12 bg-gold/40" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif font-light text-6xl md:text-8xl lg:text-9xl text-parchment leading-[0.9] tracking-tight mb-8 text-dreamy"
          >
            Write to the
            <br />
            <span className="italic text-gold font-normal">Future</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.9 }}
            className="font-serif font-light text-xl md:text-2xl text-parchment/60 max-w-xl mb-14 leading-relaxed tracking-wide italic"
          >
            A private sanctuary for the thoughts of today,
            <br className="hidden md:block" /> meant only for the eyes of tomorrow.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.6 }}
            className="flex flex-col sm:flex-row gap-5 items-center"
          >
            <Link
              href="/capsule/create"
              className="group relative px-10 py-4 bg-gold text-espresso font-sans text-xs uppercase tracking-[0.2em] overflow-hidden transition-all duration-500 hover:bg-terracotta"
            >
              <span className="relative z-10">Begin Writing</span>
              <div className="absolute inset-0 bg-terracotta translate-x-[-101%] group-hover:translate-x-0 transition-transform duration-500 ease-in-out" />
              <span className="absolute inset-0 flex items-center justify-center text-parchment font-sans text-xs uppercase tracking-[0.2em] z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Begin Writing</span>
            </Link>
            <Link
              href="#how-it-works"
              className="px-10 py-4 border border-parchment/30 text-parchment/80 font-sans text-xs uppercase tracking-[0.2em] hover:border-gold hover:text-gold transition-all duration-400"
            >
              Discover More
            </Link>
          </motion.div>
        </div>

        {/* Bottom scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-espresso/30">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-espresso/30 to-transparent" />
        </motion.div>
      </section>

      {/* ===================== PHILOSOPHY ===================== */}
      <section className="relative py-40 px-6 md:px-20 overflow-hidden bg-[#1f1612]">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-terracotta/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="h-px w-8 bg-gold/60" />
                <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta/80">Philosophy</span>
              </div>
              <h2 className="font-serif font-light text-5xl md:text-6xl text-parchment mb-10 leading-tight">
                Some messages are
                <br />
                <em className="font-normal text-gold/80 not-italic font-serif italic">not meant for today.</em>
              </h2>
              <div className="space-y-5 border-l-2 border-gold/30 pl-7">
                <p className="font-serif font-light text-lg text-parchment/70 leading-relaxed">
                  In an age of instant communication, we've lost the art of patience. The most profound feelings often need time to mature.
                </p>
                <p className="font-serif font-light text-lg text-parchment/70 leading-relaxed">
                  Some memories deserve to be preserved exactly as they were — safely locked away until the future is ready to receive them.
                </p>
              </div>
            </motion.div>

            {/* Visual */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="flex justify-center"
            >
              <div className="relative w-72 h-[420px]">
                {/* Shadow card */}
                <div className="absolute inset-0 bg-parchment/5 translate-x-4 translate-y-4 border border-parchment/10" />
                {/* Main card */}
                <div className="relative h-full bg-black/40 backdrop-blur-md border border-parchment/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] p-10 flex flex-col justify-between group hover:-translate-y-2 transition-transform duration-700">
                  <div className="space-y-3">
                    <div className="w-10 h-px bg-gold/50" />
                    <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-terracotta/80">Sealed Memory</span>
                  </div>
                  <p className="font-serif text-2xl text-parchment/80 italic leading-loose text-center drop-shadow-md">
                    "Dear future me,<br />
                    if you are reading this..."
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="w-10 h-px bg-gold/50" />
                    <Lock size={14} className="text-gold/50" />
                    <div className="w-10 h-px bg-gold/50" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section id="how-it-works" className="py-40 px-6 md:px-20 bg-espresso relative overflow-hidden">
        {/* Dot grid background */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #F3EDE3 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-24">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-12 bg-gold/40" />
              <span className="font-sans text-xs uppercase tracking-[0.3em] text-gold/60">The Process</span>
              <div className="h-px w-12 bg-gold/40" />
            </div>
            <h2 className="font-serif font-light text-5xl md:text-6xl text-parchment">
              How It <em className="italic font-normal text-gold">Works</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5">
            {[
              {
                num: "01",
                icon: <Pen className="w-6 h-6 text-gold/70" />,
                title: "Write your message",
                desc: "Pour your heart into a letter. Express what you feel today, for the eyes of the future."
              },
              {
                num: "02",
                icon: <CalendarDays className="w-6 h-6 text-gold/70" />,
                title: "Choose when it opens",
                desc: "Select a precise date — next month, next year, or a decade from now."
              },
              {
                num: "03",
                icon: <Send className="w-6 h-6 text-gold/70" />,
                title: "Seal it forever",
                desc: "The capsule is cryptographically locked until the exact moment arrives."
              }
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.8, delay: idx * 0.15 }}
                className="bg-black/30 backdrop-blur-sm p-12 flex flex-col group hover:bg-black/50 transition-colors duration-500 border border-parchment/5"
              >
                <div className="flex justify-between items-start mb-12">
                  <span className="font-serif text-[56px] font-light leading-none text-parchment/8 select-none">{step.num}</span>
                  <div className="w-10 h-10 border border-gold/20 flex items-center justify-center group-hover:border-gold/50 transition-colors duration-500">
                    {step.icon}
                  </div>
                </div>
                <h3 className="font-serif font-light text-2xl text-parchment mb-4">{step.title}</h3>
                <p className="font-sans text-sm font-light text-parchment/50 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== ANTICIPATION ===================== */}
      <section className="py-40 px-6 md:px-20 relative overflow-hidden bg-[#1f1612]">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-terracotta/5 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
            className="relative order-2 md:order-1"
          >
            <div className="relative max-w-sm mx-auto">
              {/* Back card */}
              <div className="absolute top-6 left-6 right-0 bottom-0 bg-parchment/5 border border-parchment/10" />
              {/* Front card */}
              <div className="relative bg-black/40 backdrop-blur-md border border-parchment/20 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] p-10 -rotate-1">
                <div className="flex justify-between items-center mb-8 pb-6 border-b border-parchment/10">
                  <h4 className="font-serif text-2xl text-parchment font-light">To: Future Me</h4>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                    <span className="text-[10px] uppercase tracking-widest text-terracotta/80 font-sans">Sealed</span>
                  </div>
                </div>
                <div className="mb-8 p-4 bg-black/30 border border-parchment/10">
                  <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-terracotta/60 mb-3">Unlocks In</p>
                  <div className="flex gap-6 font-serif text-4xl text-parchment/90 font-light drop-shadow-md">
                    <div className="flex flex-col items-center">
                      <span>02</span>
                      <span className="font-sans text-[9px] uppercase tracking-widest text-parchment/40 mt-1">Yrs</span>
                    </div>
                    <span className="text-parchment/20 self-start mt-2">·</span>
                    <div className="flex flex-col items-center">
                      <span>05</span>
                      <span className="font-sans text-[9px] uppercase tracking-widest text-parchment/40 mt-1">Mos</span>
                    </div>
                    <span className="text-parchment/20 self-start mt-2">·</span>
                    <div className="flex flex-col items-center">
                      <span>18</span>
                      <span className="font-sans text-[9px] uppercase tracking-widest text-parchment/40 mt-1">Days</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {[100, 88, 75, 92, 60].map((w, i) => (
                    <div key={i} className="h-2 bg-parchment/10 rounded-sm" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="order-1 md:order-2"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-8 bg-gold/60" />
              <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta/80">Experience</span>
            </div>
            <h2 className="font-serif font-light text-5xl md:text-6xl text-parchment mb-8 leading-tight">
              The Art of
              <br />
              <em className="italic font-normal text-gold/80">Anticipation</em>
            </h2>
            <div className="space-y-5 border-l-2 border-gold/30 pl-7">
              <p className="font-serif font-light text-lg text-parchment/70 leading-relaxed">
                Watch the countdown gracefully tick away. The waiting is part of the experience, building anticipation for the moment the seal finally breaks.
              </p>
              <p className="font-serif font-light text-lg text-parchment/70 leading-relaxed">
                When the time comes, the lock will lift — revealing the exact words you needed to hear.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===================== FINAL CTA ===================== */}
      <section className="relative py-56 px-6 overflow-hidden bg-espresso">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #C8A96E 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-terracotta/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <div className="flex items-center justify-center gap-3 mb-10">
              <div className="h-px w-12 bg-gold/40" />
              <span className="font-sans text-xs uppercase tracking-[0.3em] text-gold/60">Begin</span>
              <div className="h-px w-12 bg-gold/40" />
            </div>
            <h2 className="font-serif font-light text-6xl md:text-8xl text-parchment mb-14 leading-tight">
              Start Writing Your
              <br />
              <em className="italic font-normal text-gold">Future Memory</em>
            </h2>
            <Link
              href="/capsule/create"
              className="inline-flex items-center gap-3 px-12 py-5 border border-gold/50 text-parchment font-sans text-xs uppercase tracking-[0.25em] hover:bg-gold/10 hover:border-gold transition-all duration-500"
            >
              Create Capsule
              <span className="text-gold">→</span>
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
