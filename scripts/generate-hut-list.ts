#!/usr/bin/env tsx

import fs from 'fs/promises'

interface HutData {
  hutId: number
  hutName: string
  [key: string]: unknown
}

interface OSMHut {
  id: number
  type: 'node' | 'way' | 'relation'
  lat: number
  lon: number
  name: string
  nameLocal?: string
  nameEn?: string
  nameDe?: string
  nameFr?: string
  nameIt?: string
  elevation?: number
  capacity?: number
  operator?: string
  website?: string
  phone?: string
  country?: string
  region?: string
  tags: Record<string, string>
}

interface HutCoordinates {
  hutId: number
  hutName: string
  coordinates: [number, number] | null
}

// Normalize text for better matching
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ü/g, 'ue')
    .replace(/ö/g, 'oe')
    .replace(/ä/g, 'ae')
    .replace(/ß/g, 'ss')
    .replace(/[àáâãä]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')
    .trim()
}

// Generate variations of a hut name for matching
function generateNameVariations(hutName: string): string[] {
  const variations = new Set<string>()
  
  // Original name
  variations.add(hutName)
  variations.add(normalizeText(hutName))
  
  // Remove club suffixes
  const withoutClub = hutName.replace(/\s+(SAC|CAS|ÖAV|DAV|AACZ|AACB)$/i, '').trim()
  variations.add(withoutClub)
  variations.add(normalizeText(withoutClub))
  
  // Handle different spellings of "Hütte"
  variations.add(hutName.replace(/Hütte/g, 'hütte'))
  variations.add(hutName.replace(/hütte/g, 'Hütte'))
  variations.add(hutName.replace(/Hütte/g, 'Huette'))
  variations.add(hutName.replace(/hütte/g, 'huette'))
  
  // Handle hyphenation
  variations.add(hutName.replace(/(\w+)hütte/g, '$1-Hütte'))
  variations.add(hutName.replace(/(\w+)-Hütte/g, '$1hütte'))
  
  // Handle Italian/French variations
  if (hutName.includes('Capanna')) {
    variations.add(hutName.replace(/Capanna\s*/g, ''))
    variations.add(hutName.replace(/Capanna/g, 'Rifugio'))
  }
  
  if (hutName.includes('Cabane')) {
    variations.add(hutName.replace(/Cabane\s*/g, ''))
    variations.add(hutName.replace(/Cabane/g, 'Refuge'))
  }
  
  // Handle apostrophes and articles
  variations.add(hutName.replace(/\s*da\s*l'/g, ' dell'))
  variations.add(hutName.replace(/\s*de\s*/g, ' '))
  variations.add(hutName.replace(/\s*des\s*/g, ' '))
  variations.add(hutName.replace(/\s*du\s*/g, ' '))
  
  // Just the main name (first significant word)
  const words = hutName.split(' ').filter(w => w.length > 2)
  if (words.length > 0) {
    variations.add(words[0])
    variations.add(normalizeText(words[0]))
  }
  
  // Remove empty variations and convert to array
  return Array.from(variations).filter(v => v.length > 2)
}

// Calculate similarity between two strings (Levenshtein distance based)
function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeText(str1)
  const norm2 = normalizeText(str2)
  
  // Exact match
  if (norm1 === norm2) return 1.0
  
  // Contains match
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return 0.9
  }
  
  // Levenshtein distance
  const matrix = Array(norm2.length + 1).fill(null).map(() => Array(norm1.length + 1).fill(null))
  
  for (let i = 0; i <= norm1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= norm2.length; j++) matrix[j][0] = j
  
  for (let j = 1; j <= norm2.length; j++) {
    for (let i = 1; i <= norm1.length; i++) {
      const substitutionCost = norm1[i - 1] === norm2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      )
    }
  }
  
  const maxLength = Math.max(norm1.length, norm2.length)
  return maxLength === 0 ? 1 : (maxLength - matrix[norm2.length][norm1.length]) / maxLength
}

