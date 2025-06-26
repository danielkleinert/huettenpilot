import type { Hut } from '@/types'

export interface UrlState {
  groupSize: number
  hutIds: number[]
}

export function getStateFromUrl(): UrlState {
  const params = new URLSearchParams(window.location.search)
  
  const groupSize = parseInt(params.get('size') || '2', 10)
  const hutIdsParam = params.get('huts')
  const hutIds = hutIdsParam 
    ? hutIdsParam.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id))
    : []

  return {
    groupSize: Math.max(1, Math.min(50, groupSize)),
    hutIds
  }
}

export function updateUrlState(groupSize: number, selectedHuts: Hut[]) {
  const url = new URL(window.location.href)
  
  url.searchParams.set('size', groupSize.toString())
  
  if (selectedHuts.length > 0) {
    url.searchParams.set('huts', selectedHuts.map(hut => hut.hutId).join(','))
  } else {
    url.searchParams.delete('huts')
  }
  
  window.history.replaceState({}, '', url.toString())
}