import express from 'express'

const app = express()
const port = process.env.PORT || 4000
const CACHE_TTL = 60_000

const fallback = {
  blockHeight: 899420,
  mempoolCount: 19243,
  mempoolVsize: 14_800_000,
  hashRate: 852_000_000_000_000_000_000,
  difficulty: 126_980_000_000_000,
  price: 104250,
  lightningCapacity: 5180,
  lightningChannels: 49100,
  updatedAt: null,
  stale: true,
}

let cache = { data: fallback, expires: 0 }

async function json(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'bitcoin-absolute/1.0' },
    signal: AbortSignal.timeout(6000),
  })
  if (!response.ok) throw new Error(`${response.status} from ${url}`)
  return response.json()
}

async function getMetrics() {
  if (Date.now() < cache.expires) return cache.data

  const [height, mempool, difficulty, price, lightning] = await Promise.allSettled([
    json('https://mempool.space/api/blocks/tip/height'),
    json('https://mempool.space/api/mempool'),
    json('https://mempool.space/api/v1/mining/hashrate/1m'),
    json('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'),
    json('https://mempool.space/api/v1/lightning/statistics/latest'),
  ])

  const previous = cache.data
  const mining = difficulty.status === 'fulfilled' ? difficulty.value : {}
  const ln = lightning.status === 'fulfilled' ? lightning.value?.latest ?? lightning.value : {}
  const resolvedHeight = height.status === 'fulfilled' ? Number(height.value) : previous.blockHeight

  const data = {
    blockHeight: resolvedHeight,
    mempoolCount: mempool.status === 'fulfilled' ? mempool.value.count : previous.mempoolCount,
    mempoolVsize: mempool.status === 'fulfilled' ? mempool.value.vsize : previous.mempoolVsize,
    hashRate: mining.currentHashrate ?? previous.hashRate,
    difficulty: mining.currentDifficulty ?? previous.difficulty,
    price: price.status === 'fulfilled' ? price.value.bitcoin.usd : previous.price,
    lightningCapacity: ln.total_capacity ? ln.total_capacity / 100_000_000 : previous.lightningCapacity,
    lightningChannels: ln.channel_count ?? previous.lightningChannels,
    updatedAt: new Date().toISOString(),
    stale: [height, mempool, difficulty, price].every((item) => item.status === 'rejected'),
  }

  cache = { data, expires: Date.now() + CACHE_TTL }
  return data
}

app.get('/api/metrics', async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=300')
  res.json(await getMetrics())
})

app.use(express.static('dist'))
app.use((_req, res) => res.sendFile(new URL('dist/index.html', import.meta.url).pathname))

app.listen(port, () => console.log(`Bitcoin data layer listening on :${port}`))
