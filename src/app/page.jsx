import HomeClient from './home-client'

import { getDistrictConfig, normalizeDistrictSlug } from '@/lib/districts'
import { getRestaurants } from '@/lib/restaurants'

export const revalidate = 86400

const pageDescription =
  'GasUndo is a live Kerala restaurant status map for LPG shortage updates. Track open, limited-menu, and closed restaurants district by district, starting with Ernakulam by default.'

const faqItems = [
  {
    question: 'Which restaurants are open in Kerala today?',
    answer:
      'GasUndo shows a live map of restaurants open across Kerala, along with places serving a limited menu and restaurants closed because of the LPG shortage.',
  },
  {
    question: 'How does GasUndo show district-wise restaurant availability?',
    answer:
      'The app loads restaurants one district at a time and combines that with community updates so people can check restaurant status without slowing down the map or search suggestions.',
  },
  {
    question: 'Can I find restaurants running a limited menu in my district?',
    answer:
      'Yes. GasUndo highlights restaurants running a limited menu in the selected Kerala district so people can quickly see which food places are affected before they travel.',
  },
  {
    question: 'Why are some restaurants closed during the LPG shortage?',
    answer:
      'Restaurants across Kerala can be affected by LPG supply issues, which can lead to temporary closures, shorter hours, or reduced menus in different districts.',
  },
]

function buildStructuredData(restaurantCount, districtName) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'GasUndo',
      alternateName: ['Gas Undo', 'GasUndo Kerala', 'Gas Undo Kerala'],
      url: 'https://gasundo.live',
      inLanguage: 'en-IN',
      description: pageDescription,
      areaServed: {
        '@type': 'AdministrativeArea',
        name: 'Kerala, India',
      },
      publisher: {
        '@type': 'Organization',
        name: 'GasUndo',
        alternateName: 'Gas Undo',
        url: 'https://gasundo.live',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'GasUndo',
      alternateName: ['Gas Undo', 'GasUndo Kerala', 'Gas Undo Kerala'],
      url: 'https://gasundo.live',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Any',
      inLanguage: 'en-IN',
      description: pageDescription,
      areaServed: {
        '@type': 'AdministrativeArea',
        name: 'Kerala',
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
      },
      featureList: [
        'Live district-by-district map of restaurants open in Kerala',
        'Real-time restaurant status updates from the community',
        'Open, limited-menu, and closed restaurant availability during the LPG shortage',
        `${restaurantCount} mapped food places in ${districtName}`,
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

export default async function Page({ searchParams }) {
  let initialRestaurants = []
  let initialError = null
  const resolvedSearchParams = await searchParams
  const initialDistrictSlug = normalizeDistrictSlug(resolvedSearchParams?.district)
  const initialDistrict = getDistrictConfig(initialDistrictSlug)

  try {
    initialRestaurants = await getRestaurants(initialDistrictSlug)
  } catch (error) {
    console.error('Failed to load restaurants on the server:', error)
    initialError = 'Failed to load restaurants. Please try again.'
  }

  const structuredData = buildStructuredData(
    initialRestaurants.length,
    initialDistrict.name
  )

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
        initialDistrictSlug={initialDistrictSlug}
      />
    </main>
  )
}
