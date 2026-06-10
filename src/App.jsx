import { useEffect, useMemo, useRef, useState } from 'react'

const FALLBACK = {
  blockHeight: 899420,
  mempoolCount: 19243,
  mempoolVsize: 14800000,
  hashRate: 852e18,
  difficulty: 126.98e12,
  price: 104250,
  lightningCapacity: 5180,
  lightningChannels: 49100,
}

const chapters = ['Genesis', 'Network', 'Proof', 'Halving', 'Mempool', 'Lightning', 'History', 'Keys', '21 Million']
const fmt = new Intl.NumberFormat('en-US')
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function useMetrics() {
  const [data, setData] = useState(FALLBACK)
  useEffect(() => {
    let active = true
    const refresh = () => fetch('/api/metrics').then((r) => r.json()).then((next) => active && setData(next)).catch(() => {})
    refresh()
    const timer = setInterval(refresh, 60_000)
    return () => { active = false; clearInterval(timer) }
  }, [])
  return data
}

function useScrollState() {
  const [state, setState] = useState({ progress: 0, section: 0 })
  useEffect(() => {
    let frame
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight
      const progress = max ? scrollY / max : 0
      const points = [...document.querySelectorAll('.chapter')]
      let section = 0
      points.forEach((node, index) => { if (node.getBoundingClientRect().top < innerHeight * .55) section = index })
      setState({ progress, section })
    }
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update) }
    update(); addEventListener('scroll', onScroll, { passive: true })
    return () => { removeEventListener('scroll', onScroll); cancelAnimationFrame(frame) }
  }, [])
  return state
}

function useSectionVisibility() {
  useEffect(() => {
    const nodes = [...document.querySelectorAll(".chapter")]
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle("is-visible", entry.isIntersecting))
    }, { rootMargin: "-8% 0px -8%", threshold: .08 })
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])
}

function BitcoinMark({ small = false }) {
  return <span className={`bitcoin-mark ${small ? "small" : ""}`} aria-hidden="true" data-symbol="₿"><i>₿</i></span>
}

function Metric({ label, value, sub }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong>{sub && <small>{sub}</small>}</div>
}

function ChapterHead({ index, eyebrow, title, copy, align = 'left' }) {
  return <div className={`chapter-head ${align}`}>
    <span className="chapter-number">0{index}</span>
    <p className="eyebrow">{eyebrow}</p>
    <h2>{title}</h2>
    {copy && <p className="chapter-copy">{copy}</p>}
  </div>
}

