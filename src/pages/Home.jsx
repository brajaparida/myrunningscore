import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchRunners, totalRunners } from '../data/useData.js'

const BIB_FORM = 'https://docs.google.com/forms/d/e/1FAIpQLScTxT_gG9vtjZCRNi3oPCg3erLbUkk3sGgmc1elc87l6qIhAg/viewform'

function ScoreGauge() {
  // Each segment uses strokeDasharray to create clean gaps between zones
  // Full arc circumference at r=110 is 2*PI*110 = 691. Half arc = 345.6
  // 5 equal zones = 345.6/5 = 69.1 each. Gap = 4px between segments
  const R = 110
  const cx = 140, cy = 140
  const total = Math.PI * R  // half circle arc length = 345.6
  const gap = 5
  const seg = (total - gap * 4) / 5  // each segment length

  // strokeDasharray: [seg, total] with strokeDashoffset to position each
  const segs = [
    { color: '#ef4444', offset: 0 },
    { color: '#f97316', offset: seg + gap },
    { color: '#eab308', offset: (seg + gap) * 2 },
    { color: '#22c55e', offset: (seg + gap) * 3 },
    { color: '#16a34a', offset: (seg + gap) * 4 },
  ]

  return (
    <svg width="280" height="158" viewBox="0 0 280 158" className="mx-auto">
      {/* Background track */}
      <path
        d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
        fill="none" stroke="#f1f5f9" strokeWidth="22" strokeLinecap="butt"
      />
      {/* Coloured segments using dasharray trick */}
      {segs.map((s, i) => (
        <path
          key={i}
          d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
          fill="none"
          stroke={s.color}
          strokeWidth="22"
          strokeLinecap="butt"
          strokeDasharray={`${seg} ${total}`}
          strokeDashoffset={-s.offset}
          transform={`rotate(180 ${cx} ${cy})`}
        />
      ))}
      {/* Needle — orange color */}
      <g transform={`translate(${cx},${cy})`}>
        <line x1="0" y1="0" x2="-52" y2="-76"
          stroke="#f97316" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="0" cy="0" r="8" fill="#f97316"/>
        <circle cx="0" cy="0" r="4" fill="white"/>
      </g>
      {/* Score text */}
      <text x={cx} y={cy - 22} textAnchor="middle" fontSize="28" fontWeight="600"
        fill="#1e293b" fontFamily="sans-serif">650</text>
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="10"
        fill="#94a3b8" fontFamily="sans-serif">Good Runner</text>
      {/* Scale numbers */}
      <text x="18"  y="152" textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="sans-serif">300</text>
      <text x="62"  y="50"  textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="sans-serif">420</text>
      <text x={cx}  y="18"  textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="sans-serif">550</text>
      <text x="218" y="50"  textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="sans-serif">700</text>
      <text x="262" y="152" textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="sans-serif">900</text>
    </svg>
  )
}

