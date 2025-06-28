#!/usr/bin/env tsx

import fs from 'fs/promises'

interface HutData {
  hutId: number
  hutName: string
  [key: string]: unknown
}

interface HutId {
  hutId: number
  hutName: string
}

async function extractHutIds(): Promise<void> {
  try {
    console.log('📖 Reading hut_data.json...')
    
    const hutDataRaw = await fs.readFile('hut_data.json', 'utf-8')
    const hutData: HutData[] = JSON.parse(hutDataRaw)

    console.log(`🔍 Found ${hutData.length} huts in source data`)

    const hutIds: HutId[] = hutData.map(hut => ({
      hutId: hut.hutId,
      hutName: hut.hutName
    }))

    console.log('💾 Writing to src/hut_ids.json...')
    
    await fs.writeFile('src/hut_ids.json', JSON.stringify(hutIds, null, 2))
    
    console.log(`✅ Extracted ${hutIds.length} hut IDs and names to src/hut_ids.json`)

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

extractHutIds()