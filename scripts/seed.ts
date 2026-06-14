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
  {
    id: 'common-heath',
    common_name: 'Common Heath',
    scientific_name: 'Epacris impressa',
    region: 'South-eastern Australia (VIC, TAS, SA)',
    bloom_season: 'Autumn to spring (April–October)',
    color: 'Pink to white',
    habitat: 'Heath, dry sclerophyll forest, coastal scrub',
    conservation_status: 'Least Concern',
    short_description: "Victoria's floral emblem — delicate tubular pink bells lining slender arching stems.",
    description: "Common Heath is the floral emblem of Victoria and one of the most widespread heathland plants in south-eastern Australia. Its slender, arching stems are densely lined with tubular bell-shaped flowers that range from deep pink to pale white. It flowers over a long season from autumn through spring, providing vital nectar for honeyeaters during cooler months when few other flowers are available.",
    image_prompt: 'Soft watercolor botanical illustration of Common Heath (Epacris impressa), slender arching stems densely lined with small tubular pink bell-shaped flowers, tiny dark green needle-like leaves, delicate washes of rose pink and sage, natural field-guide style',
    image_alt: 'Soft watercolor illustration of Common Heath with arching stems of tubular pink bell flowers',
  },
  {
    id: 'mountain-devil',
    common_name: 'Mountain Devil',
    scientific_name: 'Lambertia formosa',
    region: 'New South Wales (Sydney Basin)',
    bloom_season: 'Year-round (peak spring–summer)',
    color: 'Bright red',
    habitat: 'Sandstone heath, dry sclerophyll woodland',
    conservation_status: 'Least Concern',
    short_description: 'Bright red tubular flowers in star-shaped clusters, with a distinctively horned seed pod.',
    description: "Mountain Devil is a striking shrub endemic to the Sydney Basin, producing clusters of bright red tubular flowers arranged in sevens at the branch tips. Its common name comes from the horned woody seed pod that develops after flowering, which resembles a small devil's face. It is a key food source for honeyeaters and grows in sandstone heath and dry sclerophyll woodland.",
    image_prompt: 'Soft watercolor botanical illustration of Mountain Devil (Lambertia formosa), clusters of bright red tubular flowers in sevens at branch tips, dark green needle-like leaves, vivid scarlet and forest green washes, natural field-guide style',
    image_alt: 'Soft watercolor illustration of Mountain Devil with clusters of bright red tubular flowers',
  },
  {
    id: 'spider-orchid',
    common_name: 'Spider Orchid',
    scientific_name: 'Caladenia longicauda',
    region: 'South-western Western Australia',
    bloom_season: 'Spring (August–October)',
    color: 'White with red markings',
    habitat: 'Kwongan heath, jarrah forest margins',
    conservation_status: 'Least Concern',
    short_description: 'Ethereal white orchid with long spider-like petals tipped in delicate red clubs.',
    description: "The White Spider Orchid is one of Western Australia's most elegant wildflowers, with a single large white flower per stem featuring dramatically elongated lateral petals and sepals with clubbed tips. It grows in small colonies in kwongan heath and jarrah forest margins, relying on specific mycorrhizal fungi and pollinator wasps for reproduction. Each plant produces only one flower per season.",
    image_prompt: 'Soft watercolor botanical illustration of Spider Orchid (Caladenia longicauda), single white orchid flower with dramatically long spider-like petals tipped in red clubs, single narrow green leaf, delicate white and crimson washes, natural field-guide style',
    image_alt: 'Soft watercolor illustration of Spider Orchid with long white spider-like petals tipped in red',
  },
  {
    id: 'native-violet',
    common_name: 'Native Violet',
    scientific_name: 'Viola hederacea',
    region: 'Eastern Australia (QLD, NSW, VIC, TAS)',
    bloom_season: 'Year-round',
    color: 'Purple and white',
    habitat: 'Moist forest floors, creek banks, shaded gardens',
    conservation_status: 'Least Concern',
    short_description: 'Delicate purple-and-white flowers carpeting moist forest floors year-round.',
    description: "Native Violet is a low-growing groundcover that spreads by runners across moist forest floors and creek banks. Its small flowers feature five petals in a distinctive pattern of purple above and white below, often with fine purple veins. Unlike introduced violets, it flowers year-round in suitable conditions and is an important food plant for the caterpillars of several fritillary butterfly species in Australia.",
    image_prompt: 'Soft watercolor botanical illustration of Native Violet (Viola hederacea), small five-petalled flowers with purple upper petals and white lower petals with fine veining, round kidney-shaped leaves on creeping stems, soft violet and white washes, natural field-guide style',
    image_alt: 'Soft watercolor illustration of Native Violet with small purple and white five-petalled flowers on creeping stems',
  },
  {
    id: 'boronia',
    common_name: 'Brown Boronia',
    scientific_name: 'Boronia megastigma',
    region: 'South-western Western Australia',
    bloom_season: 'Winter to spring (July–October)',
    color: 'Brown outside, yellow inside',
    habitat: 'Swampy heath, seasonally wet flats',
    conservation_status: 'Least Concern',
    short_description: 'Intensely fragrant small bells — chocolate-brown outside, golden-yellow inside.',
    description: "Brown Boronia is one of the most powerfully fragrant wildflowers in Australia, producing small cup-shaped flowers with chocolate-brown outer petals and golden-yellow inner surfaces. The rich, sweet scent is used in perfumery and is carried far on winter breezes across the swampy heath of south-western Western Australia. Despite its common name, the contrast of brown and gold makes it one of the most visually striking small flowers of the region.",
    image_prompt: 'Soft watercolor botanical illustration of Brown Boronia (Boronia megastigma), small cup-shaped flowers with rich chocolate-brown outer petals and bright golden-yellow inner petals, fine aromatic dark green leaves, warm brown and yellow washes, natural field-guide style',
    image_alt: 'Soft watercolor illustration of Brown Boronia with chocolate-brown and golden-yellow cup-shaped flowers',
  },
  {
    id: 'blue-tinsel-lily',
    common_name: 'Blue Tinsel Lily',
    scientific_name: 'Calectasia cyanea',
    region: 'South-western Western Australia',
    bloom_season: 'Spring (August–October)',
    color: 'Metallic blue-purple',
    habitat: 'Kwongan heath, sandy coastal plains',
    conservation_status: 'Least Concern',
    short_description: 'Starry metallic blue-purple flowers with glittering golden stamens — a jewel of the heath.',
    description: "Blue Tinsel Lily is one of the most dazzling of all Western Australian wildflowers, producing star-shaped flowers of an intense metallic blue-purple with conspicuous golden stamens at the centre. The petals have a distinctive waxy, almost foil-like sheen that catches the light. It grows as a low wiry shrub in kwongan heath on sandy coastal plains, often found growing among grass trees and other iconic WA wildflowers.",
    image_prompt: 'Soft watercolor botanical illustration of Blue Tinsel Lily (Calectasia cyanea), star-shaped metallic blue-purple flowers with golden stamens, wiry stems with small stiff leaves, luminous indigo and violet washes with gold centres, natural field-guide style',
    image_alt: 'Soft watercolor illustration of Blue Tinsel Lily with metallic blue-purple star flowers and golden stamens',
  },
  {
    id: 'yellow-box',
    common_name: 'Yellow Box',
    scientific_name: 'Eucalyptus melliodora',
    region: 'South-eastern Australia (NSW, VIC, ACT)',
    bloom_season: 'Summer (December–February)',
    color: 'Creamy white',
    habitat: 'Dry woodland, grassy woodland, tablelands',
    conservation_status: 'Least Concern',
    short_description: 'Honey-scented creamy white blossoms — one of the most important nectar trees of inland Australia.',
    description: "Yellow Box is one of the most beloved eucalypts of south-eastern Australia, famous for the intensely sweet honey-like fragrance of its creamy white flowers. It is a critical nectar source for honeyeaters, lorikeets, and countless insects. The species name melliodora means 'honey-scented', and its flowers are a primary source for much of Australia's prized box honey. It grows in dry and grassy woodland across the inland tablelands.",
    image_prompt: 'Soft watercolor botanical illustration of Yellow Box (Eucalyptus melliodora), clusters of creamy white eucalyptus blossoms with fluffy stamens, grey-green lance-shaped leaves, soft white and sage washes on warm cream background, natural field-guide style',
    image_alt: 'Soft watercolor illustration of Yellow Box with clusters of creamy white fluffy eucalyptus blossoms',
  },
  {
    id: 'pincushion-hakea',
    common_name: 'Pincushion Hakea',
    scientific_name: 'Hakea laurina',
    region: 'South-western Western Australia',
    bloom_season: 'Autumn to winter (April–July)',
    color: 'Red and cream',
    habitat: 'Kwongan heath, mallee, jarrah forest',
    conservation_status: 'Least Concern',
    short_description: 'Globe-shaped crimson flower heads pierced with cream-tipped pins — one of WA\'s most striking shrubs.',
    description: "Pincushion Hakea is one of the most dramatic flowering shrubs of south-western Western Australia, producing large globe-shaped flower heads of deep crimson covered with long cream-tipped styles that give it the appearance of an ornate pincushion. It flowers in autumn and winter, providing nectar when few other species bloom. The large woody seed pods that follow persist on the plant for years.",
    image_prompt: 'Soft watercolor botanical illustration of Pincushion Hakea (Hakea laurina), large round globe-shaped crimson flower head densely covered with long cream-tipped pin-like styles, broad grey-green leaves, deep red and cream washes, natural field-guide style',
    image_alt: 'Soft watercolor illustration of Pincushion Hakea with large crimson globe flower head covered in cream-tipped pins',
  },
  {
    id: 'trigger-plant',
    common_name: 'Trigger Plant',
    scientific_name: 'Stylidium graminifolium',
    region: 'Eastern and southern Australia',
    bloom_season: 'Spring to summer (October–January)',
    color: 'Pink to magenta',
    habitat: 'Heath, dry and wet sclerophyll forest, grassland',
    conservation_status: 'Least Concern',
    short_description: 'Vivid pink flowers with a spring-loaded trigger column that snaps onto visiting insects.',
    description: "Trigger Plant is one of Australia's most fascinating wildflowers, featuring a spring-loaded column that rapidly snaps downward to dust visiting insects with pollen. This unique pollination mechanism is triggered by the weight of an insect landing on the flower. Wiry grass-like leaves form a basal rosette from which tall flower spikes rise, bearing vivid pink to magenta flowers with asymmetric petals.",
    image_prompt: 'Soft watercolor botanical illustration of Trigger Plant (Stylidium graminifolium), tall spike of vivid pink to magenta asymmetric four-petalled flowers with visible bent column trigger, grass-like basal leaves, vivid pink and magenta washes, natural field-guide style',
    image_alt: 'Soft watercolor illustration of Trigger Plant with tall spikes of vivid pink asymmetric flowers',
  },
  {
    id: 'christmas-bell',
    common_name: 'Christmas Bell',
    scientific_name: 'Blandfordia grandiflora',
    region: 'Eastern Australia (QLD, NSW)',
    bloom_season: 'Summer (November–January)',
    color: 'Red and yellow',
    habitat: 'Coastal heath, wallum swamp, sandy flats',
    conservation_status: 'Least Concern',
    short_description: 'Cheerful red-and-yellow bell-shaped flowers blooming at Christmas across coastal heaths.',
    description: "Christmas Bell blooms in time for the Australian summer holiday season, producing clusters of large, nodding bell-shaped flowers in brilliant red with yellow tips. It grows in coastal heath, wallum swamp, and sandy flats along the east coast, and has long been popular as a cut flower. Despite its attractive appearance, over-picking in the wild has led to local declines in some areas.",
    image_prompt: 'Soft watercolor botanical illustration of Christmas Bell (Blandfordia grandiflora), clusters of large nodding red bell-shaped flowers with yellow tipped lobes, long strap-like leaves, vivid red and golden yellow washes, natural field-guide style',
    image_alt: 'Soft watercolor illustration of Christmas Bell with clusters of large red bell-shaped flowers with yellow tips',
  },
  {
    id: 'grevillea-robusta',
    common_name: 'Silky Oak',
    scientific_name: 'Grevillea robusta',
    region: 'Queensland and northern New South Wales',
    bloom_season: 'Spring (September–November)',
    color: 'Golden orange',
    habitat: 'Subtropical rainforest margins, dry sclerophyll forest',
    conservation_status: 'Least Concern',
    short_description: 'Spectacular golden-orange toothbrush flower spikes on a towering fern-leaved tree.',
    description: "Silky Oak is the largest of all grevilleas, growing into a tall tree with finely divided fern-like leaves and spectacular one-sided spikes of golden-orange flowers. The flowers are a vital food source for large honeyeaters and lorikeets. Originally from subtropical rainforest margins and dry sclerophyll forest in south-eastern Queensland and northern NSW, it is now planted widely in Australia and around the world as an ornamental street tree.",
    image_prompt: 'Soft watercolor botanical illustration of Silky Oak (Grevillea robusta), one-sided spikes of golden-orange flowers with recurved styles, finely divided fern-like pinnate leaves, warm amber and gold washes, natural field-guide style',
    image_alt: 'Soft watercolor illustration of Silky Oak with one-sided golden-orange flower spikes on fern-like foliage',
  },
  {
    id: 'coral-gum',
    common_name: 'Coral Gum',
    scientific_name: 'Eucalyptus torquata',
    region: 'Western Australia (Goldfields)',
    bloom_season: 'Summer to autumn (November–April)',
    color: 'Coral pink to red',
    habitat: 'Arid and semi-arid woodland, rocky ranges',
    conservation_status: 'Least Concern',
    short_description: 'Clusters of frilly coral-pink eucalyptus buds and flowers on a small ornamental tree.',
    description: "Coral Gum is one of the most ornamental of all eucalypts, prized for its unusual ribbed coral-pink to red flower buds and frilly blossoms. The distinctive buds have a corrugated cap that sits atop a ridged tube, giving them a sculptural quality unlike most other gum blossoms. It grows naturally in the goldfields of Western Australia on rocky ranges and is widely planted as an ornamental in dry-climate gardens.",
    image_prompt: 'Soft watercolor botanical illustration of Coral Gum (Eucalyptus torquata), clusters of frilly coral-pink to red eucalyptus flowers with ribbed buds, grey-green pendulous leaves, warm coral and rose washes, natural field-guide style',
    image_alt: 'Soft watercolor illustration of Coral Gum with clusters of frilly coral-pink eucalyptus flowers',
  },
  {
    id: 'swamp-lily',
    common_name: 'Swamp Lily',
    scientific_name: 'Crinum pedunculatum',
    region: 'Eastern Australia (QLD, NSW)',
    bloom_season: 'Summer (December–February)',
    color: 'White',
    habitat: 'Coastal swamps, estuaries, wetland margins',
    conservation_status: 'Least Concern',
    short_description: 'Elegant white lily flowers with long curved stamens, rising from coastal swamps.',
    description: "Swamp Lily is a striking bulbous plant that grows in coastal swamps, estuaries, and wetland margins along the eastern coast of Australia. Large umbels of pure white lily flowers with long, gracefully curved stamens rise on tall stems above strap-like leaves up to a metre long. The flowers are sweetly fragrant, especially at night. Large green seed pods follow, which float in water to disperse seeds to new wetland sites.",
    image_prompt: 'Soft watercolor botanical illustration of Swamp Lily (Crinum pedunculatum), umbel of pure white lily flowers with long curved white stamens on tall stem, broad strap-like leaves, luminous white and pale green washes, natural field-guide style',
    image_alt: 'Soft watercolor illustration of Swamp Lily with umbel of white lily flowers and long curved stamens',
  },
  {
    id: 'smokebush',
    common_name: 'Smokebush',
    scientific_name: 'Conospermum stoechadis',
    region: 'South-western Western Australia',
    bloom_season: 'Spring (August–November)',
    color: 'White to pale grey',
    habitat: 'Kwongan heath, sandy coastal plains',
    conservation_status: 'Least Concern',
    short_description: 'Clouds of tiny white woolly flowers giving the appearance of wisps of smoke over grey-green heath.',
    description: "Smokebush produces masses of tiny tubular white flowers covered in fine grey-white hairs that collectively give the plant the misty, smoke-like appearance its common name describes. It grows as a shrub in kwongan heath and sandy coastal plains of south-western Western Australia, often covering hillsides in a haze of white during spring. It is one of more than 50 species of smokebush found in Australia, nearly all endemic to Western Australia.",
    image_prompt: 'Soft watercolor botanical illustration of Smokebush (Conospermum stoechadis), masses of tiny woolly white tubular flowers in dense clusters giving a smoky misty appearance, grey-green narrow leaves, delicate white and silver-grey washes, natural field-guide style',
    image_alt: 'Soft watercolor illustration of Smokebush with clouds of tiny white woolly flowers over grey-green foliage',
  },
  {
    id: 'blue-gum',
    common_name: 'Tasmanian Blue Gum',
    scientific_name: 'Eucalyptus globulus',
    region: 'Tasmania and southern Victoria',
    bloom_season: 'Winter to spring (July–November)',
    color: 'Creamy white',
    habitat: 'Tall open forest, coastal gullies, moist slopes',
    conservation_status: 'Least Concern',
    short_description: "Tasmania's floral emblem — creamy white blossoms on Australia's most recognised eucalypt.",
    description: "Tasmanian Blue Gum is Tasmania's floral emblem and the world's most widely planted eucalypt. Its large, solitary creamy-white flowers are capped by a distinctive warty operculum before opening to reveal a mass of stamens. The waxy blue-green juvenile leaves are quite different from the adult foliage. Native to Tasmania and coastal Victoria, it has been planted globally for timber and oil production.",
    image_prompt: 'Soft watercolor botanical illustration of Tasmanian Blue Gum (Eucalyptus globulus), large solitary creamy white fluffy eucalyptus flower with warty cap beside flower bud, broad blue-green leaves, soft white and blue-green washes, natural field-guide style',
    image_alt: 'Soft watercolor illustration of Tasmanian Blue Gum with large creamy white fluffy flower and blue-green foliage',
  },
  {
    id: 'sundew',
    common_name: 'Rainbow Sundew',
    scientific_name: 'Drosera macrantha',
    region: 'South-western Western Australia',
    bloom_season: 'Spring (August–October)',
    color: 'White to pale pink',
    habitat: 'Kwongan heath, seasonally wet sand',
    conservation_status: 'Least Concern',
    short_description: 'A climbing carnivorous plant with glistening dew-drop tentacles and delicate white flowers.',
    description: "Rainbow Sundew is a climbing carnivorous plant unique to the kwongan heath of south-western Western Australia. Stems up to a metre long twine through surrounding vegetation, bearing glistening red and green leaves covered in sticky tentacles that trap insects. Despite its fearsome feeding strategy, it produces delicate five-petalled white to pale pink flowers. The glistening tentacle droplets create a rainbow effect in sunlight — hence the common name.",
    image_prompt: 'Soft watercolor botanical illustration of Rainbow Sundew (Drosera macrantha), climbing stems with round leaves covered in glistening red sticky tentacles, small white five-petalled flowers, vibrant red and green washes with sparkling dewdrops, natural field-guide style',
    image_alt: 'Soft watercolor illustration of Rainbow Sundew with glistening red-tentacled leaves and white flowers',
  },
  {
    id: 'lechenaultia',
    common_name: 'Red Lechenaultia',
    scientific_name: 'Lechenaultia formosa',
    region: 'South-western Western Australia',
    bloom_season: 'Spring (August–November)',
    color: 'Brilliant red to orange',
    habitat: 'Kwongan heath, gravelly flats, sandy plains',
    conservation_status: 'Least Concern',
    short_description: 'Vivid red-to-orange irregular flowers carpeting sandy heath — among the most dazzling of WA wildflowers.',
    description: "Red Lechenaultia is one of the most vibrantly coloured wildflowers in Australia, producing masses of brilliant red to deep orange irregular flowers across a low spreading shrub. The flowers have a distinctive two-lipped form with frilly petal edges. It grows on gravelly flats and sandy plains in the kwongan heath of south-western Western Australia, often forming spectacular massed displays in spring. It is increasingly popular in horticulture.",
    image_prompt: 'Soft watercolor botanical illustration of Red Lechenaultia (Lechenaultia formosa), masses of brilliant red to orange irregular two-lipped frilly flowers on low spreading shrub, small narrow grey-green leaves, vivid scarlet and orange washes, natural field-guide style',
    image_alt: 'Soft watercolor illustration of Red Lechenaultia with masses of brilliant red-orange irregular frilly flowers',
  },
  {
    id: 'geraldton-wax',
    common_name: 'Geraldton Wax',
    scientific_name: 'Chamelaucium uncinatum',
    region: 'Western Australia (midwest coast)',
    bloom_season: 'Winter to spring (July–October)',
    color: 'White to pink to purple',
    habitat: 'Coastal heath, sandy and gravelly soils',
    conservation_status: 'Least Concern',
    short_description: 'Delicate waxy five-petalled flowers in white or pink, beloved in floristry worldwide.',
    description: "Geraldton Wax is one of Australia's most successful cut flowers, exported globally from Western Australia. The small waxy five-petalled flowers are produced in great abundance along arching stems, ranging from pure white through shades of pink to deep purple depending on cultivar. It grows naturally in coastal heath north of Perth, thriving in well-drained sandy and gravelly soils in full sun.",
    image_prompt: 'Soft watercolor botanical illustration of Geraldton Wax (Chamelaucium uncinatum), small delicate five-petalled waxy flowers in white to soft pink on arching stems, fine needle-like leaves, pale pink and white washes, natural field-guide style',
    image_alt: 'Soft watercolor illustration of Geraldton Wax with delicate white-to-pink waxy five-petalled flowers',
  },
  {
    id: 'mountain-ash',
    common_name: 'Mountain Ash',
    scientific_name: 'Eucalyptus regnans',
    region: 'Victoria and Tasmania',
    bloom_season: 'Summer (January–March)',
    color: 'White',
    habitat: 'Cool temperate rainforest margins, mountain ash forest',
    conservation_status: 'Least Concern',
    short_description: 'Pure white blossoms on the tallest flowering plant on Earth — the iconic Mountain Ash.',
    description: "Mountain Ash is the tallest flowering plant on Earth, with record specimens reaching over 100 metres. Despite the immense size of the tree, its flowers are typical eucalyptus blossoms — creamy white pom-poms of stamens held in clusters along the branches. The flowers provide nectar for large numbers of birds, bats, and insects at altitude. Mountain Ash forests in Victoria's central highlands are among the most carbon-dense forests in the world.",
    image_prompt: 'Soft watercolor botanical illustration of Mountain Ash (Eucalyptus regnans), clusters of pure white fluffy eucalyptus blossoms with multiple stamens, blue-green lance-shaped leaves, clean white and pale green washes, natural field-guide style',
    image_alt: 'Soft watercolor illustration of Mountain Ash with clusters of pure white fluffy eucalyptus flowers',
  },
  {
    id: 'sturt-desert-rose',
    common_name: "Sturt's Desert Rose",
    scientific_name: 'Gossypium sturtianum',
    region: 'Arid inland Australia (NT, SA, QLD, NSW)',
    bloom_season: 'Year-round after rain (peak winter–spring)',
    color: 'Mauve to purple with deep red centre',
    habitat: 'Arid rocky ranges, dry creek beds, desert shrubland',
    conservation_status: 'Least Concern',
    short_description: "The Northern Territory's floral emblem — silky mauve petals with a deep crimson centre, blooming across desert ranges.",
    description: "Sturt's Desert Rose is the floral emblem of the Northern Territory and one of the most beautiful wildflowers of arid Australia. Its large hibiscus-like flowers display silky mauve to purple petals with a distinctive deep crimson basal blotch at the centre. It grows on rocky ranges, dry creek beds, and desert shrubland throughout inland Australia, flowering most prolifically after rainfall events.",
    image_prompt: "Soft watercolor botanical illustration of Sturt's Desert Rose (Gossypium sturtianum), large silky hibiscus-like flower with mauve to purple petals and deep crimson basal blotch centre, grey-green lobed leaves, soft mauve and deep crimson washes, natural field-guide style",
    image_alt: "Soft watercolor illustration of Sturt's Desert Rose with large mauve hibiscus-like flower and deep red centre",
  },
  {
    id: 'pink-everlasting',
    common_name: 'Pink Everlasting',
    scientific_name: 'Rhodanthe manglesii',
    region: 'Western Australia',
    bloom_season: 'Spring (August–October)',
    color: 'Pink to white with yellow centre',
    habitat: 'Sandy plains, open woodland, disturbed ground',
    conservation_status: 'Least Concern',
    short_description: 'Papery pink and white daisy flowers that retain their colour when dried — iconic WA wildflower.',
    description: "Pink Everlasting is one of the most recognisable of the Western Australian everlasting daisies, producing papery pink to white flower heads with bright yellow centres on slender, often nodding stems. The papery bracts retain their colour after drying, making them popular in dried floral arrangements. After good winter rains, vast carpets of pink and white everlastings transform the sandy plains north of Perth into one of the world's great wildflower spectacles.",
    image_prompt: 'Soft watercolor botanical illustration of Pink Everlasting (Rhodanthe manglesii), papery pink to white daisy flower heads with yellow centres on slender stems, small grey-green leaves, delicate pink, white and yellow washes, natural field-guide style',
    image_alt: 'Soft watercolor illustration of Pink Everlasting with papery pink-to-white daisy flowers with yellow centres',
  },
  {
    id: 'thick-leaved-fan-flower',
    common_name: 'Fan Flower',
    scientific_name: 'Scaevola aemula',
    region: 'Eastern and southern Australia',
    bloom_season: 'Spring to summer (September–February)',
    color: 'Mauve to purple',
    habitat: 'Coastal heath, dunes, cliff faces',
    conservation_status: 'Least Concern',
    short_description: 'Fan-shaped mauve flowers with five petals spread in a half-circle along coastal cliffs and dunes.',
    description: "Fan Flower is named for its uniquely shaped flowers, in which all five petals are arranged in a fan or half-circle on one side — an adaptation to its specialist pollinator. It grows along coastal heath, dunes, and cliff faces around southern and eastern Australia, often spilling over rock faces and forming sprawling mats. The mauve to purple flowers are produced prolifically over a long season and the plant is now widely cultivated as a garden groundcover.",
    image_prompt: 'Soft watercolor botanical illustration of Fan Flower (Scaevola aemula), five-petalled fan-shaped mauve to purple flowers with all petals arranged in a half-circle, succulent dark green leaves, soft mauve and purple washes, natural field-guide style',
    image_alt: 'Soft watercolor illustration of Fan Flower with distinctive fan-shaped mauve flowers with five petals in a half circle',
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
  if (count !== FLOWERS.length) {
    console.error(`Expected ${FLOWERS.length}, got ${count}`)
    process.exit(1)
  }
  console.log(`✓ All ${FLOWERS.length} flowers seeded successfully.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