function AmbientCanvas({ mode, intensity = 1, signal = 0 }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    let width, height, raf, time = 0, active = false, last = 0
    const pointer = { x: .5, y: .5 }
    const seed = Array.from({ length: mode === 'mempool' ? 110 : 70 }, (_, i) => ({
      x: (Math.sin(i * 999) + 1) / 2,
      y: (Math.sin(i * 743 + 2) + 1) / 2,
      z: (Math.sin(i * 327 + 4) + 1) / 2,
      r: 1 + ((i * 17) % 5),
      speed: .2 + ((i * 13) % 10) / 10,
    }))
    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 2)
      width = canvas.clientWidth; height = canvas.clientHeight
      canvas.width = width * dpr; canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const move = (e) => { pointer.x = e.clientX / innerWidth; pointer.y = e.clientY / innerHeight }
    const line = (a, b, alpha, color = '255,255,255') => {
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 - Math.hypot(a.x - b.x, a.y - b.y) * .12, b.x, b.y)
      ctx.strokeStyle = `rgba(${color},${alpha})`; ctx.lineWidth = .6; ctx.stroke()
    }
    const drawNetwork = (lightning = false) => {
      const cx = width * .55, cy = height * .5, radius = Math.min(width, height) * .34
      const nodes = seed.map((p, i) => {
        const angle = p.x * Math.PI * 2 + time * .00003 * p.speed
        const lat = (p.y - .5) * Math.PI
        const depth = Math.cos(angle) * Math.cos(lat)
        const settle = Math.min(1, Math.max(0, time / 1700 - (i % 11) * .035))
        const ease = 1 - (1 - settle) ** 3
        const targetX = cx + Math.sin(angle) * Math.cos(lat) * radius
        const targetY = cy + Math.sin(lat) * radius
        return { x: cx + (p.x - .5) * width * (1 - ease) + (targetX - cx) * ease, y: cy + (p.y - .5) * height * (1 - ease) + (targetY - cy) * ease, depth, i }
      }).sort((a, b) => a.depth - b.depth)
      const globe = ctx.createRadialGradient(cx - radius * .3, cy - radius * .25, radius * .05, cx, cy, radius)
      globe.addColorStop(0, lightning ? "rgba(247,147,26,.055)" : "rgba(255,255,255,.035)")
      globe.addColorStop(1, "rgba(0,0,0,.5)")
      ctx.fillStyle = globe; ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = lightning ? 'rgba(247,147,26,.14)' : 'rgba(255,255,255,.09)'; ctx.stroke()
      nodes.forEach((a, i) => {
        const b = nodes[(i * 7 + 11) % nodes.length]
        if (b.depth > -.15 && Math.hypot(a.x - b.x, a.y - b.y) < radius * .85) line(a, b, .04 + a.depth * .07, lightning ? '247,147,26' : '255,255,255')
        ctx.beginPath(); ctx.arc(a.x, a.y, lightning ? 1.2 + Math.max(0, a.depth) * 2 : 1 + Math.max(0, a.depth) * 1.8, 0, 7)
        ctx.fillStyle = lightning && a.i % 7 === 0 ? "rgba(247,147,26," + (.2 + (a.depth + 1) * .4) + ")" : "rgba(255,255,255," + (.05 + (a.depth + 1) * .35) + ")"; ctx.fill()
      })
      if (lightning) {
        const phase = (time * .00015) % 1
        const path = nodes.filter(n => n.depth > 0).slice(4, 10)
        path.slice(0, -1).forEach((n, i) => line(n, path[i + 1], .22, '247,147,26'))
        if (path.length) {
          const seg = Math.min(path.length - 2, Math.floor(phase * (path.length - 1)))
          const local = phase * (path.length - 1) - seg, a = path[seg], b = path[seg + 1]
          const x = a.x + (b.x - a.x) * local, y = a.y + (b.y - a.y) * local
          ctx.shadowBlur = 20; ctx.shadowColor = '#f7931a'; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); ctx.shadowBlur = 0
        }
      }
    }
    const drawMempool = () => {
      const top = height * .18
      const grad = ctx.createLinearGradient(0, top, 0, height)
      grad.addColorStop(0, "rgba(247,147,26,.07)"); grad.addColorStop(1, "rgba(0,0,0,0)")
      ctx.fillStyle = grad; ctx.fillRect(0, top, width, height - top)
      seed.forEach((p, i) => {
        p.vx ??= Math.sin(i * 31) * .00012
        p.vy ??= Math.cos(i * 47) * .00008
        const radius = 2 + p.r * 1.7
        p.vx += Math.sin(time * .0007 + i) * .000002
        p.vy += Math.cos(time * .0005 + i * 2) * .0000015
        seed.slice(i + 1, i + 7).forEach((other) => {
          const dx = (p.x - other.x) * width, dy = (p.y - other.y) * height
          const distance = Math.hypot(dx, dy) || 1
          if (distance < radius * 2.6) { p.vx += dx / distance * .000035; p.vy += dy / distance * .000035 }
        })
        const blockFall = ((signal && time < 1200) || (time % 12000) > 10400) && i % 4 === 0
        if (blockFall) p.vy += .00012 + p.r * .000015
        p.vx *= .992; p.vy *= .992; p.x += p.vx; p.y += p.vy
        if (p.x < -.05) p.x = 1.05; if (p.x > 1.05) p.x = -.05
        if (p.y > 1.12) { p.y = -.08; p.vy = .00008 }
        if (p.y < -.12) p.y = 1.08
        const x = p.x * width, y = top + p.y * (height - top), fee = p.r / 6
        ctx.beginPath(); ctx.arc(x, y, radius, 0, 7)
        ctx.fillStyle = "rgba(247," + (100 + p.r * 18) + ",26," + (.08 + fee * .4) + ")"; ctx.fill()
        if (blockFall) { ctx.strokeStyle = "rgba(247,147,26,.16)"; ctx.beginPath(); ctx.moveTo(x, y - radius); ctx.lineTo(x, y - 30); ctx.stroke() }
      })
    }
    const drawHash = () => {
      ctx.font = '11px monospace'; ctx.textAlign = 'left'
      seed.slice(0, 40).forEach((p, i) => {
        const y = (p.y * height + time * .02 * p.speed) % height
        const bits = Math.abs(Math.sin(i * 77 + Math.floor(time / 90))).toString(16).slice(2, 14).padEnd(12, '0')
        ctx.fillStyle = i === Math.floor(time / 700) % 40 ? 'rgba(247,147,26,.8)' : `rgba(255,255,255,${.035 + p.z * .08})`
        ctx.fillText(bits, p.x * width, y)
      })
      const x = width * .66, y = height * .5
      ctx.strokeStyle = 'rgba(247,147,26,.22)'; ctx.strokeRect(x - 80, y - 80, 160, 160)
      ctx.shadowBlur = 35; ctx.shadowColor = '#f7931a'; ctx.strokeStyle = 'rgba(247,147,26,.65)'; ctx.strokeRect(x - 62, y - 62, 124, 124); ctx.shadowBlur = 0
    }
    const render = (t = 0) => {
      if (!active && !reduce) return
      time = reduce ? 4000 : time + (last ? Math.min(32, t - last) * intensity : 0); last = t
      ctx.clearRect(0, 0, width, height)
      const glow = ctx.createRadialGradient(width * pointer.x, height * pointer.y, 0, width * pointer.x, height * pointer.y, width * .6)
      glow.addColorStop(0, 'rgba(247,147,26,.025)'); glow.addColorStop(1, 'transparent'); ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height)
      if (mode === 'network') drawNetwork(false)
      if (mode === 'lightning') drawNetwork(true)
      if (mode === 'mempool') drawMempool()
      if (mode === 'hash') drawHash()
      if (!reduce) raf = requestAnimationFrame(render)
    }
    const observer = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting
      last = 0
      cancelAnimationFrame(raf)
      if (active) raf = requestAnimationFrame(render)
    }, { rootMargin: "10%" })
    resize(); observer.observe(canvas); addEventListener('resize', resize); addEventListener('pointermove', move, { passive: true })
    if (reduce) render()
    return () => { observer.disconnect(); cancelAnimationFrame(raf); removeEventListener('resize', resize); removeEventListener('pointermove', move) }
  }, [mode, intensity, signal])
  return <canvas ref={ref} className="ambient-canvas" aria-hidden="true" />
}

