import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  CheckCircle2,
  PieChart,
  Split,
  ChevronRight,
  Menu,
  X,
  CreditCard,
  RefreshCw,
  Sparkles,
  Receipt,
  HeartHandshake
} from 'lucide-react';
import { SplitMateLogo } from '../common/SplitMateLogo';
import { useSplitMate } from '../../context/SplitMateContext';
import { formatPaise } from '../../utils/calculations';
import { Avatar } from '../common/Avatar';

export const LandingPage: React.FC = () => {
  const {
    navigateTo,
    currentUser,
    session,
    isAuthenticating,
    signInWithGoogle,
  } = useSplitMate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleAuthAction = () => {
    if (session) {
      navigateTo('dashboard');
    } else {
      signInWithGoogle();
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#F5F5F5] flex flex-col selection:bg-[#8FAF9A]/20 selection:text-[#8FAF9A]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#0B0C0E]/90 backdrop-blur-md border-b border-[#2B2F36]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <SplitMateLogo size="md" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#A0A5AE]">
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-[#F5F5F5] transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-[#F5F5F5] transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="hover:text-[#F5F5F5] transition-colors cursor-pointer"
            >
              About
            </button>
          </nav>

          {/* Header Action Buttons */}
          <div className="hidden md:flex items-center gap-3.5">
            <button
              onClick={handleAuthAction}
              disabled={isAuthenticating}
              className="text-xs font-semibold text-[#A0A5AE] hover:text-[#F5F5F5] px-3.5 py-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {session ? 'Dashboard' : isAuthenticating ? 'Connecting...' : 'Sign In'}
            </button>
            <button
              onClick={handleAuthAction}
              disabled={isAuthenticating}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#8FAF9A] text-[#0B0C0E] hover:bg-[#82B99A] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{session ? 'Open Dashboard' : isAuthenticating ? 'Signing In...' : 'Get Started'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={handleAuthAction}
              disabled={isAuthenticating}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#8FAF9A] text-[#0B0C0E] disabled:opacity-50"
            >
              {session ? 'Dashboard' : isAuthenticating ? 'Connecting...' : 'Sign In'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#A0A5AE] hover:text-[#F5F5F5] rounded-lg"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#111316] border-b border-[#2B2F36] px-4 py-4 space-y-3 animate-in slide-in-from-top duration-150">
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left py-2 text-sm font-medium text-[#A0A5AE] hover:text-[#F5F5F5]"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left py-2 text-sm font-medium text-[#A0A5AE] hover:text-[#F5F5F5]"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="block w-full text-left py-2 text-sm font-medium text-[#A0A5AE] hover:text-[#F5F5F5]"
            >
              About
            </button>
            <div className="pt-2 border-t border-[#2B2F36] flex flex-col gap-2">
              <button
                onClick={handleAuthAction}
                disabled={isAuthenticating}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#8FAF9A] text-[#0B0C0E] text-center disabled:opacity-50"
              >
                {session ? 'Open SplitMate Dashboard' : isAuthenticating ? 'Signing in with Google...' : 'Sign In with Google'}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Subtle Charcoal ambient backlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#8FAF9A]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Subtle Tag badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181B20] border border-[#2B2F36] text-xs font-medium text-[#8FAF9A] mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Modern Group Expense Architecture</span>
          </div>

          {/* Exact Required Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#F5F5F5] leading-tight">
            Break the bill, <br className="hidden sm:inline" />
            <span className="text-[#8FAF9A]">not the bond.</span>
          </h1>

          {/* Exact Required Supporting Text */}
          <p className="mt-5 max-w-2xl mx-auto text-base sm:text-lg text-[#A0A5AE] leading-relaxed">
            Split expenses, settle up effortlessly, and keep every shared memory free from money confusion.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={handleAuthAction}
              disabled={isAuthenticating}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-bold bg-[#8FAF9A] text-[#0B0C0E] hover:bg-[#82B99A] transition-all shadow-lg shadow-[#8FAF9A]/10 flex items-center justify-center gap-2 cursor-pointer group disabled:opacity-50"
            >
              <span>{session ? 'Open Dashboard' : isAuthenticating ? 'Connecting...' : 'Get Started'}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>

            <button
              onClick={() => scrollToSection('features')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-semibold bg-[#181B20] text-[#F5F5F5] border border-[#2B2F36] hover:border-[#8FAF9A]/60 hover:bg-[#202329] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore Features</span>
              <ChevronRight className="w-4 h-4 text-[#A0A5AE]" />
            </button>
          </div>

          {/* Product Preview Section */}
          <div className="mt-14 max-w-3xl mx-auto">
            <div className="bg-[#181B20] border border-[#2B2F36] rounded-2xl p-5 sm:p-6 shadow-2xl text-left relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#2B2F36] gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#202329] border border-[#2B2F36] flex items-center justify-center text-xl">
                    ✈️
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#F5F5F5]">Goa Beach House & Villa</h3>
                    <p className="text-xs text-[#A0A5AE]">3 Friends • Trip Category</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#202329] border border-[#2B2F36] text-[#A0A5AE]">
                    Total: <strong className="text-[#F5F5F5]">₹1,500</strong>
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#1F292B] border border-[#2E453C] text-[#82B99A] font-medium">
                    You are owed +₹1,000
                  </span>
                </div>
              </div>

              {/* Sample Expense Item */}
              <div className="py-4 space-y-3">
                <div className="p-3.5 rounded-xl bg-[#111316] border border-[#2B2F36] flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#202329] flex items-center justify-center text-sm">
                      🍽️
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#F5F5F5] truncate">Seafood Dinner at Thalassa</p>
                      <p className="text-xs text-[#737984]">Paid by Alex Rivera • Split equally</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold text-[#F5F5F5]">₹1,500</p>
                    <p className="text-[11px] text-[#82B99A]">You lent ₹1,000</p>
                  </div>
                </div>

                {/* Live Split Indicator Visualization */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#202329] border border-[#2B2F36] text-center">
                    <span className="text-[10px] text-[#737984] block">Alex (You)</span>
                    <span className="text-xs font-semibold text-[#82B99A]">+₹1,000</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#202329] border border-[#2B2F36] text-center">
                    <span className="text-[10px] text-[#737984] block">Rohan Verma</span>
                    <span className="text-xs font-semibold text-[#D99090]">Owes ₹500</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#202329] border border-[#2B2F36] text-center">
                    <span className="text-[10px] text-[#737984] block">Priya Sharma</span>
                    <span className="text-xs font-semibold text-[#D99090]">Owes ₹500</span>
                  </div>
                </div>
              </div>

              {/* Footer preview note */}
              <div className="pt-3 border-t border-[#2B2F36] flex items-center justify-between text-xs text-[#737984]">
                <span>✓ Verified automatic balance reconciliation</span>
                <span className="text-[#8FAF9A] font-medium">1-Click Settle Up</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section (3 Required Cards) */}
      <section id="features" className="py-20 bg-[#111316] border-y border-[#2B2F36] relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8FAF9A]">
              Designed For Real Friendships
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] mt-2">
              Everything you need to share costs without awkwardness
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-[#181B20] border border-[#2B2F36] hover:border-[#8FAF9A]/50 transition-all hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-xl bg-[#202329] border border-[#2B2F36] flex items-center justify-center text-[#8FAF9A] mb-4">
                <Split className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F5F5] mb-2">Split Without Stress</h3>
              <p className="text-sm text-[#A0A5AE] leading-relaxed">
                Divide expenses fairly between friends. Choose equal splits, custom amounts, exact rupee shares, or percentages with flawless accuracy.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-[#181B20] border border-[#2B2F36] hover:border-[#8FAF9A]/50 transition-all hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-xl bg-[#202329] border border-[#2B2F36] flex items-center justify-center text-[#8FAF9A] mb-4">
                <PieChart className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F5F5] mb-2">Know Who Owes Whom</h3>
              <p className="text-sm text-[#A0A5AE] leading-relaxed">
                Calculate balances automatically. Our debt minimization engine simplifies IOUs so fewer payments settle up the entire group.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-[#181B20] border border-[#2B2F36] hover:border-[#8FAF9A]/50 transition-all hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-xl bg-[#202329] border border-[#2B2F36] flex items-center justify-center text-[#8FAF9A] mb-4">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F5F5] mb-2">Every Expense, Remembered</h3>
              <p className="text-sm text-[#A0A5AE] leading-relaxed">
                Keep a clear record of spending and settlements. Search, filter, export to CSV, and inspect an audited activity log anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-[#0B0C0E]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8FAF9A]">
              Effortless Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] mt-2">
              How SplitMate Works
            </h2>
            <p className="text-sm text-[#A0A5AE] mt-2">
              Four steps from a shared check to settled peace of mind.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: '01',
                title: 'Create a Group',
                desc: 'Organize by trip, flatmates, weekend outing, or dinner.',
              },
              {
                step: '02',
                title: 'Add Friends',
                desc: 'Add friends by name or email with customizable member lists.',
              },
              {
                step: '03',
                title: 'Record Expenses',
                desc: 'Log receipts with live split breakdowns and categories.',
              },
              {
                step: '04',
                title: 'Settle Balances',
                desc: 'Record UPI or cash settlements with one clean tap.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="p-5 rounded-2xl bg-[#181B20] border border-[#2B2F36] relative flex flex-col justify-between"
              >
                <div>
                  <span className="text-2xl font-black text-[#8FAF9A]/30 block mb-2 font-mono">
                    {item.step}
                  </span>
                  <h3 className="text-base font-bold text-[#F5F5F5] mb-1.5">{item.title}</h3>
                  <p className="text-xs text-[#A0A5AE] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-[#111316] border-t border-[#2B2F36]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#202329] border border-[#2B2F36] mx-auto flex items-center justify-center text-[#8FAF9A] mb-4">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-[#F5F5F5]">About SplitMate</h2>
          <p className="mt-3 text-sm text-[#A0A5AE] leading-relaxed max-w-2xl mx-auto">
            SplitMate was created to eliminate the friction, awkward reminders, and mental math of splitting bills.
            We believe that money should never stand between genuine friendships. Designed with modern fintech privacy, zero ads, and instant local persistence.
          </p>

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleAuthAction}
              disabled={isAuthenticating}
              className="px-6 py-3 rounded-xl text-xs font-bold bg-[#8FAF9A] text-[#0B0C0E] hover:bg-[#82B99A] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{session ? 'Open Workspace' : isAuthenticating ? 'Connecting...' : 'Launch App Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="mt-auto bg-[#0B0C0E] border-t border-[#2B2F36] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <SplitMateLogo size="sm" showTagline={true} />

          <p className="text-xs text-[#737984]">
            © {new Date().getFullYear()} SplitMate. Break the bill, not the bond.
          </p>

          <div className="flex items-center gap-4 text-xs text-[#A0A5AE]">
            <button
              onClick={() => navigateTo('dashboard')}
              className="hover:text-[#F5F5F5] cursor-pointer"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigateTo('history')}
              className="hover:text-[#F5F5F5] cursor-pointer"
            >
              History
            </button>
            <button
              onClick={() => navigateTo('settings')}
              className="hover:text-[#F5F5F5] cursor-pointer"
            >
              Settings
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
