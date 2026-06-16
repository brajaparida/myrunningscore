// MyRunning Score — 7-KPI scoring engine (runs in browser, no server needed)
// Score range: 300–900

const TYPICAL = {
  full: { M: 14400, F: 16200 },
  half: { M: 7200,  F: 8100  },
  '10k':{ M: 3600,  F: 4200  },
  '5k': { M: 1800,  F: 2100  },
  '3k': { M: 1080,  F: 1260  },
}
const STANDARD = {
  full: { M: 7200,  F: 8400  },
  half: { M: 3600,  F: 4200  },
  '10k':{ M: 1680,  F: 1980  },
  '5k': { M: 780,   F: 930   },
  '3k': { M: 540,   F: 630   },
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// KPI 1 — Best finish time, age-graded (25%)
function scoreFinishTime(results) {
  if (!results.length) return 0
  const best = results.reduce((b, r) => {
    const g = r.gender === 'F' ? 'F' : 'M'
    const typ = TYPICAL[r.cat]?.[g]  || TYPICAL['10k'].M
    const std = STANDARD[r.cat]?.[g] || STANDARD['10k'].M
    const grade = clamp((typ - r.secs) / (typ - std), 0, 1)
    return grade > b ? grade : b
  }, 0)
  return Math.round(best * 100)
}

// KPI 2 — Total finishes (20%)
function scoreFinishes(n) {
  return clamp(Math.round((Math.log(Math.max(n,1)) / Math.log(20)) * 100), 5, 100)
}

// KPI 3 — Improvement trend (15%)
function scoreTrend(results) {
  const sorted = [...results].sort((a,b) => a.date.localeCompare(b.date))
  if (sorted.length < 2) return 50
  const mid   = Math.floor(sorted.length / 2)
  const early = sorted.slice(0, mid).reduce((s,r) => s + r.secs, 0) / mid
  const late  = sorted.slice(mid).reduce((s,r) => s + r.secs, 0) / (sorted.length - mid)
  return clamp(Math.round(50 + ((early - late) / early) * 500), 0, 100)
}

// KPI 4 — Consistency races/year (15%)
function scoreConsistency(results) {
  if (!results.length) return 0
  const years = results.map(r => new Date(r.date).getFullYear())
  const span  = Math.max(1, Math.max(...years) - Math.min(...years) + 1)
  const rpy   = results.length / span
  return clamp(Math.round((rpy / 4) * 100), 5, 100)
}

// KPI 5 — Personal best (10%)
function scorePB(results) {
  if (!results.length) return 30
  const best = Math.min(...results.map(r => r.secs))
  const g    = results.find(r=>r.gender==='F') ? 'F' : 'M'
  const typ  = TYPICAL['10k'][g]
  const std  = STANDARD['10k'][g]
  return clamp(Math.round(((typ - best) / (typ - std)) * 100), 0, 100)
}

// KPI 6 — Race variety (10%)
function scoreVariety(results) {
  const cats   = new Set(results.map(r => r.cat)).size
  const cities = new Set(results.map(r => r.city)).size
  return clamp((cats - 1) * 20 + (cities - 1) * 15, 0, 100)
}

// KPI 7 — Active streak years (5%)
function scoreStreak(results) {
  if (!results.length) return 0
  const years = [...new Set(results.map(r => new Date(r.date).getFullYear()))].sort()
  let streak = 1, max = 1
  for (let i = 1; i < years.length; i++) {
    streak = years[i] === years[i-1]+1 ? streak+1 : 1
    max = Math.max(max, streak)
  }
  return clamp(Math.round((max / 6) * 100), 5, 100)
}

function getTier(score) {
  if (score >= 850) return 'Legend'
  if (score >= 700) return 'Elite'
  if (score >= 550) return 'Champion'
  if (score >= 400) return 'Achiever'
  return 'Runner'
}

export function calculateScore(results) {
  if (!results?.length) return { score: 300, tier: 'Runner', breakdown: {}, percentile: 1 }

  const kpis = {
    finishTime:  { score: scoreFinishTime(results),   weight: 0.25, label: 'Finish time'     },
    totalRaces:  { score: scoreFinishes(results.length), weight: 0.20, label: 'Total finishes' },
    trend:       { score: scoreTrend(results),         weight: 0.15, label: 'Improvement'     },
    consistency: { score: scoreConsistency(results),   weight: 0.15, label: 'Consistency'     },
    pb:          { score: scorePB(results),            weight: 0.10, label: 'Personal best'   },
    variety:     { score: scoreVariety(results),       weight: 0.10, label: 'Race variety'    },
    streak:      { score: scoreStreak(results),        weight: 0.05, label: 'Active streak'   },
  }

  const weighted = Object.values(kpis).reduce((s,k) => s + k.score * k.weight, 0)
  const score    = Math.round(300 + weighted * 6)
  const tier     = getTier(score)
  const pct      = clamp(Math.round(((score - 300) / 600) * 95 + 1), 1, 99)

  return { score, tier, breakdown: kpis, percentile: pct }
}
