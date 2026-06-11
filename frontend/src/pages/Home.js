import { Link } from "react-router-dom";

const highlights = [
  { title: "Instant matching", body: "Smart match scoring surfaces likely pairs faster." },
  { title: "Secure claims", body: "Admin-reviewed claim workflows protect owners and finders." },
  { title: "Campus visibility", body: "Search reports, hotspots, and updates from one dashboard." },
];

const features = [
  {
    title: "Image-first reporting",
    body: "Upload multiple photos and bring clarity to every report with a primary cover image.",
  },
  {
    title: "Structured search",
    body: "Filter by category, item type, status, and keywords with cleaner data handling.",
  },
  {
    title: "Live monitoring",
    body: "Track nearby reports and active hotspots from a single operations view.",
  },
  {
    title: "Verified recovery",
    body: "Claims, moderation, and approvals support a safer handover process.",
  },
];

function Home() {
  return (
    <div className="page-shell">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-panel rounded-[32px] p-8 md:p-10">
          <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
            Professional campus recovery workflow
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
            Recover lost items with a modern, trustworthy dark workspace.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            Report items, discover likely matches, and guide secure handovers with a cleaner
            interface built for students, staff, and administrators.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              to="/register"
            >
              Get Started
            </Link>
            <Link
              className="rounded-full border border-slate-700 bg-slate-900/70 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
              to="/login"
            >
              Open Dashboard
            </Link>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-800 bg-slate-950/55 px-5 py-4"
              >
                <div className="font-semibold text-slate-100">{item.title}</div>
                <div className="mt-2 text-sm leading-6 text-slate-400">{item.body}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="glass-panel rounded-[32px] p-8">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              Reporting flow
            </div>
            <h2 className="mt-4 text-2xl font-semibold">Three clear steps</h2>
            <ol className="mt-5 grid gap-4 text-sm text-slate-300">
              <li className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-4">1. Submit details, tags, and photos.</li>
              <li className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-4">2. Monitor suggested matches and nearby activity.</li>
              <li className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-4">3. Complete verification through claims and admin approval.</li>
            </ol>
          </div>

          <div className="glass-panel rounded-[32px] p-8">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              Today’s pulse
            </div>
            <h2 className="mt-4 text-2xl font-semibold">Live recovery activity</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Wallets, earphones, ID cards, backpacks, and more are now easier to track through one centralized interface.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-200">
              Live updates enabled
            </div>
          </div>
        </div>
      </section>

      <section className="glass-panel mt-6 rounded-[32px] p-8 md:p-10">
        <div className="max-w-2xl">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Why it works
          </div>
          <h2 className="mt-4 text-3xl font-semibold">Built for fast reporting and reliable recovery</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            The updated experience favors speed, trust, and clarity — with stronger backend rules and a cleaner dark interface.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {features.map((card) => (
            <div
              key={card.title}
              className="rounded-[28px] border border-slate-800 bg-slate-950/55 px-6 py-6"
            >
              <h3 className="text-lg font-semibold">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{card.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
