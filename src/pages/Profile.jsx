import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { getRunnerResults, fmtTime } from '../data/useData.js'
import { calculateScore } from '../scoring/calculator.js'

const TIER_COLOR = { 
  Legend:   'text-purple-700 bg-purple-100', 
  Elite:    'text-green-700 bg-green-100',
  Champion: 'text-green-600 bg-green-50', 
  Achiever: 'text-yellow-700 bg-yellow-100', 
  Runner:   'text-slate-600 bg-slate-100' 
}
const CLAIM_FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSfcCUtkzQ54lL5sRVuPR8BKTvKjgw2A0x_jGjPPisDk_2jd9w/viewform'
const TIER_EMOJI = { 
  Legend:   '👑', 
  Elite:    '🟢', 
  Champion: '🟡', 
  Achiever: '🟠', 
  Runner:   '🔴' 
}

function ScoreGauge({ score }) {
  const pct = (score - 300) / 600
  const C   = 2 * Math.PI * 40
  const arc = pct * C * 0.75
  const color = score >= 700 ? '#16a34a' : score >= 550 ? '#d97706' : '#dc2626'
  return (
    <svg width="110" height="110" viewBox="0 0 100 100" className="flex-shrink-0">
      <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="10"/>
      <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${arc} ${C-arc}`} strokeLinecap="round"
        transform="rotate(-210 50 50)"/>
      <text x="50" y="44" textAnchor="middle" fontSize="20" fontWeight="700"
        fill="#1e293b" dominantBaseline="central">{score}</text>
      <text x="50" y="62" textAnchor="middle" fontSize="9" fill="#94a3b8"
        dominantBaseline="central">out of 900</text>
    </svg>
  )
}

function Bar({ label, score, color }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width:`${score}%`, background: color }}/>
      </div>
      <span className="text-xs font-semibold text-slate-700 w-7 text-right">{score}</span>
    </div>
  )
}

// ── Canvas helpers ────────────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.arcTo(x+w,y,x+w,y+r,r)
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r)
  ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r)
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r)
  ctx.closePath()
}
function truncate(str, max) { return str.length > max ? str.slice(0, max) + '…' : str }

// ── Draw score card on canvas ─────────────────────────────────────────────────
function drawScoreCard({ name, score, tier, ubib, raceCount, cities, sinceYear }) {
  const canvas = document.createElement('canvas')
  canvas.width = 800; canvas.height = 440
  const ctx = canvas.getContext('2d')

  // Background
  const grad = ctx.createLinearGradient(0, 0, 800, 440)
  grad.addColorStop(0, '#1a56db'); grad.addColorStop(1, '#0d3a9e')
  ctx.fillStyle = grad
  roundRect(ctx, 0, 0, 800, 440, 32); ctx.fill()

  // Decorative circles
  ctx.save(); ctx.globalAlpha = 0.06; ctx.fillStyle = '#ffffff'
  ctx.beginPath(); ctx.arc(700, -40, 200, 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.arc(-40, 480, 250, 0, Math.PI*2); ctx.fill()
  ctx.restore()

  // Brand
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = 'bold 20px Arial'
  ctx.fillText('MYRUNNING SCORE', 48, 58)

  // Name
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 50px Arial'
  ctx.fillText(truncate(name, 22), 48, 126)

  // UBIB
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '20px Arial'
  ctx.fillText(ubib ? `${ubib}  ·  Since ${sinceYear}` : `Since ${sinceYear}`, 50, 162)

  // Score
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 128px Arial'
  ctx.fillText(String(score), 48, 306)

  // Tier pill background
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  roundRect(ctx, 48, 322, 260, 44, 22); ctx.fill()

  // Tier text
  const tierColors = { 
    Legend:   '#a855f7', 
    Elite:    '#22c55e', 
    Champion: '#eab308', 
    Achiever: '#f97316', 
    Runner:   '#ef4444' 
  }
  ctx.fillStyle = tierColors[tier] || '#22c55e'
  ctx.font = 'bold 20px Arial'
  ctx.fillText(`${TIER_EMOJI[tier] || '🏃'}  ${tier}`, 70, 350)

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(460, 180); ctx.lineTo(460, 395); ctx.stroke()

  // Stats
  const stats = [
    { label: 'RACES',  value: String(raceCount) },
    { label: 'CITIES', value: String(cities)     },
    { label: 'SINCE',  value: String(sinceYear)  },
  ]
  stats.forEach((s, i) => {
    const x = 510, y = 205 + i * 70
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.font = 'bold 13px Arial'
    ctx.fillText(s.label, x, y)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 36px Arial'
    ctx.fillText(s.value, x, y + 42)
  })

  // Tier bar
  const barX = 48, barY = 388, barW = 704, barH = 10
  const segs = ['#ef4444','#f97316','#facc15','#22c55e','#16a34a']
  const segW = barW / segs.length
  segs.forEach((c, i) => {
    ctx.fillStyle = c
    ctx.fillRect(barX + i * segW, barY, segW, barH)
  })

  // Marker
  const pct = Math.min(Math.max((score - 300) / 600, 0), 1)
  ctx.fillStyle = '#ffffff'
  ctx.beginPath(); ctx.arc(barX + pct * barW, barY + barH/2, 8, 0, Math.PI*2); ctx.fill()

  // URL
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '16px Arial'
  ctx.fillText('myrunningscore.in  🇮🇳', barX, barY + 36)

  return canvas
}

// ── Share handler ─────────────────────────────────────────────────────────────
async function handleShare({ name, score, tier, ubib, raceCount, cities, sinceYear }) {
  const canvas = drawScoreCard({ name, score, tier, ubib, raceCount, cities, sinceYear })
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'my-running-score.png', { type: 'image/png' })
      const text = `My Running Score is ${score} ${TIER_EMOJI[tier] || '🏃'} — ${tier}!\nWhat's yours? → myrunningscore.in 🇮🇳`

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'My Running Score', text })
          resolve(); return
        } catch (_) { /* user cancelled — fall through */ }
      }
      // Fallback: download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'my-running-score.png'; a.click()
      URL.revokeObjectURL(url)
      resolve()
    }, 'image/png')
  })
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Profile() {
  const { name }  = useParams()
  const navigate  = useNavigate()
  const [sharing, setSharing] = useState(false)
  const decoded   = decodeURIComponent(name)
  const results   = getRunnerResults(decoded)

  if (!results) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50">
      <p className="text-slate-500">Runner not found.</p>
      <button onClick={() => navigate('/')} className="text-blue-500 underline text-sm">← Back to search</button>
    </div>
  )

  const { score, tier, breakdown, percentile } = calculateScore(results)
  const sorted    = [...results].sort((a,b) => a.date.localeCompare(b.date))
  const bestRes   = results.reduce((b,r) => r.secs < b.secs ? r : b, results[0])
  const years     = [...new Set(results.map(r => new Date(r.date).getFullYear()))]
  const cities    = [...new Set(results.map(r => r.city))]
  const raceCount = results.length
  const rpy       = (raceCount / Math.max(years.length,1)).toFixed(1)
  const ubib      = results[0]?.ubib || null
  const sinceYear = Math.min(...years)

  let trendPct = null
  if (sorted.length >= 2) {
    const mid   = Math.floor(sorted.length/2)
    const early = sorted.slice(0,mid).reduce((s,r)=>s+r.secs,0)/mid
    const late  = sorted.slice(mid).reduce((s,r)=>s+r.secs,0)/(sorted.length-mid)
    trendPct    = Math.round(((early-late)/early)*100)
  }

  const catLabel = { full:'Full Marathon', half:'Half Marathon', '10k':'10K', '5k':'5K', '3k':'3K', other:'Race' }

  const onShare = async () => {
    setSharing(true)
    await handleShare({ name: decoded, score, tier, ubib, raceCount, cities: cities.length, sinceYear })
    setSharing(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-6">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">← Search</button>
          <span className="text-sm font-bold text-slate-700">🏃 MyRunning Score</span>
          <a href={CLAIM_FORM} target="_blank" rel="noreferrer"
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100 transition-colors">
            Claim profile
          </a>
        </div>

        <p className="text-xs text-slate-400 mb-4 flex items-center gap-1">
          <span>ℹ️</span> Public data — not yet claimed by runner
        </p>

        {/* Score hero */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-3 flex items-center gap-5 shadow-sm">
          <ScoreGauge score={score}/>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-800 truncate">{decoded}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{cities.join(' · ')} · Since {sinceYear}</p>
            {ubib && (
              <div className="mt-2 inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
                <span>🪪</span><span>{ubib}</span>
              </div>
            )}
            <div className="mt-2">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${TIER_COLOR[tier]}`}>
                🏅 {tier}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2">300 Runner · 400 Achiever · 550 Champion · 700 Elite · 850+ Legend</p>
          </div>
        </div>

        {/* Share button */}
        <button onClick={onShare} disabled={sharing}
          className="w-full mb-3 flex items-center justify-center gap-2
                     bg-blue-600 hover:bg-blue-700 active:scale-95
                     text-white font-bold text-sm rounded-2xl py-3.5
                     transition-all duration-150 shadow-md disabled:opacity-60">
          {sharing ? '⏳ Preparing...' : '📤 Share My Score'}
        </button>

        {/* KPI tiles */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label:'Finishes',     val: raceCount,                        sub:'races'        },
            { label:'Best time',    val: fmtTime(bestRes.secs),            sub: bestRes.race.split(' ')[0] },
            { label:'Active years', val: years.length,                     sub:`${sinceYear}–${Math.max(...years)}`},
            { label:'Races/year',   val: rpy,                              sub:'avg'          },
            { label:'Cities',       val: cities.length,                    sub: cities.join(', ')},
            { label:'Trend',
              val: trendPct !== null ? `${trendPct>=0?'↑':'↓'} ${Math.abs(trendPct)}%` : '—',
              sub: trendPct!==null ? (trendPct>=0?'improving':'slower') : 'not enough data',
              green: trendPct !== null && trendPct >= 0 },
          ].map(t => (
            <div key={t.label} className="bg-slate-100 rounded-xl p-3">
              <p className="text-xs text-slate-500">{t.label}</p>
              <p className={`text-lg font-bold mt-0.5 ${t.green ? 'text-green-600' : 'text-slate-800'}`}>{t.val}</p>
              <p className="text-xs text-slate-400 truncate">{t.sub}</p>
            </div>
          ))}
        </div>

        {/* Score breakdown */}
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Score breakdown</p>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-3 shadow-sm space-y-3">
          {Object.entries(breakdown).map(([k, kpi]) => (
            <Bar key={k} label={kpi.label} score={kpi.score}
              color={kpi.score >= 65 ? '#16a34a' : kpi.score >= 40 ? '#d97706' : '#dc2626'}/>
          ))}
        </div>

        {/* Percentile */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-3 shadow-sm">
          <p className="text-sm font-semibold text-slate-800 mb-3">Top {100 - percentile}% of runners in this dataset</p>
          <div className="relative h-4 rounded-full overflow-hidden"
            style={{ background:'linear-gradient(to right,#bfdbfe,#bbf7d0,#fde68a,#fca5a5)'}}>
            <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-800 border-2 border-white shadow transition-all duration-700"
              style={{ left:`calc(${percentile}% - 8px)` }}/>
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>Bottom</span><span>Median</span><span>Top 10%</span>
          </div>
        </div>

        {/* Race history */}
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Race history</p>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-6">
          {[...results].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6).map((r,i,arr) => (
            <div key={i} className={`flex items-center gap-3 px-5 py-3.5 ${i < arr.length-1 ? 'border-b border-slate-100' : ''}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${r.secs === bestRes.secs ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                {r.secs === bestRes.secs ? '🏆' : '🏃'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{r.race}</p>
                <p className="text-xs text-slate-400">{r.date} · {r.city} · {catLabel[r.cat] || r.cat}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-slate-800">{fmtTime(r.secs)}</p>
                {r.secs === bestRes.secs && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">PB</span>}
                {r.rank && r.secs !== bestRes.secs && <p className="text-xs text-slate-400">#{r.rank}</p>}
              </div>
            </div>
          ))}
          {results.length > 6 && (
            <div className="px-5 py-3 text-center text-xs text-slate-400">+{results.length - 6} more races</div>
          )}
        </div>

        {/* Claim CTA */}
        <div className="bg-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">Is this you? Claim your profile</p>
            <p className="text-slate-400 text-xs mt-1">Verify your data, unlock insights, and control your score</p>
          </div>
          <a href={CLAIM_FORM} target="_blank" rel="noreferrer"
            className="bg-blue-500 text-white text-sm rounded-xl px-4 py-2.5 font-semibold hover:bg-blue-600 transition-colors whitespace-nowrap">
            Claim →
          </a>
        </div>

      </div>
    </div>
  )
}
