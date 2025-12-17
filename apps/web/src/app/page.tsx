import Link from "next/link";

const examples = [
  {
    slug: "acme",
    title: "ACME Support Chat",
    description: "Popup chat widget on a marketing landing page.",
    badge: "Simple",
  },
  {
    slug: "multi-thread-agent",
    title: "Multi-thread Agent",
    description: "Two-pane layout with thread list and embedded chat widget (no popup).",
    badge: "Preview",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <header className="mb-12 text-center">
          <p className="mb-3 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Examples Gallery
          </p>
          <h1 className="text-4xl font-semibold text-slate-900">Ensemble Chat examples</h1>
          <p className="mt-3 text-lg text-slate-600">
            Explore sample integrations showcasing different configurations and UI widgets.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {examples.map((example) => (
            <Link
              key={example.slug}
              href={`/examples/${example.slug}`}
              className="group relative block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 group-hover:text-blue-600">
                    {example.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">{example.description}</p>
                </div>
                {example.badge ? (
                  <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {example.badge}
                  </span>
                ) : null}
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-blue-600">
                View example
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
