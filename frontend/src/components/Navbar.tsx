"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      setUserEmail(session?.user?.email ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      setUserEmail(session?.user?.email ?? null);
    });

    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMobileMenuOpen(false);
    router.push("/");
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "Create", href: "/capsule/create" },
  ];

  // Hide navbar on auth pages
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <nav
      className={`w-full py-5 px-8 md:px-16 flex items-center justify-between fixed top-0 z-50 transition-all duration-700 ease-in-out ${
        scrolled
          ? "bg-[#1f1612]/90 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] border-b border-parchment/10"
          : "bg-transparent"
      }`}
    >
      {/* Logo / Left Side */}
      <Link href="/" className="flex flex-1 items-center gap-3 group">
        <div className={`w-6 h-6 border flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity border-parchment`}>
          <div className="w-2 h-2 bg-terracotta" />
        </div>
        <span className={`font-serif text-xl font-light tracking-wide transition-colors text-parchment`}>
          Time Capsule
        </span>
      </Link>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center justify-center flex-1">
        <div className={`flex items-center gap-12 px-10 py-3.5 rounded-full transition-all duration-500 ${scrolled ? 'bg-black/20' : 'bg-black/20 backdrop-blur-md border border-parchment/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]'}`}>
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`relative font-sans text-xs uppercase tracking-[0.25em] transition-colors duration-300 font-bold group ${
                pathname === link.href
                  ? scrolled ? "text-terracotta" : "text-gold"
                  : "text-parchment hover:text-terracotta"
              }`}
            >
              <span className="relative z-10">{link.name}</span>
              {/* Custom animated underline */}
              <span className={`absolute -bottom-2 left-1/2 w-0 h-[2px] -translate-x-1/2 transition-all duration-300 group-hover:w-full ${scrolled ? 'bg-terracotta' : 'bg-gold'} ${pathname === link.href ? 'w-full' : ''}`} />
            </Link>
          ))}
        </div>
      </div>

      {/* Auth / Right Side */}
      <div className="hidden md:flex flex-1 items-center justify-end gap-5">
        {isLoggedIn ? (
          <div className="flex items-center gap-5">
            <span className={`font-sans text-[11px] truncate max-w-[120px] tracking-wider text-parchment/60`}>
              {userEmail}
            </span>
            <button
              onClick={handleLogout}
              className={`flex items-center gap-2 font-sans text-xs uppercase tracking-[0.15em] font-bold transition-all duration-300 group px-4 py-2 border rounded-sm text-parchment border-parchment/20 hover:border-terracotta hover:text-terracotta hover:bg-terracotta/10`}
            >
              <LogOut size={13} className="group-hover:translate-x-0.5 transition-transform" />
              Logout
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className={`font-sans text-xs font-bold uppercase tracking-[0.2em] px-8 py-3 border transition-all duration-300 shadow-sm hover:shadow-md border-gold/50 text-gold hover:bg-gold hover:text-espresso`}
          >
            Login
          </Link>
        )}
      </div>

      {/* Mobile Toggle */}
      <button
        className={`md:hidden transition-colors text-parchment/80 hover:text-parchment`}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle Menu"
      >
        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute top-full left-0 w-full bg-[#1f1612]/95 backdrop-blur-md border-b border-parchment/10 shadow-lg flex flex-col items-center py-10 gap-8 md:hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`font-sans text-sm font-bold uppercase tracking-[0.25em] transition-colors ${
                  pathname === link.href ? "text-terracotta" : "text-parchment/80"
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="w-12 h-px bg-parchment/20" />
            {isLoggedIn ? (
              <>
                <span className="font-sans text-xs text-parchment/40">{userEmail}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-[0.2em] text-parchment/60 hover:text-terracotta transition-colors"
                >
                  <LogOut size={13} />
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-sans text-xs font-bold uppercase tracking-[0.2em] px-8 py-3 border border-parchment/20 text-parchment hover:border-terracotta hover:text-terracotta transition-all"
              >
                Login
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
