#!/usr/bin/env npx tsx
/**
 * OzBloom seed script
 *
 * Usage (after D1 + R2 are created and schema applied):
 *   CLOUDFLARE_API_TOKEN=<token> npx tsx scripts/seed.ts
 *
 * What it does:
 *   1. Generates a watercolor botanical image for each flower via Cloudflare AI
 *   2. Uploads the image to R2 (ozbloom-images bucket)
 *   3. Inserts the flower record into D1 (ozbloom-db) with the public R2 URL
 */

const ACCOUNT_ID = '3bea2e6d6f93b5cc822b36b69958d4cd'
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN
const R2_BUCKET = 'ozbloom-images'
const D1_DB_ID = process.env.D1_DATABASE_ID // set after `wrangler d1 create`
const R2_PUBLIC_BASE = process.env.R2_PUBLIC_URL // e.g. https://pub-xxx.r2.dev

if (!API_TOKEN) {
  console.error('Missing CLOUDFLARE_API_TOKEN')
  process.exit(1)
}
if (!D1_DB_ID) {
  console.error('Missing D1_DATABASE_ID — run `wrangler d1 create ozbloom-db` first and export the ID')
  process.exit(1)
}
if (!R2_PUBLIC_BASE) {
  console.error('Missing R2_PUBLIC_URL — enable public access on the bucket and export its base URL')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Flower data
// ---------------------------------------------------------------------------

interface FlowerRecord {
  id: string
  common_name: string
  scientific_name: string
  region: string
  bloom_season: string
  color: string
  habitat: string
  conservation_status: string
  short_description: string
  description: string
  image_prompt: string
  image_alt: string
}

const FLOWERS: FlowerRecord[] = [
  {
    id: 'golden-wattle',
    common_name: 'Golden Wattle',
    scientific_name: 'Acacia pycnantha',
    region: 'South-eastern Australia',
    bloom_season: 'Late winter to spring (July–September)',
    color: 'Bright yellow',
    habitat: 'Dry sclerophyll woodland, mallee scrub',
    conservation_status: 'Least Concern',
    short_description: "Australia's national floral emblem, bursting with golden球形 flower clusters.",
    description:
      'The Golden Wattle is Australia\'s national floral emblem, celebrated for its vivid golden-yellow spherical flower heads and distinctive blue-green phyllodes. It thrives in dry sclerophyll woodlands and mallee scrub across south-eastern Australia, typically flowering from late winter through spring. The species is highly adaptable and has become naturalised in parts of Western Australia, South Africa, and southern Europe.',
    image_prompt:
      'Soft watercolor botanical illustration of Golden Wattle (Acacia pycnantha), bright golden-yellow spherical fluffy flower clusters on arching branches with blue-green lance-shaped leaves, delicate washes of gold and sage, white background, natural field-guide style',
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
    description:
      "Sturt's Desert Pea is one of Australia's most iconic wildflowers, recognised by its deep crimson pea-shaped blooms each featuring a distinctive glossy jet-black swollen boss at the centre. It trails low across sandy arid plains and dry creek beds throughout inland Australia, often transforming barren desert landscapes into carpets of colour after rainfall. It is the floral emblem of South Australia.",
    image_prompt:
      "Soft watercolor botanical illustration of Sturt's Desert Pea (Swainsona formosa), deep crimson red pea flowers with jet-black glossy rounded boss centre, trailing stems with silver-grey pinnate leaves on sandy desert ground, dramatic rich reds and charcoal, natural field-guide style",
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
    description:
      'The Waratah is the floral emblem of New South Wales and one of the most spectacular of all Australian wildflowers. Its large, dome-shaped flower heads — up to 15 cm across — consist of tightly packed crimson tubular florets surrounded by vivid red bracts. It grows in sandstone heath and dry sclerophyll forest along the coast and ranges of New South Wales, flowering prolifically in spring. The name comes from the Eora Aboriginal people meaning "seen from afar".',
    image_prompt:
      'Soft watercolor botanical illustration of Waratah (Telopea speciosissima), large dome-shaped vivid crimson-red flower head with radiating florets and red bracts, dark green leathery serrated leaves, bold washes of scarlet and forest green, natural field-guide style',
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
    short_description: 'Tubular red-and-green flowers shaped like a kangaroo\'s paw, the emblem of Western Australia.',
    description:
      "Kangaroo Paw is the floral emblem of Western Australia and is instantly recognisable by its velvety tubular flowers that split into six finger-like lobes at the tip, resembling a kangaroo's paw. The most celebrated species, Anigozanthos manglesii, displays a striking bicolour of bright green petals emerging from a deep red woolly stem. It grows in kwongan heath and sandy coastal plains of south-western Western Australia and is now widely cultivated in gardens worldwide.",
    image_prompt:
      'Soft watercolor botanical illustration of Kangaroo Paw (Anigozanthos manglesii), tubular velvety flowers with bright green petal lobes on deep red hairy stems, long strap-like green leaves, rich greens and crimsons with fine fuzzy texture detail, natural field-guide style',
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
    description:
      'The Flannel Flower is beloved for its soft, tactile quality — the entire plant, including the flower bracts and stems, is covered in fine grey-white woolly hairs that give it a distinctive flannel-like texture. The flower heads resemble large daisies with white bracts tipped in grey-green, surrounding a creamy-white centre. It grows in sandy heath and dry sclerophyll woodland along the eastern coast of Australia and is widely used in the cut-flower industry.',
    image_prompt:
      'Soft watercolor botanical illustration of Flannel Flower (Actinotus helianthi), daisy-like white flower with grey-green tipped bracts and woolly fuzzy texture, feathery grey-green divided leaves, delicate pale washes of white and sage grey, natural field-guide style',
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
    description:
      'The Royal Bluebell is the floral emblem of the Australian Capital Territory and grows in alpine and subalpine grasslands and woodland margins in the ACT and neighbouring regions of NSW and Victoria. Its slender stems carry open bell-shaped flowers of a striking deep violet-blue with five spreading petals. It typically flowers in summer at altitude, often forming carpets of vivid blue across grassy slopes.',
    image_prompt:
      'Soft watercolor botanical illustration of Royal Bluebell (Wahlenbergia gloriosa), delicate open bell-shaped deep violet-blue flowers on slender wiry stems, small narrow green leaves, luminous washes of indigo and violet on white background, natural field-guide style',
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
    description:
      'Pink Mulla Mulla produces striking elongated fluffy cone-shaped flower spikes in shades of pink, mauve, and purple, rising from rosettes of grey-green leaves on arid sandy plains. After rain, it transforms vast stretches of outback Australia into waves of soft pink. It is common across the arid and semi-arid regions of all mainland states and is increasingly popular in horticulture for its long-lasting blooms and drought tolerance.',
    image_prompt:
      'Soft watercolor botanical illustration of Pink Mulla Mulla (Ptilotus exaltatus), tall fluffy elongated conical flower spikes in soft pink and mauve, grey-green basal rosette leaves on sandy arid ground, gentle washes of pink, lilac and silver-grey, natural field-guide style',
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
    description:
      "Banksia speciosa, the Showy Banksia, produces spectacular large cylindrical flower spikes packed with hundreds of pale yellow individual flowers that age to a rich gold. The deeply serrated leaves have white undersides, creating a striking two-tone effect. It grows in kwongan heath on the coastal sand plains of south-western Western Australia and is a critical nectar source for honeyeaters and other wildlife. The large woody seed cones persist on the plant for years, opening only after fire.",
    image_prompt:
      'Soft watercolor botanical illustration of Banksia (Banksia speciosa), large cylindrical pale yellow flower spike packed with tiny florets, deeply serrated dark green leaves with white undersides, warm golden yellows and forest greens, natural field-guide style',
    image_alt: 'Soft watercolor illustration of Banksia with large cylindrical pale yellow flower spike and deeply serrated leaves',
  },
]

// ---------------------------------------------------------------------------
// Cloudflare API helpers
// ---------------------------------------------------------------------------

const CF_BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}`

async function generateImage(prompt: string): Promise<Uint8Array> {
  console.log('  Generating image via Cloudflare AI...')
  const res = await fetch(
    `${CF_BASE}/ai/run/@cf/bytedance/stable-diffusion-xl-lightning`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    },
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`AI generation failed (${res.status}): ${err}`)
  }
  const buf = await res.arrayBuffer()
  return new Uint8Array(buf)
}

async function uploadToR2(key: string, data: Uint8Array): Promise<string> {
  console.log(`  Uploading to R2: ${key}...`)
  const res = await fetch(
    `${CF_BASE}/r2/buckets/${R2_BUCKET}/objects/${key}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'image/png',
      },
      body: data,
    },
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`R2 upload failed (${res.status}): ${err}`)
  }
  return `${R2_PUBLIC_BASE!.replace(/\/$/, '')}/${key}`
}

