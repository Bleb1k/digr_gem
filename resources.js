function unabbreviate(v) {
  const result = {}
  result.name = v.name ?? v.N
  result.weight = v.weight ?? v.W
  result.hardness = v.hardness ?? v.H
  result.amount = v.amount ?? v.A ?? 1
  result.spread = v.spread ?? v.S ?? 0
  // errors for mandatory parameters
  if (!result.name) throw new Error(`Please specify the name.`)
  if (result.weight === undefined) throw new Error(`Please specify the weight.`)
  if (!result.hardness) throw new Error(`Please specify the hardness.`)
  return result
}

export const BIOME_POOLS = {
  void: [{ N: 'void', W: 1, H: -1 }].map(unabbreviate),
  surface: [
    { N: 'dirt', W: 300, H: 3 },
    { N: 'mud', W: 34, H: 3, A: 2, S: 1 },
    { N: 'root', W: 10, H: 6, A: 5, S: 2 },
    { N: 'stone', W: 7, H: 50 },
    { N: 'coal', W: 3, H: 35, A: 2}
  ].map(unabbreviate),
  beach: [
    { N: 'sand', W: 1000, H: 1 },
    { N: 'dirt', W: 25, H: 3 },
    { N: 'shell', W: 10, H: 10, A: 10, S: 5 },
    { N: 'treasure', W: 1, H: 250 },
  ].map(unabbreviate),
}

export const BIOME_STATS = {
  void: { y: NaN, weight: NaN },
  beach: { y: -3, spread: 5, weight: 3 },
  surface: { y: 0, spread: 5, weight: 10 },
}

for (const name in BIOME_STATS) {
  BIOME_STATS[name].spread ??= 0
}

export function tileColor(biome, tile) {
  if (tile.amount === 0) return '#aaa'
  switch (BIOME_POOLS[biome][tile.id].name) {
    case 'sand':
      return "#fd9"
    case 'dirt':
      if (biome === 'beach') return '#b74'
      return "#842"
    case 'mud':
      return "#531"
    case 'stone':
      return "#666"
    case 'root':
      return '#622'
    case 'coal':
      return '#122'
    case 'shell':
      return '#ebc'
    case 'treasure':
      return '#ff0'
    case 'void':
      return '#111'
    default: 
      throw new Error(`Tile '${BIOME_POOLS[biome][tile.id].name}' is unhandled`)
  }
}

export function randomBiomeAt(y, rng) {
  const available = []
  let totalW = 0
  for (const name in BIOME_STATS) {
    const biome = BIOME_STATS[name]
    
    if ((y > biome.y - biome.spread && biome.y + biome.spread > y) || y === biome.y) {
      available.push(name)
      totalW += biome.weight
    }
  }

  if (available.length === 0) return "void"

  let r = rng() * totalW
  for (const i of available) {
    r -= BIOME_STATS[i].weight
    if (r <= 0) return i
  }
}

export function randomResourceAt(biome, rng) {
  const pool = BIOME_POOLS[biome]
  const totalW = (BIOME_STATS[biome].totalW ??= pool.reduce((acc, v) => acc + v.weight, 0))
  let r = rng() * totalW
  for (const i in pool) {
    const res = pool[i]
    r -= res.weight
    if (r <= 0) {
      const amt = res.amount + Math.floor((rng() * 2 - 1) * res.spread)
      return { id: i, amount: amt }
    }
  }
}
