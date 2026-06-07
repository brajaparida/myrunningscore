import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchRunners, totalRunners } from '../data/useData.js'

export default function Home() {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const navigate = useNavigate()
  const timer = useRef(null)

  useEffect(() => {
    clearTimeout(timer.current)
    if (query.length < 2) { setResults([]); return }
    timer.current = setTimeout(() => {
      setResults(searchRunners(query))
    }, 200)
  }, [query])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">

      {/* Header */}
      <header className="pt-14 pb-6 px-4 text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <span className="text-3xl">🏃</span>
          <span className="text-2xl font-bold text-slate-800 tracking-tight">MyRunning Score</span>
        </div>
        <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
          India's first running score — inspired by CIBIL.<br/>
          Know where you stand among Indian runners.
        </p>
      </header>

      {/* Search */}
      <main className="flex-1 px-4 max-w-lg mx-auto w-full">
        <div className="relative mb-2">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by runner name…"
            autoFocus
            className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl
                       text-slate-800 placeholder-slate-400 shadow-sm text-base
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {results.map((r, i) => (
              <button
                key={r.name}
                onClick={() => navigate(`/runner/${encodeURIComponent(r.name)}`)}
                className={`w-full text-left px-5 py-4 flex items-center justify-between
                            hover:bg-blue-50 transition-colors
                            ${i < results.length-1 ? 'border-b border-slate-100' : ''}`}
              >
                <div>
                  <p className="font-semibold text-slate-800">{r.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {r.raceCount} {r.raceCount === 1 ? 'race' : 'races'} &nbsp;·&nbsp;
                    Best {r.bestTime} &nbsp;·&nbsp; {r.cities}
                  </p>
                </div>
                <span className="text-slate-300 text-xl">›</span>
              </button>
            ))}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && (
          <p className="text-center text-slate-400 text-sm mt-6">
            No runners found. Try a different name.
          </p>
        )}

        {/* Stats footer */}
        <div className="mt-10 text-center space-y-1">
          <p className="text-xs text-slate-400">
            {totalRunners().toLocaleString()} runners · 3 races · Patna · Bengaluru
          </p>
          <p className="text-xs text-slate-300">
            Data: APYK Marathon Patna · Bangalore Marathon Festival · Mile Runners Bangalore
          </p>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-slate-300">
        © 2025 MyRunning Score · Public race data
      </footer>
    </div>
  )
}