export default function Home() {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const navigate = useNavigate()
  const timer    = useRef(null)

  useEffect(() => {
    clearTimeout(timer.current)
    if (query.length < 2) { setResults([]); return }
    timer.current = setTimeout(() => setResults(searchRunners(query)), 200)
  }, [query])

  const showCantFind = query.length >= 2

  return (
    <div className="min-h-screen bg-white">

      {/* NAV */}
      <nav className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-700 rounded-lg flex items-center justify-center text-sm">🏃</div>
          <span className="font-bold text-slate-800 text-sm">MyRunning Score</span>
        </div>
        <span className="text-xs bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full">
          Free forever
        </span>
      </nav>

      {/* HERO */}
      <section className="bg-blue-700 px-4 pt-8 pb-6 text-center">
        <div className="max-w-lg mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-800 text-blue-200 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <span>🇮🇳</span> India's first running score · Inspired by CIBIL
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight mb-3">
            Your Running Score,<br/>in your hands.
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed mb-2 max-w-sm mx-auto">
            Every Indian marathon finisher has a score between 300 and 900 — based on verified race results, not self-reported data.
          </p>
          <p className="text-blue-300 text-xs mb-6">
            ✓ Searching your name is free and always will be.
          </p>
          <div className="relative max-w-md mx-auto">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search your name to find your score…"
              autoFocus
              className="w-full pl-11 pr-4 py-4 bg-white rounded-2xl text-slate-800
                         placeholder-slate-400 text-base shadow-lg border-0
                         focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <p className="text-blue-300 text-xs mt-3">
            Try: Abhishek · Komal · Arun · Ashok · Priya
          </p>
        </div>
      </section>

      <div className="max-w-lg mx-auto px-4">

        {/* SEARCH RESULTS */}
        {results.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-3 mb-4">
            {results.map((r, i) => (
              <button
                key={r.name}
                onClick={() => navigate(`/runner/${encodeURIComponent(r.name)}`)}
                className={`w-full text-left px-5 py-4 flex items-center justify-between
                            hover:bg-blue-50 transition-colors
                            ${i < results.length - 1 ? 'border-b border-slate-100' : ''}`}
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
          <p className="text-center text-slate-400 text-sm mt-4 mb-2">
            No runners found for "{query}"
          </p>
        )}

        {/* CAN'T FIND YOURSELF */}
        {showCantFind && (
          <div className="mb-8">
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-xs text-slate-400">Can't find yourself?</span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">➕</span>
                <p className="text-sm font-semibold text-slate-800">Add your race result</p>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Submit your BIB number and we'll add your result within 24 hours.
              </p>
              <div className="space-y-3 mb-4">
                {[
                  { n:'1', t: <span>Submit your <b className="text-slate-700">name, race & BIB number</b></span> },
                  { n:'2', t: <span>We <b className="text-slate-700">verify</b> from official race records</span> },
                  { n:'3', t: <span>Get an <b className="text-slate-700">email</b> — your score is ready</span> },
                ].map(s => (
                  <div key={s.n} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold
                                    flex items-center justify-center flex-shrink-0">{s.n}</div>
                    <p className="text-xs text-slate-500">{s.t}</p>
                  </div>
                ))}
              </div>
              <a href={BIB_FORM} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600
                           text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                Submit my BIB number →
              </a>
              <p className="text-center text-xs text-slate-400 mt-2">Usually processed within 24 hours</p>
            </div>
          </div>
        )}

        {/* REST OF PAGE — only show when not searching */}
        {!showCantFind && (
          <>
            {/* GAUGE */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 mt-5 mb-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-700 text-center mb-4">
                What does your running score look like?
              </p>
              <ScoreGauge />
              <div className="flex justify-between mt-2 px-1">
                {['Beginner','Average','Good','Strong','Elite'].map((t,i) => (
                  <span key={t} className="text-xs font-semibold"
                    style={{ color: ['#ef4444','#f97316','#eab308','#22c55e','#16a34a'][i] }}>
                    {t}
                  </span>
                ))}
              </div>
              {/* Sample runners */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                {[
                  { init:'AK', name:'Abhishek Kumar', meta:'Bengaluru · 10K', score:724, tier:'Strong', sc:'text-green-500', tc:'bg-green-100 text-green-800' },
                  { init:'KP', name:'Komal Patel',    meta:'Patna · 3K',      score:612, tier:'Good',   sc:'text-yellow-500', tc:'bg-yellow-100 text-yellow-800' },
                  { init:'AS', name:'Arun Singh',     meta:'Bengaluru · 21K', score:490, tier:'Average',sc:'text-orange-500', tc:'bg-orange-100 text-orange-800' },
                ].map(r => (
                  <div key={r.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center
                                    text-xs font-semibold text-slate-600 flex-shrink-0">{r.init}</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">{r.name}</p>
                      <p className="text-xs text-slate-400">{r.meta}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${r.sc}`}>{r.score}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.tc}`}>{r.tier}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { num:`${totalRunners().toLocaleString()}+`, label:'Runners scored' },
                { num:'3',       label:'Cities covered' },
                { num:'300–900', label:'Score range' },
              ].map(s => (
                <div key={s.label} className="bg-slate-50 rounded-2xl py-4 px-2 text-center">
                  <div className="text-lg font-bold text-blue-700">{s.num}</div>
                  <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* IDENTITY CARD */}
            <div className="border-2 border-blue-600 rounded-2xl p-6 mb-5 text-center">
              <div className="text-3xl mb-3">🏃</div>
              <p className="text-base font-semibold text-slate-800 leading-relaxed mb-4">
                "You trained for months. You crossed the finish line. You deserve more than just a medal."
              </p>
              <div className="border-t border-b border-slate-100 py-3 mb-4">
                <p className="text-sm text-slate-500 leading-relaxed">
                  Every race you finish is a vote for the runner you are becoming.<br/>
                  Your MyRunning Score keeps count.
                </p>
              </div>
              <p className="text-sm font-semibold text-blue-600">
                Know your score. Own your identity as a runner. →
              </p>
            </div>

            {/* HOW IT WORKS */}
            <p className="text-base font-bold text-slate-800 text-center mb-4">
              How your score is calculated
            </p>
            <div className="space-y-3 mb-5">
              {[
                { e:'🗂️', t:'Verified race data only',    d:'Finish times from official chip-timed Indian marathon results. No self-reporting, no guessing.' },
                { e:'📊', t:'7 performance KPIs',         d:'Finish time, consistency, improvement trend, personal bests, race variety, cities, and active streak.' },
                { e:'✅', t:'Claim and own your profile', d:"Verify it's you, accept consent, and get a Verified badge. Your score is officially yours." },
              ].map(s => (
                <div key={s.t} className="flex items-start gap-4 bg-white border border-slate-100 rounded-2xl p-4">
                  <span className="text-2xl flex-shrink-0">{s.e}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 mb-1">{s.t}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* KPI GRID */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { icon:'⏱️', name:'Finish time',   w:'Age-graded · 25%' },
                { icon:'🏆', name:'Total finishes', w:'Race count · 20%' },
                { icon:'📈', name:'Improvement',    w:'Trend · 15%'      },
                { icon:'📅', name:'Consistency',    w:'Races/year · 15%' },
              ].map(k => (
                <div key={k.name} className="bg-slate-50 rounded-xl p-3">
                  <div className="text-lg mb-1">{k.icon}</div>
                  <div className="text-sm font-semibold text-slate-700">{k.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{k.w}</div>
                </div>
              ))}
            </div>

            {/* DATA SOURCES */}
            <div className="text-center mb-5">
              <p className="text-xs text-slate-400 mb-2">Data from verified public race results</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['APYK Marathon Patna','Bangalore Marathon Festival','Mile Runners Bangalore'].map(r => (
                  <span key={r} className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{r}</span>
                ))}
              </div>
            </div>

            {/* FINAL CTA */}
            <div className="bg-blue-700 rounded-2xl p-6 text-center mb-6">
              <p className="text-lg font-bold text-white mb-2">Find your running score today</p>
              <p className="text-sm text-blue-200 mb-5 leading-relaxed">
                Search your name above. If you don't find yourself, submit your BIB number and we'll add you within 24 hours.
              </p>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="inline-flex items-center gap-2 bg-white text-blue-700 text-sm
                           font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors">
                🔍 Search my name
              </button>
            </div>
          </>
        )}
      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-100 py-5 text-center">
        <p className="text-xs text-slate-400">© 2025 MyRunning Score · Public race data · India</p>
        <p className="text-xs text-slate-300 mt-1">Not affiliated with CIBIL or TransUnion</p>
      </footer>
    </div>
  )
}