function Header({ progress, section }) {
  return <>
    <header className="site-header">
      <a href="#genesis" className="brand" aria-label="Bitcoin Absolute home"><BitcoinMark small /><span>ABSOLUTE</span></a>
      <span className="chapter-indicator">{String(section + 1).padStart(2, '0')} <i /> {chapters[section]}</span>
      <a className="source-link" href="https://bitcoin.org/bitcoin.pdf" target="_blank" rel="noreferrer">WHITEPAPER ↗</a>
    </header>
    <div className="progress"><span style={{ transform: `scaleX(${progress})` }} /></div>
    <nav className="rail" aria-label="Chapters">{chapters.map((name, i) => <a key={name} className={i === section ? 'active' : ''} href={`#${name.toLowerCase().replace(' ', '-')}`}><span>{name}</span></a>)}</nav>
  </>
}

function Genesis() {
  return <section className="chapter genesis" id="genesis">
    <div className="stars" />
    <div className="genesis-center">
      <p className="eyebrow reveal one">03 JANUARY 2009 · 18:15:05 UTC</p>
      <div className="genesis-block reveal two"><div className="block-face"><BitcoinMark /><span>BLOCK</span><strong>0</strong></div></div>
      <h1 className="reveal three">In the beginning,<br /><em>there was proof.</em></h1>
      <blockquote className="reveal four">“The Times 03/Jan/2009 Chancellor on brink of second bailout for banks”</blockquote>
    </div>
    <div className="scroll-cue"><span>ENTER THE NETWORK</span><i /></div>
  </section>
}

function Network({ metrics }) {
  return <section className="chapter split" id="network">
    <AmbientCanvas mode="network" />
    <ChapterHead index="2" eyebrow="THE NETWORK WAKES" title={<>No center.<br />No off switch.</>} copy="Every node holds the rules. Every node verifies the truth. Remove one, and the rest continue without asking permission." />
    <div className="metrics-row right-bottom">
      <Metric label="PUBLIC NODES" value="18,000+" sub="REACHABLE NOW" />
      <Metric label="CHAIN COPIES" value="∞" sub="VOLUNTARILY HELD" />
    </div>
  </section>
}

