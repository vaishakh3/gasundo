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
    </main>
  )
}
