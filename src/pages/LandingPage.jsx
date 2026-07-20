"use client";

import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  X,
  Copy,
  Check,
  ChevronDown,
  Sparkles,
  Shield,
  RefreshCw,
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("waiter");
  const [salary, setSalary] = useState(15000);
  const [generatedLink, setGeneratedLink] = useState("");
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(0);

  const roles = ["Waiter", "Chef", "Cashier", "Steward"];

  const generateLink = () => {
    const link = `https://payroller.co/invite/${selectedRole.toLowerCase()}-${salary}-xyz`;
    setGeneratedLink(link);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const faqs = [
    {
      q: "How do new employees join the system?",
      a: "You generate an onboarding invite link from your dashboard, pre-set their role and basic wage, and send it via WhatsApp. They enter their details, and they are instantly added to your active staff roster.",
    },
    {
      q: "Can I customize bonuses, advances, and breakages?",
      a: "Yes. The system automatically calculates basic salaries, overtime, advances, system deductions, register shorts, and breakages in real-time.",
    },
    {
      q: "Does it support local payment structures?",
      a: "Absolutely. It is fully customized for localized restaurant operations, supporting Kenyan Shillings (Ksh) and exporting clean, master spreadsheet templates ready for payroll distribution.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-hidden relative font-sans selection:bg-emerald-500/30">
      {/* Structural Architectural Gridlines & Accents (Brillance Aesthetic) */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute left-10 md:left-24 top-0 bottom-0 w-px bg-[#1f1f23]"></div>
        <div className="absolute right-10 md:right-24 top-0 bottom-0 w-px bg-[#1f1f23]"></div>
        {/* Minimalist blueprint dot grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#1f1f23_1px,transparent_1px)] [background-size:24px_24px]"></div>
      </div>

      {/* Floating Header / Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#09090b]/90 backdrop-blur-md border-b border-[#1f1f23]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 font-mono tracking-widest text-lg font-bold">
            <span className="text-white">PAY</span>
            <span className="text-emerald-400">ROLLER</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-mono tracking-wider uppercase">
            <a
              href="#features"
              className="text-zinc-400 hover:text-white transition-colors duration-200"
            >
              Features
            </a>
            <a
              href="#demo"
              className="text-zinc-400 hover:text-white transition-colors duration-200"
            >
              Sandbox Demo
            </a>
            <a
              href="#pricing"
              className="text-zinc-400 hover:text-white transition-colors duration-200"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="text-zinc-400 hover:text-white transition-colors duration-200"
            >
              FAQ
            </a>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/login"
              className="text-xs font-mono tracking-wider uppercase text-zinc-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/setup-restaurant"
              className="bg-white text-[#09090b] px-5 py-2 rounded-full text-xs font-mono tracking-wider uppercase font-bold hover:bg-emerald-400 transition-all duration-200"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Trigger */}
          <button
            className="md:hidden text-white p-2 hover:bg-[#121214] rounded-md transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#09090b] border-t border-[#1f1f23] px-6 py-6 space-y-6">
            <div className="flex flex-col gap-4 font-mono text-xs tracking-wider uppercase">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-400 hover:text-white py-2 border-b border-[#1f1f23]"
              >
                Features
              </a>
              <a
                href="#demo"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-400 hover:text-white py-2 border-b border-[#1f1f23]"
              >
                Sandbox Demo
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-400 hover:text-white py-2 border-b border-[#1f1f23]"
              >
                Pricing
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-400 hover:text-white py-2 border-b border-[#1f1f23]"
              >
                FAQ
              </a>
            </div>
            <div className="flex flex-col gap-4 pt-4">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center font-mono text-xs tracking-wider uppercase text-zinc-400 hover:text-white py-2"
              >
                Sign In
              </Link>
              <Link
                to="/setup-restaurant"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center bg-emerald-500 text-[#09090b] py-3 rounded-full text-xs font-mono tracking-wider uppercase font-bold hover:bg-emerald-400"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 px-6 border-b border-[#1f1f23] flex flex-col items-center justify-center">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Subtle Decorative Accent lines in Hero Corners */}
          <div className="hidden lg:block absolute -top-8 -left-12 w-8 h-8 border-t border-l border-zinc-700"></div>
          <div className="hidden lg:block absolute -top-8 -right-12 w-8 h-8 border-t border-r border-zinc-700"></div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-[#1f1f23] px-3 py-1 rounded-full text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-8 bg-[#121214]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Payroll management made simple
          </div>

          {/* Editorial Display Typography */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl tracking-tight mb-8 font-serif leading-[1.15] font-light">
            Streamline your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 font-normal">
              restaurant payroll
            </span>{" "}
            without the headache.
          </h1>

          {/* Explanatory Body */}
          <p className="text-zinc-400 text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Manage employees, track monthly advances, process deductions, and
            generate secure login credentials for your entire kitchen and floor
            staff.
          </p>

          {/* CTA Hub */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto mb-16">
            <Link
              to="/setup-restaurant"
              className="bg-white text-[#09090b] px-8 py-4 rounded-full text-xs font-mono tracking-wider uppercase font-bold hover:bg-emerald-400 transition-all duration-200 active:scale-95 shadow-lg shadow-emerald-500/5 text-center"
            >
              Register Restaurant
            </Link>
            <Link
              to="/login"
              className="border border-[#1f1f23] text-white px-8 py-4 rounded-full text-xs font-mono tracking-wider uppercase font-bold hover:bg-[#121214] transition-all duration-200 active:scale-95 text-center"
            >
              Admin Login
            </Link>
          </div>

          {/* Responsive Dashboard Performance Widget */}
          <div className="bg-[#121214]/60 border border-[#1f1f23] rounded-xl p-6 md:p-8 backdrop-blur-md relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-[#1f1f23] px-3 py-0.5 rounded-full text-[9px] font-mono tracking-widest uppercase bg-[#09090b] text-zinc-500">
              System Metrics
            </div>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="bg-[#09090b]/80 border border-[#1f1f23] p-5 rounded-lg">
                <div className="text-zinc-500 text-[10px] mb-2 font-mono tracking-widest uppercase">
                  Active Staff
                </div>
                <div className="text-3xl font-light font-serif">
                  14{" "}
                  <span className="text-xs text-zinc-500 font-mono">
                    Members
                  </span>
                </div>
              </div>
              <div className="bg-[#09090b]/80 border border-[#1f1f23] p-5 rounded-lg">
                <div className="text-zinc-500 text-[10px] mb-2 font-mono tracking-widest uppercase">
                  Net Liability
                </div>
                <div className="text-3xl font-light text-emerald-400 font-serif">
                  Ksh 184,500
                </div>
              </div>
              <div className="bg-[#09090b]/80 border border-[#1f1f23] p-5 rounded-lg">
                <div className="text-zinc-500 text-[10px] mb-2 font-mono tracking-widest uppercase">
                  Status Engine
                </div>
                <div className="text-base text-zinc-300 font-mono tracking-wide mt-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>{" "}
                  All Accounts Synced
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Features Section */}
      <section
        id="features"
        className="py-24 px-6 border-b border-[#1f1f23] relative"
      >
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-full">
              Platform Features
            </span>
            <h2 className="text-3xl md:text-5xl tracking-tight mt-6 font-serif font-light">
              Built for high-tempo kitchen and restaurant operations.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-[#1f1f23] border border-[#1f1f23] rounded-lg overflow-hidden">
            {/* Card 1 */}
            <div className="bg-[#09090b] p-8 hover:bg-[#121214]/50 transition-colors duration-300">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
                <Sparkles size={18} />
              </div>
              <h3 className="text-lg font-mono tracking-tight uppercase mb-3">
                Flexible Setup
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Quickly onboard your restaurant and customize basic salaries,
                system deductions, and monthly schedules to fit your kitchen
                layout.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#09090b] p-8 hover:bg-[#121214]/50 transition-colors duration-300">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
                <Shield size={18} />
              </div>
              <h3 className="text-lg font-mono tracking-tight uppercase mb-3">
                Staff Credentials
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Generate secure portal logins automatically for all staff
                members so they can independently view pay slips, shifts, and
                schedules.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#09090b] p-8 hover:bg-[#121214]/50 transition-colors duration-300">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
                <RefreshCw size={18} />
              </div>
              <h3 className="text-lg font-mono tracking-tight uppercase mb-3">
                Real-Time Adjustments
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Easily deduct for accidental breakages, track cash advances, and
                log till shortfalls dynamically as the busy month progresses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Sandbox Section */}
      <section
        id="demo"
        className="py-24 px-6 border-b border-[#1f1f23] relative"
      >
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-block border border-[#1f1f23] px-3 py-1 rounded-full text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-6 bg-[#121214]">
            Interactive Sandbox
          </div>

          <h2 className="text-3xl md:text-5xl tracking-tight mb-4 font-serif font-light">
            Onboarding Invitation Engine
          </h2>
          <p className="text-zinc-400 text-sm md:text-base mb-12 max-w-lg mx-auto leading-relaxed">
            Generate a localized onboarding token below. Send this secure invite
            link straight to your employee’s WhatsApp to let them securely fill
            out their credentials.
          </p>

          {/* Interactive Form Panel */}
          <div className="bg-[#121214] border border-[#1f1f23] rounded-xl p-8 space-y-6 text-left">
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Role Dropdown */}
              <div>
                <label className="block text-xs font-mono tracking-wider uppercase mb-2 text-zinc-400">
                  Designated Role
                </label>
                <div className="relative">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full bg-[#09090b] border border-[#1f1f23] rounded px-4 py-3 text-sm text-white appearance-none cursor-pointer hover:border-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    {roles.map((role) => (
                      <option key={role} value={role.toLowerCase()}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                  />
                </div>
              </div>

              {/* Salary Input */}
              <div>
                <label className="block text-xs font-mono tracking-wider uppercase mb-2 text-zinc-400">
                  Starting Basic Salary (Ksh)
                </label>
                <input
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(Number(e.target.value))}
                  className="w-full bg-[#09090b] border border-[#1f1f23] rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Generate Trigger */}
            <button
              onClick={generateLink}
              className="w-full bg-white text-[#09090b] py-3.5 rounded text-xs font-mono tracking-wider uppercase font-bold hover:bg-emerald-400 active:scale-[0.99] transition-all duration-200"
            >
              Create Staff Onboarding Token
            </button>

            {/* Generated Link Box */}
            {generatedLink && (
              <div className="bg-[#09090b] border border-[#1f1f23] rounded p-5 space-y-4">
                <div className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                  Generated WhatsApp Invite
                </div>
                <p className="text-xs text-zinc-300 font-mono break-all py-1 px-2 bg-[#121214] border border-[#1f1f23] rounded">
                  {generatedLink}
                </p>
                <button
                  onClick={copyToClipboard}
                  className="w-full flex items-center justify-center gap-2 bg-[#1f1f23] hover:bg-zinc-800 text-white py-2.5 rounded text-xs font-mono tracking-wider uppercase transition-all duration-200"
                >
                  {copyFeedback ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      <span>Token Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy Invitation Link</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-24 px-6 border-b border-[#1f1f23] relative"
      >
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase border border-[#1f1f23] px-3 py-1 rounded-full bg-[#121214]">
              System Subscriptions
            </span>
            <h2 className="text-3xl md:text-5xl tracking-tight mt-6 font-serif font-light">
              Simple, predictable structures
            </h2>
          </div>

          <div className="max-w-md mx-auto">
            {/* Single Premium Paid Tier */}
            <div className="bg-[#121214] border border-emerald-500/30 rounded-xl p-8 relative overflow-hidden flex flex-col justify-between shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.03] to-transparent pointer-events-none"></div>

              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-mono tracking-wider uppercase text-white">
                    Complete Pro Access
                  </h3>
                  <span className="border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[9px] font-mono tracking-widest uppercase text-emerald-400 bg-emerald-950/40 font-bold animate-pulse">
                    2 Months Free Trial
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-serif font-light text-white">
                    Ksh 800
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">
                    / month
                  </span>
                </div>
                <p className="text-xs text-emerald-400 font-mono mb-6">
                  First 60 days on us, cancel anytime.
                </p>

                <div className="w-full h-px bg-[#1f1f23] mb-6"></div>

                <ul className="space-y-3.5 text-zinc-300 text-sm">
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Unlimited active staff members
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Advanced dynamic tracking & breakages
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Automated end-of-month spreadsheet compilation
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Priority 24/7 WhatsApp administrative support
                  </li>
                </ul>
              </div>

              <Link
                to="/setup-restaurant"
                className="w-full mt-10 text-center bg-white text-[#09090b] py-3 rounded-full text-xs font-mono tracking-wider uppercase font-bold hover:bg-emerald-400 hover:text-black transition-all duration-200 shadow-md"
              >
                Start 2-Month Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        id="faq"
        className="py-24 px-6 border-b border-[#1f1f23] relative"
      >
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase border border-[#1f1f23] px-3 py-1 rounded-full bg-[#121214]">
              FAQ
            </span>
            <h2 className="text-3xl md:text-5xl tracking-tight mt-6 font-serif font-light">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-[#1f1f23] rounded-lg bg-[#121214]/20 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? -1 : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-[#121214]/60 transition-colors text-left"
                >
                  <span className="font-mono text-sm tracking-wide text-zinc-100">
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-emerald-400 transition-transform duration-300 flex-shrink-0 ml-4 ${
                      expandedFaq === idx ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {expandedFaq === idx && (
                  <div className="px-6 py-5 border-t border-[#1f1f23] bg-[#09090b]/40 text-sm text-zinc-400 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="py-16 px-6 bg-[#09090b] border-t border-[#1f1f23] relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand details */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 font-mono tracking-widest text-sm font-bold mb-4">
                <span className="text-white">PAY</span>
                <span className="text-emerald-400">ROLLER</span>
              </div>
              <p className="text-zinc-500 text-xs leading-relaxed max-w-xs">
                Keeping your kitchen operation and monthly ledger structured in
                harmony.
              </p>
            </div>

            {/* Links Columns */}
            <div>
              <h4 className="font-mono text-[10px] tracking-widest uppercase text-zinc-400 mb-4">
                Product
              </h4>
              <ul className="space-y-2 text-zinc-500 text-xs">
                <li>
                  <a
                    href="#features"
                    className="hover:text-white transition-colors"
                  >
                    Platform Features
                  </a>
                </li>
                <li>
                  <a
                    href="#demo"
                    className="hover:text-white transition-colors"
                  >
                    Interactive Sandbox
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-white transition-colors"
                  >
                    Subscriptions
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-[10px] tracking-widest uppercase text-zinc-400 mb-4">
                Company
              </h4>
              <ul className="space-y-2 text-zinc-500 text-xs">
                <li>
                  <Link
                    to="/setup-restaurant"
                    className="hover:text-white transition-colors"
                  >
                    Register Admin
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-white transition-colors"
                  >
                    Log In Portal
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-[10px] tracking-widest uppercase text-zinc-400 mb-4">
                Support
              </h4>
              <ul className="space-y-2 text-zinc-500 text-xs">
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    Common Inquiries
                  </a>
                </li>
                <li>
                  <span className="text-zinc-600">WhatsApp Hotline:</span>
                  <a href="https://wa.me/254707178642" className="text-zinc-600">+254707178642</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright Section */}
          <div className="border-t border-[#1f1f23] pt-8 flex flex-col sm:flex-row items-center justify-between text-zinc-600 text-[10px] font-mono tracking-wider">
            <p>
              © {new Date().getFullYear()} PayRoller. Beautifully keeping your
              kitchen and capital in sync.
            </p>
            <p className="mt-2 sm:mt-0 uppercase">
              Premium Restaurant Administration Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
