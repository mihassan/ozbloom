#!/usr/bin/env npx tsx
/**
 * Local seed script — inserts flower records into local D1 with placeholder image URLs.
 * Images point to the real R2 public bucket (already seeded remotely).
 * Run after: wrangler d1 execute ozbloom-db --local --file db/schema.sql
 */

const R2_PUBLIC_BASE = 'https://pub-aaab41c4e97c434f88a59e64879dd6c7.r2.dev'

const flowers = [
  {
    id: 'golden-wattle',
    common_name: 'Golden Wattle',
    scientific_name: 'Acacia pycnantha',
    region: 'South-eastern Australia',
    bloom_season: 'Late winter to spring (July–September)',
    color: 'Bright yellow',
    habitat: 'Dry sclerophyll woodland, mallee scrub',
    conservation_status: 'Least Concern',
    short_description: "Australia's national floral emblem, bursting with golden spherical flower clusters.",
    description: 'The Golden Wattle is Australia\'s national floral emblem, celebrated for its vivid golden-yellow spherical flower heads and distinctive blue-green phyllodes.',
    image_url: `${R2_PUBLIC_BASE}/flowers/golden-wattle.png`,
    image_alt: 'Soft watercolor illustration of Golden Wattle with bright yellow spherical flower clusters on blue-green foliage',
  },
  {
    id: 'sturts-desert-pea',
    common_name: "Sturt's Desert Pea",
    scientific_name: 'Swainsona formosa',
    region: 'Arid inland Australia',
    bloom_season: 'Year-round after rain (peak winter–spring)',
    color: 'Deep crimson with glossy black boss',
    habitat: 'Arid sandy plains, dry creek beds',
    conservation_status: 'Least Concern',
    short_description: 'Striking crimson pea flowers with a jet-black glossy centre, blooming across desert sands.',
    description: "Sturt's Desert Pea is one of Australia's most iconic wildflowers, recognised by its deep crimson pea-shaped blooms each featuring a distinctive glossy jet-black swollen boss at the centre.",
    image_url: `${R2_PUBLIC_BASE}/flowers/sturts-desert-pea.png`,
    image_alt: "Soft watercolor illustration of Sturt's Desert Pea with deep red flowers and black glossy centre on trailing desert stems",
  },
  {
    id: 'waratah',
    common_name: 'Waratah',
    scientific_name: 'Telopea speciosissima',
    region: 'New South Wales',
    bloom_season: 'Spring (September–November)',
    color: 'Vivid crimson-red',
    habitat: 'Sandstone heath, dry sclerophyll forest',
    conservation_status: 'Least Concern',
    short_description: 'Bold crimson flower heads up to 15 cm wide, the proud floral emblem of New South Wales.',
    description: 'The Waratah is the floral emblem of New South Wales and one of the most spectacular of all Australian wildflowers.',
    image_url: `${R2_PUBLIC_BASE}/flowers/waratah.png`,
    image_alt: 'Soft watercolor illustration of Waratah with large crimson dome-shaped flower head surrounded by dark green leaves',
  },
  {
    id: 'kangaroo-paw',
    common_name: 'Kangaroo Paw',
    scientific_name: 'Anigozanthos manglesii',
    region: 'South-western Western Australia',
    bloom_season: 'Spring (August–November)',
    color: 'Red and green',
    habitat: 'Kwongan heath, sandy coastal plains',
    conservation_status: 'Least Concern',
    short_description: "Tubular red-and-green flowers shaped like a kangaroo's paw, the emblem of Western Australia.",
    description: "Kangaroo Paw is the floral emblem of Western Australia, instantly recognisable by its velvety tubular flowers that split into six finger-like lobes at the tip.",
    image_url: `${R2_PUBLIC_BASE}/flowers/kangaroo-paw.png`,
    image_alt: 'Soft watercolor illustration of Kangaroo Paw showing red-stemmed tubular flowers with green split petal tips',
  },
  {
    id: 'flannel-flower',
    common_name: 'Flannel Flower',
    scientific_name: 'Actinotus helianthi',
    region: 'Eastern Australia (NSW, QLD)',
    bloom_season: 'Spring to summer (September–January)',
    color: 'White with grey-green tips',
    habitat: 'Sandy coastal heath, dry sclerophyll woodland',
    conservation_status: 'Least Concern',
    short_description: 'Soft flannel-textured white daisy-like flowers with distinctive grey-green petal tips.',
    description: 'The Flannel Flower is beloved for its soft, tactile quality — the entire plant is covered in fine grey-white woolly hairs that give it a distinctive flannel-like texture.',
    image_url: `${R2_PUBLIC_BASE}/flowers/flannel-flower.png`,
    image_alt: 'Soft watercolor illustration of Flannel Flower with white woolly-textured petals tipped in grey-green',
  },
  {
    id: 'royal-bluebell',
    common_name: 'Royal Bluebell',
    scientific_name: 'Wahlenbergia gloriosa',
    region: 'Australian Capital Territory & alpine NSW/VIC',
    bloom_season: 'Summer (December–February)',
    color: 'Deep violet-blue',
    habitat: 'Alpine and subalpine grasslands, woodland margins',
    conservation_status: 'Least Concern',
    short_description: 'Delicate deep violet-blue bell-shaped flowers, the floral emblem of the ACT.',
    description: 'The Royal Bluebell is the floral emblem of the Australian Capital Territory, growing in alpine grasslands and producing open bell-shaped flowers of striking deep violet-blue.',
    image_url: `${R2_PUBLIC_BASE}/flowers/royal-bluebell.png`,
    image_alt: 'Soft watercolor illustration of Royal Bluebell with deep violet-blue open bell-shaped flowers on slender stems',
  },
  {
    id: 'pink-mulla-mulla',
    common_name: 'Pink Mulla Mulla',
    scientific_name: 'Ptilotus exaltatus',
    region: 'Arid and semi-arid inland Australia',
    bloom_season: 'Winter to spring (July–October)',
    color: 'Pink to purple',
    habitat: 'Sandy desert plains, dry grasslands',
    conservation_status: 'Least Concern',
    short_description: 'Fluffy conical spikes of pink-purple flowers rising from arid sandy plains.',
    description: 'Pink Mulla Mulla produces striking elongated fluffy cone-shaped flower spikes in shades of pink, mauve, and purple, rising from rosettes of grey-green leaves on arid sandy plains.',
    image_url: `${R2_PUBLIC_BASE}/flowers/pink-mulla-mulla.png`,
    image_alt: 'Soft watercolor illustration of Pink Mulla Mulla with tall fluffy pink-purple conical flower spikes',
  },
  {
    id: 'banksia',
    common_name: 'Banksia',
    scientific_name: 'Banksia speciosa',
    region: 'South-western Western Australia',
    bloom_season: 'Summer to autumn (January–April)',
    color: 'Pale yellow to cream',
    habitat: 'Kwongan heath, coastal sand plains',
    conservation_status: 'Least Concern',
    short_description: 'Dramatic cylindrical flower spikes packed with pale yellow blooms, a keystone of Australian heath.',
    description: "Banksia speciosa produces spectacular large cylindrical flower spikes packed with hundreds of pale yellow individual flowers that age to a rich gold.",
    image_url: `${R2_PUBLIC_BASE}/flowers/banksia.png`,
    image_alt: 'Soft watercolor illustration of Banksia with large cylindrical pale yellow flower spike and deeply serrated leaves',
  },
]

const DB_ID = '273c4c7e-c370-44ad-adb1-618715cec239'
const ACCOUNT_ID = '3bea2e6d6f93b5cc822b36b69958d4cd'
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN

if (!API_TOKEN) {
  console.error('CLOUDFLARE_API_TOKEN not set')
  process.exit(1)
}

const sql = `INSERT OR REPLACE INTO flowers
  (id, common_name, scientific_name, region, bloom_season, color,
   habitat, conservation_status, short_description, description,
   image_url, image_alt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

for (const f of flowers) {
  const params = [
    f.id, f.common_name, f.scientific_name, f.region, f.bloom_season,
    f.color, f.habitat, f.conservation_status, f.short_description,
    f.description, f.image_url, f.image_alt,
  ]
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, params }),
    },
  )
  if (!res.ok) {
    const err = await res.text()
    console.error(`Failed to insert ${f.id}: ${err}`)
    process.exit(1)
  }
  console.log(`✓ ${f.common_name}`)
}
console.log('Local seed complete.')
