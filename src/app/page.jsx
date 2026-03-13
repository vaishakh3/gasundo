import HomeClient from './home-client'

import { getRestaurants } from '@/lib/restaurants'

export const revalidate = 86400

const pageDescription =
  'GasUndo is a live map showing restaurants open in Kochi during the LPG shortage. Track Kochi restaurant status, limited menu updates, and closures across Ernakulam, Kerala.'

const faqItems = [
  {
    question: 'Which restaurants are open in Kochi today?',
    answer:
      'GasUndo shows a live map of restaurants open in Kochi, along with places serving a limited menu and restaurants closed because of the LPG shortage.',
  },
  {
    question: 'How does GasUndo show Kochi restaurant availability?',
    answer:
      'The app collects community updates in real time so people can check Kochi restaurant status on one map instead of calling restaurants individually.',
  },
  {
    question: 'Can I find restaurants running a limited menu in Kochi?',
    answer:
      'Yes. GasUndo highlights restaurants running a limited menu in Kochi so people can quickly see which food places are affected before they travel.',
  },
  {
    question: 'Why are some restaurants closed in Kochi during the LPG shortage?',
    answer:
      'Restaurants across Kochi have been affected by LPG supply issues, which can lead to temporary closures, shorter hours, or reduced menus across Ernakulam, Kerala.',
  },
]

function buildStructuredData(restaurantCount) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'GasUndo',
      url: 'https://gasundo.live',
      inLanguage: 'en-IN',
      description: pageDescription,
      areaServed: {
        '@type': 'AdministrativeArea',
        name: 'Kochi, Ernakulam, Kerala, India',
      },
      publisher: {
        '@type': 'Organization',
        name: 'GasUndo',
        url: 'https://gasundo.live',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'GasUndo',
      url: 'https://gasundo.live',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Any',
      inLanguage: 'en-IN',
      description: pageDescription,
      areaServed: {
        '@type': 'City',
        name: 'Kochi',
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
      },
      featureList: [
        'Live map of restaurants open in Kochi',
        'Real-time Kochi restaurant status updates from the community',
        'Open, limited-menu, and closed restaurant availability during the LPG shortage',
        `${restaurantCount} mapped food places across Kochi and Ernakulam`,
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ]
}

export default async function Page() {
  let initialRestaurants = []
  let initialError = null

  try {
    initialRestaurants = await getRestaurants()
  } catch (error) {
    console.error('Failed to load restaurants on the server:', error)
    initialError = 'Failed to load restaurants. Please try again.'
  }

  const structuredData = buildStructuredData(initialRestaurants.length)

  return (
    <main>
      {structuredData.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}

      <HomeClient
        initialRestaurants={initialRestaurants}
        initialError={initialError}
      />

      <section className="border-t border-white/8 bg-[linear-gradient(180deg,rgba(10,16,31,0.92),rgba(6,11,24,0.98))]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--accent-gold)]/78">
              Kochi restaurant availability
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Live map of restaurants open in Kochi during the LPG shortage
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-200/80">
              GasUndo is a live map showing restaurants open in Kochi during
              the LPG shortage. The map helps people quickly find restaurants
              that are open, closed, or serving a limited menu.
            </p>
            <p className="mt-4 text-base leading-7 text-slate-200/72">
              Restaurants across Kochi have been affected by the LPG shortage,
              causing temporary closures and reduced menus. GasUndo allows the
              community to update restaurant status in real time. This helps
              people in Kochi find food quickly when many restaurants are
              closed due to LPG shortages.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="rounded-[26px] border border-emerald-300/14 bg-[linear-gradient(180deg,rgba(16,48,37,0.34),rgba(10,18,31,0.82))] p-5 shadow-[0_20px_44px_rgba(5,8,22,0.18)]">
              <h3 className="font-display text-xl font-semibold text-white">
                Restaurants open in Kochi
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-200/72">
                Use the live map to find restaurants open now in Kochi when
                LPG shortage updates change through the day.
              </p>
            </article>
            <article className="rounded-[26px] border border-amber-300/14 bg-[linear-gradient(180deg,rgba(66,42,14,0.28),rgba(10,18,31,0.82))] p-5 shadow-[0_20px_44px_rgba(5,8,22,0.18)]">
              <h3 className="font-display text-xl font-semibold text-white">
                Limited menu updates
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-200/72">
                See restaurants running limited menu in Kochi so you know which
                food places are available before you leave home.
              </p>
            </article>
            <article className="rounded-[26px] border border-rose-300/14 bg-[linear-gradient(180deg,rgba(62,19,26,0.28),rgba(10,18,31,0.82))] p-5 shadow-[0_20px_44px_rgba(5,8,22,0.18)]">
              <h3 className="font-display text-xl font-semibold text-white">
                LPG shortage closures
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-200/72">
                Follow restaurants closed in Kochi due to the LPG shortage and
                spot restaurant closures affecting Ernakulam, Kerala.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="border-t border-white/6 bg-[linear-gradient(180deg,rgba(7,11,24,0.98),rgba(4,8,17,1))]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:px-8 lg:py-16">
          <div>
            <h2 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Kochi restaurant status across Ernakulam, Kerala
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-200/74">
              GasUndo is built for local search intent. If someone is looking
              for which restaurants are open in Kochi right now, Kochi food
              availability, or a map showing restaurants open in Kochi, the app
              brings those updates together in one place.
            </p>
            <p className="mt-4 text-base leading-7 text-slate-200/68">
              The map tracks Kochi LPG shortage restaurants, highlights
              restaurants affected by LPG shortage in Kochi, and makes it
              easier to find restaurants open during the LPG shortage in Kochi
              without wasting time on closed doors.
            </p>
          </div>

          <aside className="rounded-[28px] border border-white/8 bg-white/4 p-6 shadow-[0_22px_50px_rgba(5,8,22,0.18)] backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300/55">
              Why people use GasUndo
            </p>
            <div className="mt-5 space-y-4 text-sm leading-6 text-slate-200/74">
              <p>
                It reduces the time needed to find food places open in Kochi
                when restaurants are changing status quickly.
              </p>
              <p>
                It gives one shared view of Kochi restaurant availability
                instead of scattered updates across calls, chats, and social
                posts.
              </p>
              <p>
                It is useful for families, delivery workers, students, and
                commuters looking for restaurants open in Kochi today.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-white/6 bg-[radial-gradient(circle_at_top_left,rgba(255,122,69,0.1),transparent_26%),linear-gradient(180deg,rgba(5,9,20,1),rgba(4,8,17,1))]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-gold)]/72">
                FAQ
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
                Common questions about restaurants open in Kochi
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-300/66">
              GasUndo currently maps {initialRestaurants.length} restaurants
              across Kochi and nearby Ernakulam areas in Kerala.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {faqItems.map((item) => (
              <article
                key={item.question}
                className="rounded-[24px] border border-white/8 bg-white/4 p-5 shadow-[0_20px_44px_rgba(5,8,22,0.16)]"
              >
                <h3 className="font-display text-xl font-semibold text-white">
                  {item.question}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-200/72">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
