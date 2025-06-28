#!/usr/bin/env tsx

import fs from 'fs/promises'

interface HutData {
  [key: string]: unknown
}

async function fetchHutInfo(): Promise<void> {
  const baseUrl = 'https://www.hut-reservation.org/api/v1/reservation/hutInfo/'
  const huts: HutData[] = []

  console.log('Starting to fetch hut information...')

  for (let hutId = 1; hutId <= 1000; hutId++) {
    const url = `${baseUrl}${hutId}`
    console.log(`Fetching hut ID: ${hutId}`)

    try {
      const headers = {
        'Accept': 'application/json',
      }

      const response = await fetch(url, { headers })

      if (response.ok) {
        const hutData = await response.json() as HutData
        huts.push(hutData)
        console.log(`✅ Successfully fetched hut ID: ${hutId}`)
      } else {
        console.log(`❌ Failed to fetch hut ID ${hutId}: ${response.status}`)
      }

    } catch (error) {
      console.log(`❌ Error fetching hut ID ${hutId}: ${error}`)
    }
  }

  console.log(`\nFetching complete. Total huts fetched: ${huts.length}`)

  await fs.writeFile('hut_data.json', JSON.stringify(huts, null, 2))
  console.log('Hut data has been written to hut_data.json')
}

fetchHutInfo().catch(console.error)