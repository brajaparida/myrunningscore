import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import racesData from '../data/races.json'
import { calculateScore } from '../scoring/calculator.js'

const ADMIN_PASSWORD = 'mrsadmin2025'

// Build runner profiles from raw race data
function buildRunners() {
  const map = new Map()
  for (const row of racesData) {
    const key = row.name.trim().toLowerCase()
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(row)
  }
  const runners = []
  for (const [, results] of map) {
    const { score, tier } = calculateScore(results)
    const bestSec  = Math.min(...results.map(r => r.secs))
    const cities   = [...new Set(results.map(r => r.city))]
    const races    = [...new Set(results.map(r => r.race))]
    const h = Math.floor(bestSec / 3600)
    const m = Math.floor((bestSec % 3600) / 60)
    const s = bestSec % 60
    const bestTime = h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
      : `${m}:${String(s).padStart(2,'0')}`
    runners.push({
      name:      results[0].name,
      ubib:      results[0].ubib || '—',
      score,
      tier,
      raceCount: results.length,
      bestTime,
      bestSec,
      cities:    cities.join(', '),
      races,
      gender:    results[0].gender || '—',
      ageGroup:  results[0].age_group || '—',
    })
  }
  return runners.sort((a, b) => b.score - a.score)
}

const TIER_STYLE = {
  Elite:    'bg-green-200 text-green-900',
  Strong:   'bg-green-100 text-green-800',
  Good:     'bg-yellow-100 text-yellow-800',
  Average:  'bg-orange-100 text-orange-800',
  Beginner: 'bg-red-100 text-red-800',
}

const TIER_COLOR = {
  Elite: '#16a34a', Strong: '#22c55e', Good: '#eab308',
  Average: '#f97316', Beginner: '#ef4444',
}

