import { describe, it, expect, beforeEach } from 'vitest'
import type { Flower } from '../../src/types/flower'

const FLOWER_FIELDS: (keyof Flower)[] = [
  'id', 'common_name', 'scientific_name', 'region', 'bloom_season',
  'color', 'habitat', 'conservation_status', 'short_description',
  'description', 'image_url', 'image_alt',
]

function makeFlower(overrides: Partial<Flower> = {}): Flower {
  return {
    id: 'golden-wattle',
    common_name: 'Golden Wattle',
    scientific_name: 'Acacia pycnantha',
    region: 'South-eastern Australia',
    bloom_season: 'Spring',
    color: 'Yellow',
    habitat: 'Woodland',
    conservation_status: 'Least Concern',
    short_description: 'A golden beauty',
    description: 'Full description here',
    image_url: 'https://example.com/img.png',
    image_alt: 'Golden Wattle photo',
    ...overrides,
  }
}

describe('Flower type contract', () => {
  it('has all required fields', () => {
    const flower = makeFlower()
    for (const field of FLOWER_FIELDS) {
      expect(flower[field]).toBeDefined()
      expect(typeof flower[field]).toBe('string')
    }
  })

  it('accepts all 8 seed flower ids', () => {
    const seedIds = [
      'golden-wattle', 'sturts-desert-pea', 'waratah', 'kangaroo-paw',
      'flannel-flower', 'royal-bluebell', 'pink-mulla-mulla', 'banksia',
    ]
    for (const id of seedIds) {
      const f = makeFlower({ id })
      expect(f.id).toBe(id)
    }
  })
})
