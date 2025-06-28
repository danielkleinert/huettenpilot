#!/usr/bin/env tsx

import fs from 'fs/promises'

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

async function fetchAllAlpineHuts(): Promise<void> {
  try {
    console.log('🏔️ FETCHING ALL ALPINE HUTS FROM OPENSTREETMAP')
    console.log('===============================================')
    console.log('This will download all tourism=alpine_hut entries from OSM...\n')

    // Query to get all alpine huts in Alpine region (rough bounding box)
    // Covers Switzerland, Austria, parts of France, Italy, Germany
    const query = `[out:json][timeout:120];
      (
        node[tourism=alpine_hut](45.0,5.0,48.5,17.0);
        way[tourism=alpine_hut](45.0,5.0,48.5,17.0);
        relation[tourism=alpine_hut](45.0,5.0,48.5,17.0);
      );
      out geom;`

    console.log('📡 Sending query to Overpass API...')
    console.log('Query bounding box: Alpine region (45.0,5.0,48.5,17.0)')
    console.log('⏱️ This may take 1-2 minutes...\n')

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(180000) // 3 minute timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.elements) {
      throw new Error('No elements found in OSM response')
    }

    console.log(`📊 Found ${data.elements.length} Alpine hut entries in OSM`)
    console.log('🔄 Processing and cleaning data...\n')

    const processedHuts: OSMHut[] = []
    let skipped = 0

    for (const element of data.elements) {
      try {
        let lat: number, lon: number

        // Extract coordinates based on element type
        if (element.lat && element.lon) {
          // Node
          lat = element.lat
          lon = element.lon
        } else if (element.center) {
          // Way/relation with center
          lat = element.center.lat
          lon = element.center.lon
        } else if (element.geometry && element.geometry.length > 0) {
          // Calculate centroid for ways/relations
          const centroid = element.geometry.reduce((acc: { lat: number; lon: number }, point: { lat: number; lon: number }) => ({
            lat: acc.lat + point.lat,
            lon: acc.lon + point.lon
          }), { lat: 0, lon: 0 })
          lat = centroid.lat / element.geometry.length
          lon = centroid.lon / element.geometry.length
        } else {
          skipped++
          continue
        }

        const tags = element.tags || {}
        const name = tags.name || tags['name:de'] || tags['name:en'] || tags['name:local']

        if (!name) {
          skipped++
          continue // Skip huts without names
        }

        const hut: OSMHut = {
          id: element.id,
          type: element.type,
          lat,
          lon,
          name,
          nameLocal: tags['name:local'],
          nameEn: tags['name:en'],
          nameDe: tags['name:de'],
          nameFr: tags['name:fr'],
          nameIt: tags['name:it'],
          elevation: tags.ele ? parseInt(tags.ele) : undefined,
          capacity: tags.capacity ? parseInt(tags.capacity) : undefined,
          operator: tags.operator,
          website: tags.website || tags['contact:website'],
          phone: tags.phone || tags['contact:phone'],
          country: tags['addr:country'],
          region: tags['addr:state'] || tags['addr:region'],
          tags
        }

        processedHuts.push(hut)

      } catch (error) {
        skipped++
        console.log(`  ⚠️ Skipped element ${element.id}: ${error.message}`)
      }
    }

    console.log(`✅ Processed ${processedHuts.length} valid Alpine huts`)
    console.log(`⚠️ Skipped ${skipped} entries (no coordinates or name)`)
    console.log('')

    // Sort by country and name for easier browsing
    processedHuts.sort((a, b) => {
      const countryA = a.country || 'ZZ'
      const countryB = b.country || 'ZZ'
      if (countryA !== countryB) {
        return countryA.localeCompare(countryB)
      }
      return a.name.localeCompare(b.name)
    })

    // Statistics
    const countries = new Map<string, number>()
    const withElevation = processedHuts.filter(h => h.elevation).length
    const withCapacity = processedHuts.filter(h => h.capacity).length
    const withWebsite = processedHuts.filter(h => h.website).length

    processedHuts.forEach(hut => {
      const country = hut.country || 'Unknown'
      countries.set(country, (countries.get(country) || 0) + 1)
    })

    console.log('📈 STATISTICS')
    console.log('=============')
    console.log(`Total huts: ${processedHuts.length}`)
    console.log(`With elevation data: ${withElevation} (${((withElevation/processedHuts.length)*100).toFixed(1)}%)`)
    console.log(`With capacity data: ${withCapacity} (${((withCapacity/processedHuts.length)*100).toFixed(1)}%)`)
    console.log(`With website: ${withWebsite} (${((withWebsite/processedHuts.length)*100).toFixed(1)}%)`)
    console.log('')

    console.log('🌍 BY COUNTRY:')
    for (const [country, count] of Array.from(countries.entries()).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${country}: ${count} huts`)
    }
    console.log('')

    console.log('💾 Saving to osm_alpine_huts.json...')
    await fs.writeFile('osm_alpine_huts.json', JSON.stringify(processedHuts, null, 2))

    console.log('✅ SUCCESS!')
    console.log(`📁 Saved ${processedHuts.length} Alpine huts to osm_alpine_huts.json`)
    console.log('🎯 Ready for intelligent name matching!')

  } catch (error) {
    console.error('❌ Error fetching Alpine huts:', error)
    process.exit(1)
  }
}

fetchAllAlpineHuts()