export default function Admin() {
  const navigate = useNavigate()
  const [authed,   setAuthed]   = useState(false)
  const [pwd,      setPwd]      = useState('')
  const [pwdError, setPwdError] = useState(false)
  const [search,   setSearch]   = useState('')
  const [cityF,    setCityF]    = useState('All')
  const [tierF,    setTierF]    = useState('All')
  const [raceF,    setRaceF]    = useState('All')
  const [sortBy,   setSortBy]   = useState('score')
  const [sortDir,  setSortDir]  = useState('desc')
  const [page,     setPage]     = useState(1)
  const PAGE_SIZE = 50

  const allRunners = useMemo(() => buildRunners(), [])
  const cities  = ['All', ...new Set(allRunners.flatMap(r => r.cities.split(', ')))]
  const tiers   = ['All', 'Elite', 'Strong', 'Good', 'Average', 'Beginner']
  const races   = ['All', ...new Set(allRunners.flatMap(r => r.races))]

  const filtered = useMemo(() => {
    let list = allRunners
    if (search)        list = list.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    if (cityF !== 'All') list = list.filter(r => r.cities.includes(cityF))
    if (tierF !== 'All') list = list.filter(r => r.tier === tierF)
    if (raceF !== 'All') list = list.filter(r => r.races.includes(raceF))
    return [...list].sort((a, b) => {
      let av = a[sortBy], bv = b[sortBy]
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [allRunners, search, cityF, tierF, raceF, sortBy, sortDir])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function toggleSort(col) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('desc') }
    setPage(1)
  }

  function exportCSV() {
    const headers = ['UBIB','Name','Score','Tier','Races','Best Time','Cities','Gender','Age Group']
    const rows = filtered.map(r =>
      [r.ubib, r.name, r.score, r.tier, r.raceCount, r.bestTime, r.cities, r.gender, r.ageGroup]
        .map(v => `"${v}"`).join(',')
    )
    const csv  = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'myrunningscore_runners.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  function handleLogin(e) {
    e.preventDefault()
    if (pwd === ADMIN_PASSWORD) { setAuthed(true); setPwdError(false) }
    else { setPwdError(true) }
  }

  // Tier distribution
  const tierDist = useMemo(() => {
    const d = {}
    for (const r of allRunners) d[r.tier] = (d[r.tier] || 0) + 1
    return d
  }, [allRunners])

  // ── LOGIN SCREEN ────────────────────────────────────────────────────────────
  if (!authed) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 w-full max-w-sm shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-sm">🏃</div>
          <div>
            <p className="font-bold text-slate-800 text-sm">MyRunning Score</p>
            <p className="text-xs text-slate-400">Admin Panel</p>
          </div>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password" value={pwd} onChange={e => setPwd(e.target.value)}
              placeholder="Enter admin password"
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {pwdError && <p className="text-xs text-red-500 mt-1">Incorrect password</p>}
          </div>
          <button type="submit"
            className="w-full bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold
                       hover:bg-blue-800 transition-colors">
            Login →
          </button>
        </form>
      </div>
    </div>
  )

  // ── ADMIN DASHBOARD ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-blue-700 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">🏃</div>
            <div>
              <p className="font-bold text-white text-sm">MyRunning Score — Admin</p>
              <p className="text-blue-200 text-xs">{allRunners.length} runners · {racesData.length} results</p>
            </div>
          </div>
          <button onClick={() => navigate('/')}
            className="text-xs text-blue-200 hover:text-white border border-blue-500
                       px-3 py-1.5 rounded-lg transition-colors">
            ← Back to site
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {tiers.slice(1).map(t => (
            <div key={t} className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl font-bold" style={{ color: TIER_COLOR[t] }}>
                {tierDist[t] || 0}
              </div>
              <div className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded-full inline-block ${TIER_STYLE[t]}`}>
                {t}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="🔍 Search runner name…"
              className="border border-slate-200 rounded-xl px-4 py-2 text-sm flex-1 min-w-48
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select value={cityF} onChange={e => { setCityF(e.target.value); setPage(1) }}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {cities.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={tierF} onChange={e => { setTierF(e.target.value); setPage(1) }}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {tiers.map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={raceF} onChange={e => { setRaceF(e.target.value); setPage(1) }}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-48 truncate">
              {races.map(r => <option key={r}>{r}</option>)}
            </select>
            <button onClick={exportCSV}
              className="bg-green-600 text-white text-sm px-4 py-2 rounded-xl font-semibold
                         hover:bg-green-700 transition-colors flex items-center gap-1">
              ⬇ Export CSV
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Showing {filtered.length} of {allRunners.length} runners
          </p>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {[
                    { label: '#',          col: null        },
                    { label: 'UBIB',       col: 'ubib'      },
                    { label: 'Name',       col: 'name'      },
                    { label: 'Score',      col: 'score'     },
                    { label: 'Tier',       col: 'tier'      },
                    { label: 'Races',      col: 'raceCount' },
                    { label: 'Best Time',  col: 'bestSec'   },
                    { label: 'Cities',     col: 'cities'    },
                    { label: 'Gender',     col: 'gender'    },
                    { label: 'Age Group',  col: 'ageGroup'  },
                    { label: 'Profile',    col: null        },
                  ].map((h, i) => (
                    <th key={i}
                      onClick={() => h.col && toggleSort(h.col)}
                      className={`px-4 py-3 text-left text-xs font-semibold text-slate-500
                                  uppercase tracking-wider whitespace-nowrap
                                  ${h.col ? 'cursor-pointer hover:text-slate-800' : ''}`}>
                      {h.label}
                      {sortBy === h.col && (sortDir === 'desc' ? ' ↓' : ' ↑')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageData.map((r, i) => (
                  <tr key={r.name} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {(page - 1) * PAGE_SIZE + i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-lg whitespace-nowrap">
                        {r.ubib}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                      {r.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-base font-bold" style={{ color: TIER_COLOR[r.tier] }}>
                        {r.score}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${TIER_STYLE[r.tier]}`}>
                        {r.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.raceCount}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{r.bestTime}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{r.cities}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{r.gender || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{r.ageGroup || '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/runner/${encodeURIComponent(r.name)}`)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold
                                   border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-50">
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Page {page} of {totalPages} · {filtered.length} runners
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="text-sm px-4 py-2 border border-slate-200 rounded-xl
                           hover:bg-slate-100 disabled:opacity-40 transition-colors">
                ← Prev
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                className="text-sm px-4 py-2 border border-slate-200 rounded-xl
                           hover:bg-slate-100 disabled:opacity-40 transition-colors">
                Next →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
