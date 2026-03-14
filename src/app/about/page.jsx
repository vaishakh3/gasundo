export const metadata = {
  title: 'About',
  description:
    'Why GasUndo exists, how the LPG shortage has affected restaurants in Kochi, and why OpenStreetMap data matters.',
}

export default function AboutPage() {
  return (
    <main className="min-h-[var(--app-vh)] bg-[radial-gradient(circle_at_top_left,rgba(255,122,69,0.16),transparent_22%),radial-gradient(circle_at_top_right,rgba(250,204,21,0.08),transparent_16%),linear-gradient(180deg,#091122,#060b18_46%,#040811)] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,18,36,0.92),rgba(7,12,24,0.9))] p-6 shadow-[0_30px_80px_rgba(5,8,22,0.34)] backdrop-blur-2xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--accent-gold)]/74">
            About GasUndo
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
            A small map for a difficult moment
          </h1>

          <div className="mt-6 space-y-4 text-base leading-7 text-slate-200/78">
            <p>
              GasUndo exists because the war-driven LPG shortage has affected
              everyday life across Kochi. As supply became uncertain, many
              restaurants were pushed into running at lower capacity, serving a
              smaller menu, or closing altogether for parts of the day.
            </p>
            <p>
              This map is meant to make one frustrating problem a little easier.
              Instead of calling around or travelling only to find a shutter
              down, people can quickly check what is open, what is serving a
              limited menu, and what has had to close.
            </p>
            <p>
              GasUndo depends on community updates because situations can change
              fast. Every confirmed status helps someone else decide where to go
              for food without wasting time, fuel, or effort.
            </p>
          </div>

          <section className="mt-8 rounded-[28px] border border-[rgba(255,210,166,0.16)] bg-[linear-gradient(180deg,rgba(255,122,69,0.12),rgba(11,18,36,0.54))] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent-gold)]/78">
              A note from us
            </p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-100/80 sm:text-base">
              <p>
                If you do not see your favourite place on this map, it is most
                likely because OpenStreetMap, the underlying map that powers a
                lot of things on the internet, does not yet have the data it
                needs there.
              </p>
              <p>
                If you can, please help improve OpenStreetMap by mapping your
                favourite cafe, restaurant, bakery, or even your favourite tree
                by the roadside. Small acts of mapping make local tools like
                GasUndo more useful for everyone.
              </p>
              <p>
                If you are new to OpenStreetMap, this short walkthrough shows
                how to add and edit places properly.
              </p>
            </div>

            <div className="mt-5 overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/40 shadow-[0_18px_42px_rgba(5,8,22,0.3)]">
              <div className="aspect-video">
                <iframe
                  className="h-full w-full"
                  src="https://www.youtube.com/embed/Ir-3K0pjwOI"
                  title="How to map new places in OpenStreetMap"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="https://www.openstreetmap.org/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-white transition hover:border-[rgba(255,210,166,0.3)] hover:bg-white/10"
              >
                Visit OpenStreetMap
              </a>
              <a
                href="https://www.openstreetmap.org/edit"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-[rgba(255,210,166,0.26)] bg-[rgba(255,122,69,0.12)] px-4 py-2 text-sm font-medium text-[var(--accent-gold)] transition hover:border-[rgba(255,210,166,0.4)] hover:bg-[rgba(255,122,69,0.16)]"
              >
                Help map your place
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
