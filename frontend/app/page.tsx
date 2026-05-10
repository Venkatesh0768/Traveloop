import Link from "next/link";
import { Plane, Map, DollarSign, CheckSquare, Share2, NotebookPen, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Plane size={14} />
            </div>
            <span className="text-sm font-bold text-gray-900">Traveloop</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Link href="/register" className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white py-24 px-4">
        <div className="mx-auto max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            ✈️ Personalized Travel Planning Made Easy
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Plan your perfect<br />
            <span className="text-indigo-200">multi-city trip</span>
          </h1>
          <p className="text-xl text-indigo-200 mb-10 max-w-2xl mx-auto">
            Create customized itineraries, track budgets, manage packing lists, and share your adventures — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors text-base">
              Start planning for free
              <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/20 transition-colors text-base">
              Sign in
            </Link>
          </div>
        </div>
        {/* Decorative */}
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/5" />
        <div className="absolute -left-10 -bottom-20 h-60 w-60 rounded-full bg-white/5" />
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything you need to travel smarter</h2>
            <p className="text-gray-500 text-lg">From planning to packing — Traveloop has you covered.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-indigo-200 hover:shadow-md transition-all">
                <div className={`inline-flex p-3 rounded-xl ${f.bg} mb-4`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-indigo-600 text-white text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Ready to start your adventure?</h2>
          <p className="text-indigo-200 mb-8 text-lg">Join thousands of travelers planning smarter trips with Traveloop.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors text-base">
            Create your free account
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Plane size={12} />
          </div>
          <span className="text-sm font-bold text-gray-900">Traveloop</span>
        </div>
        <p className="text-xs text-gray-400">© 2026 Traveloop. Personalized travel planning made easy.</p>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    title: "Multi-city Itineraries",
    description: "Build detailed day-by-day plans with stops, activities, and dates for every city on your route.",
    icon: <Map size={22} className="text-indigo-600" />,
    bg: "bg-indigo-50",
  },
  {
    title: "Budget Tracking",
    description: "Log expenses by category, visualize spending breakdowns, and stay within your travel budget.",
    icon: <DollarSign size={22} className="text-emerald-600" />,
    bg: "bg-emerald-50",
  },
  {
    title: "Packing Checklist",
    description: "Never forget essentials again. Organize your packing list by category and track what's packed.",
    icon: <CheckSquare size={22} className="text-amber-600" />,
    bg: "bg-amber-50",
  },
  {
    title: "Trip Notes",
    description: "Jot down hotel check-in details, local contacts, and day-specific reminders tied to each stop.",
    icon: <NotebookPen size={22} className="text-purple-600" />,
    bg: "bg-purple-50",
  },
  {
    title: "Share Itineraries",
    description: "Generate a public link to share your trip with friends or the community. They can copy it too.",
    icon: <Share2 size={22} className="text-pink-600" />,
    bg: "bg-pink-50",
  },
  {
    title: "Explore Destinations",
    description: "Discover trending and popular cities worldwide with cost indexes, currencies, and descriptions.",
    icon: <Plane size={22} className="text-sky-600" />,
    bg: "bg-sky-50",
  },
];