function Mining({ metrics }) {
  const exa = (metrics.hashRate / 1e18).toFixed(0)
  return <section className="chapter split reverse" id="proof">
    <AmbientCanvas mode="hash" />
    <ChapterHead index="3" eyebrow="PROOF OF WORK" title={<>Energy becomes<br /><em>certainty.</em></>} copy="Across the planet, machines search for one number. Trillions of guesses. One valid proof. A cost paid in the physical world to secure truth in the digital one." />
    <div className="hash-readout">
      <p>0000000000000000000<span>4f8a</span></p>
      <div><b>{exa} EH/S</b><small>GLOBAL HASH RATE</small></div>
      <div><b>{(metrics.difficulty / 1e12).toFixed(2)} T</b><small>DIFFICULTY</small></div>
    </div>
  </section>
}

function Halving({ metrics }) {
  const next = Math.ceil((metrics.blockHeight + 1) / 210000) * 210000
  const remaining = next - metrics.blockHeight
  const era = Math.floor(metrics.blockHeight / 210000)
  const reward = 50 / 2 ** era
  return <section className="chapter halving" id="halving">
    <ChapterHead index="4" eyebrow="MONETARY TIME" title="Written before it happens." align="center" copy="Every 210,000 blocks, issuance is cut in half. No vote. No committee. No exception." />
    <div className="halving-orbit" key={metrics.blockHeight}>
      <div className="orbit orbit-a" /><div className="orbit orbit-b" />
      <div className="halving-core"><span>BLOCKS REMAINING</span><strong>{fmt.format(remaining)}</strong><small>UNTIL BLOCK {fmt.format(next)}</small></div>
    </div>
    <div className="halving-stats"><Metric label="CURRENT REWARD" value={`${reward} BTC`} /><Metric label="CURRENT HEIGHT" value={fmt.format(metrics.blockHeight)} /><Metric label="ISSUANCE ERA" value={`0${era + 1}`} /></div>
  </section>
}

function Mempool({ metrics }) {
  return <section className="chapter split" id="mempool">
    <AmbientCanvas mode="mempool" signal={metrics.blockHeight} />
    <ChapterHead index="5" eyebrow="THE WAITING ROOM" title={<>Every transaction<br />wants forever.</>} copy="Unconfirmed payments compete in a living market for block space. Urgency rises. Patience sinks. Miners choose what history records next." />
    <div className="mempool-panel">
      <Metric label="WAITING TRANSACTIONS" value={fmt.format(metrics.mempoolCount)} />
      <Metric label="VIRTUAL SIZE" value={`${(metrics.mempoolVsize / 1e6).toFixed(1)} MB`} />
      <div className="fee-legend"><span><i className="hot" />HIGH FEE</span><span><i />PATIENT</span></div>
    </div>
  </section>
}

function Lightning({ metrics }) {
  return <section className="chapter split reverse lightning" id="lightning">
    <AmbientCanvas mode="lightning" intensity={1.4} />
    <ChapterHead index="6" eyebrow="THE LIGHTNING NETWORK" title={<>Light moves.<br />Value follows.</>} copy="A global web of payment channels routes value in milliseconds. Bitcoin at the speed of a thought, secured by the base layer beneath it." />
    <div className="route-card"><span>PAYMENT ROUTE</span><div className="route"><b>BER</b><i /><b>AMS</b><i /><b>NYC</b><i /><b>TYO</b></div><strong>42 ms</strong><small>SETTLED · 21 SATS</small></div>
    <div className="metrics-row left-bottom"><Metric label="CAPACITY" value={`${fmt.format(Math.round(metrics.lightningCapacity))} BTC`} /><Metric label="CHANNELS" value={fmt.format(metrics.lightningChannels)} /></div>
  </section>
}

const pricePoints = [
  [2009, 0], [2010, .08], [2011, 31], [2012, 13], [2013, 1100], [2014, 320], [2015, 430], [2016, 960], [2017, 19783], [2018, 3200], [2019, 13800], [2020, 29000], [2021, 69000], [2022, 15600], [2023, 42200], [2024, 108000], [2025, 104000],
]

