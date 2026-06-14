export interface Flower {
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
  image_url: string
  image_alt: string
}

export interface FlowersApiResponse {
  flowers: Flower[]
}