async function insertFlower(flower: FlowerRecord & { image_url: string }): Promise<void> {
  console.log(`  Inserting into D1: ${flower.id}...`)
  const sql = `
    INSERT OR REPLACE INTO flowers
      (id, common_name, scientific_name, region, bloom_season, color,
       habitat, conservation_status, short_description, description,
       image_url, image_alt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  const params = [
    flower.id,
    flower.common_name,
    flower.scientific_name,
    flower.region,
    flower.bloom_season,
    flower.color,
    flower.habitat,
    flower.conservation_status,
    flower.short_description,
    flower.description,
    flower.image_url,
    flower.image_alt,
  ]

  const res = await fetch(
    `${CF_BASE}/d1/database/${D1_DB_ID}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    },
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`D1 insert failed (${res.status}): ${err}`)
  }
  const json = (await res.json()) as { success: boolean; errors?: unknown[] }
  if (!json.success) {
    throw new Error(`D1 insert error: ${JSON.stringify(json.errors)}`)
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Seeding ${FLOWERS.length} flowers...\n`)

  for (const flower of FLOWERS) {
    console.log(`[${flower.id}]`)

    let imageBytes: Uint8Array
    try {
      imageBytes = await generateImage(flower.image_prompt)
    } catch (err) {
      console.error(`  ✗ Image generation failed: ${err}`)
      process.exit(1)
    }

    const imageKey = `flowers/${flower.id}.png`
    let imageUrl: string
    try {
      imageUrl = await uploadToR2(imageKey, imageBytes)
    } catch (err) {
      console.error(`  ✗ R2 upload failed: ${err}`)
      process.exit(1)
    }

    try {
      await insertFlower({ ...flower, image_url: imageUrl })
    } catch (err) {
      console.error(`  ✗ D1 insert failed: ${err}`)
      process.exit(1)
    }

    console.log(`  ✓ Done — ${imageUrl}\n`)
  }

  console.log('Seed complete. Verifying row count...')
  const res = await fetch(
    `${CF_BASE}/d1/database/${D1_DB_ID}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql: 'SELECT count(*) as count FROM flowers', params: [] }),
    },
  )
  const json = (await res.json()) as { result: Array<{ results: Array<{ count: number }> }> }
  const count = json.result?.[0]?.results?.[0]?.count
  console.log(`Rows in flowers table: ${count}`)
  if (count !== 8) {
    console.error(`Expected 8, got ${count}`)
    process.exit(1)
  }
  console.log('✓ All 8 flowers seeded successfully.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
