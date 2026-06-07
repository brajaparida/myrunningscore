import racesRaw from './races.json'

// Build a name→results index once at startup
const index = new Map()

for (const row of racesRaw) {
  const key = row.name.trim().toLowerCase()
  if (!index.has(key)) index.set(key, [])
  index.get(key).push(row)
}

// Fuzzy search — returns top 10 matching runner names
export function searchRunners(query) {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase().trim()
  const results = []

  for (const [key, rows] of index) {
    if (key.includes(q)) {
      const raceCount = rows.length
      const bestSec   = Math.min(...rows.map(r => r.secs))
      const cities    = [...new Set(rows.map(r => r.city))].join(', ')
      const lastDate  = rows.map(r=>r.date).sort().at(-1)
      results.push({
        name:      rows[0].name,
        raceCount,
        bestSec,
        bestTime:  fmtTime(bestSec),
        cities,
        lastDate,
      })
    }
  }

  return results
    .sort((a,b) => b.raceCount - a.raceCount || a.bestSec - b.bestSec)
    .slice(0, 10)
}

// Get all results for a runner by name
export function getRunnerResults(name) {
  const key = name.trim().toLowerCase()
  // Try exact match first, then partial
  if (index.has(key)) return index.get(key)
  for (const [k, v] of index) {
    if (k === key) return v
  }
  // fallback: first partial match
  for (const [k, v] of index) {
    if (k.includes(key) || key.includes(k)) return v
  }
  return null
}

export function fmtTime(sec) {
  if (!sec) return '--:--'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${m}:${String(s).padStart(2,'0')}`
}

export function totalRunners() {
  return index.size
}