// Find best OSM match for a hut name
function findBestMatch(hutName: string, osmHuts: OSMHut[]): { hut: OSMHut; confidence: number; matchType: string } | null {
  const variations = generateNameVariations(hutName)
  let bestMatch: OSMHut | null = null
  let bestConfidence = 0
  let bestMatchType = ''
  
  for (const osmHut of osmHuts) {
    // Get all name fields from OSM hut
    const osmNames = [
      osmHut.name,
      osmHut.nameLocal,
      osmHut.nameEn,
      osmHut.nameDe,
      osmHut.nameFr,
      osmHut.nameIt
    ].filter(Boolean) as string[]
    
    for (const variation of variations) {
      for (const osmName of osmNames) {
        const similarity = calculateSimilarity(variation, osmName)
        
        if (similarity > bestConfidence) {
          bestConfidence = similarity
          bestMatch = osmHut
          bestMatchType = similarity === 1.0 ? 'exact' : 'contains'
        }
      }
    }
  }
  
  // Only return exact and contains matches (no fuzzy/similar matches)
  if (bestMatch && bestConfidence >= 0.9) {
    return { hut: bestMatch, confidence: bestConfidence, matchType: bestMatchType }
  }
  
  return null
}

async function matchHutsWithOSM(): Promise<void> {
  try {
    console.log('🔗 MATCHING HUTS WITH LOCAL OSM DATABASE')
    console.log('========================================')
    
    console.log('📖 Loading hut_reservation_info.json...')
    const hutDataRaw = await fs.readFile('hut_reservation_info.json', 'utf-8')
    const hutData: HutData[] = JSON.parse(hutDataRaw)
    
    console.log('📖 Loading osm_alpine_huts.json...')
    const osmHutsRaw = await fs.readFile('osm_alpine_huts.json', 'utf-8')
    const osmHuts: OSMHut[] = JSON.parse(osmHutsRaw)
    
    console.log(`🔍 Matching ${hutData.length} huts against ${osmHuts.length} OSM entries...`)
    console.log('🧠 Using intelligent fuzzy matching...\n')
    
    const results: HutCoordinates[] = []
    const matchStats = {
      exact: 0,
      contains: 0,
      notFound: 0
    }
    
    for (let i = 0; i < hutData.length; i++) {
      const hut = hutData[i]
      const progress = `[${i + 1}/${hutData.length}]`
      
      console.log(`${progress} ${hut.hutName}`)
      
      const match = findBestMatch(hut.hutName, osmHuts)
      
      if (match) {
        matchStats[match.matchType as keyof typeof matchStats]++
        
        results.push({
          hutId: hut.hutId,
          hutName: hut.hutName,
          coordinates: [match.hut.lat, match.hut.lon]
        })
        
        console.log(`  ✅ ${match.matchType} match (${(match.confidence * 100).toFixed(1)}%): ${match.hut.name}`)
        if (match.hut.elevation) {
          console.log(`     📍 [${match.hut.lat.toFixed(6)}, ${match.hut.lon.toFixed(6)}] @ ${match.hut.elevation}m`)
        } else {
          console.log(`     📍 [${match.hut.lat.toFixed(6)}, ${match.hut.lon.toFixed(6)}]`)
        }
      } else {
        matchStats.notFound++
        
        results.push({
          hutId: hut.hutId,
          hutName: hut.hutName,
          coordinates: null
        })
        
        console.log(`  ❌ No match found`)
      }
      
      console.log('')
    }
    
    const totalMatched = matchStats.exact + matchStats.contains
    
    console.log('📊 MATCHING RESULTS')
    console.log('==================')
    console.log(`Total huts: ${hutData.length}`)
    console.log(`Matched: ${totalMatched} (${((totalMatched / hutData.length) * 100).toFixed(1)}%)`)
    console.log(`  • Exact matches: ${matchStats.exact}`)
    console.log(`  • Contains matches: ${matchStats.contains}`)
    console.log(`Not found: ${matchStats.notFound} (${((matchStats.notFound / hutData.length) * 100).toFixed(1)}%)`)
    console.log('')
    
    console.log('💾 Writing to src/hut_ids.json...')
    await fs.writeFile('src/hut_ids.json', JSON.stringify(results, null, 2))
    
    console.log('✅ SUCCESS!')
    console.log(`🎯 Generated ${totalMatched} accurate coordinates from OSM!`)
    console.log('🗺️ Ready for precise mapping!')
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

matchHutsWithOSM()