function PriceChart({ current }) {
  const path = useMemo(() => {
    const points = [...pricePoints.slice(0, -1), [2026, current]]
    const max = Math.max(...points.map(p => Math.log10(p[1] + 1)))
    return points.map(([year, value], i) => `${i ? 'L' : 'M'} ${(i / (points.length - 1) * 1000).toFixed(1)} ${(310 - Math.log10(value + 1) / max * 270).toFixed(1)}`).join(' ')
  }, [current])
  return <div className="chart-wrap">
    <svg viewBox="0 0 1000 340" preserveAspectRatio="none" aria-label="Bitcoin price history, logarithmic scale">
      <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f7931a" stopOpacity=".28" /><stop offset="1" stopColor="#f7931a" stopOpacity="0" /></linearGradient></defs>
      <path className="price-area" d={`${path} L 1000 340 L 0 340 Z`} /><path className="price-line" pathLength="1" d={path} />
      {[2012, 2016, 2020, 2024].map((year, i) => { const x = ((year - 2009) / 17) * 1000; return <g key={year}><line x1={x} x2={x} y1="20" y2="320" /><text x={x + 10} y={45 + i * 22}>HALVING {year}</text></g> })}
    </svg>
    <div className="chart-events"><span className="e-2011">$31 → $2</span><span className="e-2017">MANIA</span><span className="e-2022">−77%</span><span className="e-now">NOW · {money.format(current)}</span></div>
  </div>
}

function History({ metrics }) {
  return <section className="chapter history" id="history">
    <ChapterHead index="7" eyebrow="THE PRICE OF CONVICTION" title={<>Volatility is the<br />price of discovery.</>} copy="Fifteen years of disbelief, euphoria, ruin, and resolve. Every crash declared the end. Every new block disagreed." />
    <PriceChart current={metrics.price} />
    <div className="history-quote"><span>2009 — 2026</span><p>“The network does not know the price.”</p></div>
  </section>
}

function Keys() {
  const [revealed, setRevealed] = useState(false)
  return <section className="chapter keys" id="keys">
    <div className="key-halo" />
    <ChapterHead index="8" eyebrow="SOVEREIGN OWNERSHIP" title={<>One key.<br />Everything it controls.</>} align="center" copy="No account. No reset button. No permission. A secret known only to you is the boundary between possession and loss." />
    <button className={`key-card ${revealed ? 'revealed' : ''}`} onClick={() => setRevealed(!revealed)} aria-label="Reveal simulated private key">
      <span>PRIVATE KEY · SIMULATION</span>
      <strong>{revealed ? 'L4mEi7vT2aQ9kX3nP8sW5cR1jH6fY0uB' : '••••••••••••••••••••••••••••••••'}</strong>
      <small>{revealed ? 'EXPOSED · NEVER DO THIS WITH A REAL KEY' : 'CLICK TO UNDERSTAND THE RISK'}</small>
    </button>
    <div className="ownership"><span>WITHOUT A BANK</span><i /><span>WITHOUT PERMISSION</span><i /><span>WITHOUT REVERSAL</span></div>
  </section>
}

function Supply({ metrics }) {
  const era = Math.floor(metrics.blockHeight / 210000)
  let mined = 0
  for (let i = 0; i < era; i++) mined += 210000 * (50 / 2 ** i)
  mined += (metrics.blockHeight % 210000) * (50 / 2 ** era)
  mined = Math.min(mined, 20_999_999.9769)
  const percent = mined / 21_000_000 * 100
  return <section className="chapter supply" id="21-million">
    <div className="supply-grid" />
    <p className="eyebrow">THE TERMINAL SCARCITY</p>
    <div className="supply-number"><span>21,000,000</span><strong>{fmt.format(Math.floor(mined))}</strong><small>BITCOIN ISSUED · {percent.toFixed(2)}%</small></div>
    <div className="supply-bar"><span style={{ width: `${percent}%` }} /></div>
    <p className="remaining">ONLY <b>{fmt.format(Math.ceil(21_000_000 - mined))}</b> BTC REMAIN TO BE MINED</p>
    <h2>Everything can be copied.<br /><em>Except scarcity.</em></h2>
    <footer><span><BitcoinMark small /> ABSOLUTE</span><span>VERIFY · DON’T TRUST</span><span>∞ / 21,000,000</span></footer>
  </section>
}

export default function App() {
  const metrics = useMetrics()
  const scroll = useScrollState()
  useSectionVisibility()
  return <main>
    <Header {...scroll} />
    <Genesis />
    <Network metrics={metrics} />
    <Mining metrics={metrics} />
    <Halving metrics={metrics} />
    <Mempool metrics={metrics} />
    <Lightning metrics={metrics} />
    <History metrics={metrics} />
    <Keys />
    <Supply metrics={metrics} />
  </main>
}
