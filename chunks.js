import { DB } from "./database.js"
import { Metadata } from "./meta.js"
import { hashCoords, mulberry32, sleep } from "./utils.js"
import { BIOME_POOLS, randomBiomeAt, randomResourceAt } from "./resources.js"
import { Character } from "./character.js"

export class Chunks {
  static tiles_per_chunk = { w: 100, h: 100 }
  static tile_size = { w: 20, h: 20 }
  static render_radius = { w: 15, h: 15 }

  static async init() {
    this.character_tile ??= this.render_radius

    const self = new Chunks()
    
    self.cur_pos = Character.pos
    self.cur_chunk = Math.vec(
      Math.floor(self.#cur_pos.x / Chunks.tiles_per_chunk.w),
      Math.floor(self.#cur_pos.y / Chunks.tiles_per_chunk.h),
    )

    self.updateMetadata()
    await self.updateChunks()

    return self
  }

  saving = new Promise(ok => ok())
  async save() {
    console.log(`Saving chunks`)
    let saving
    this.saving = new Promise(ok => saving = ok)
    await Promise.all([
      this.saveChunk(this.c),
      this.saveChunk(this.l),
      this.saveChunk(this.r),
      this.saveChunk(this.u),
      this.saveChunk(this.d),
      this.saveChunk(this.ul),
      this.saveChunk(this.ur),
      this.saveChunk(this.dl),
      this.saveChunk(this.dr),
    ])
    saving()
    return
  }

  async saveChunk(chunk) {
    const data = chunk.data.flatMap(({ id, amount }) => [id, amount])

    await DB.save("chunks", {
      dim: Character.dim,
      ...chunk,
      data
    })

    return
  }

  #cur_pos = Math.vec(0, 0)

  set cur_pos(pos) {
    if (this.#cur_pos.eq(pos)) return false
    this.#cur_pos._ = pos._.slice()
    this.cur_chunk = Math.vec(
      Math.floor(pos.x / Chunks.tiles_per_chunk.w),
      Math.floor(pos.y / Chunks.tiles_per_chunk.h),
    )
    return this.#cur_pos
  }

  get cur_pos() { return this.#cur_pos }

  updateMetadata() {
    this.seed = Metadata.seed
  }

  generateChunk(pos) {
    console.log(`Generating chunk ${pos}`)
    const chunk = { x: pos.x, y: pos.y }

    const chunkSeed = hashCoords(pos.x, pos.y, this.seed)
    const rng = mulberry32(chunkSeed)

    chunk.biome = randomBiomeAt(pos.y, rng)

    chunk.data = new Array(Chunks.tiles_per_chunk.w * Chunks.tiles_per_chunk.h)
      .fill(0)
      .map(() => randomResourceAt(chunk.biome, rng))

    // const generated_tiles = {}
    // const pool = BIOME_POOLS[chunk.biome]
    // for (const i of chunk.data) {
    //   generated_tiles[pool[i.id].name] ??= 0
    //   generated_tiles[pool[i.id].name] += 1
    // }
    // console.log(generated_tiles)

    return chunk
  }

  async updateChunks() {
    await this.saving
    const { x, y } = this.c ?? { x: 0, y: 0 }
    if (
      undefined === (this.c && this.l && this.r && this.u && this.d && this.ul && this.ur && this.dl && this.dr)
      || (this.cur_chunk.x !== x && this.cur_chunk.y !== y)
    ) {
      await Promise.all([
        this.replaceChunk("c", Math.vec(this.cur_chunk.x, this.cur_chunk.y)),
        this.replaceChunk("l", Math.vec(this.cur_chunk.x - 1, this.cur_chunk.y)),
        this.replaceChunk("r", Math.vec(this.cur_chunk.x + 1, this.cur_chunk.y)),
        this.replaceChunk("u", Math.vec(this.cur_chunk.x, this.cur_chunk.y - 1)),
        this.replaceChunk("d", Math.vec(this.cur_chunk.x, this.cur_chunk.y + 1)),
        this.replaceChunk("ul", Math.vec(this.cur_chunk.x - 1, this.cur_chunk.y - 1)),
        this.replaceChunk("ur", Math.vec(this.cur_chunk.x + 1, this.cur_chunk.y - 1)),
        this.replaceChunk("dl", Math.vec(this.cur_chunk.x - 1, this.cur_chunk.y + 1)),
        this.replaceChunk("dr", Math.vec(this.cur_chunk.x + 1, this.cur_chunk.y + 1)),
      ])
    } else if (x < this.cur_chunk.x && y === this.cur_chunk.y) {
      return this.moveRight()
    } else if (x > this.cur_chunk.x && y === this.cur_chunk.y) {
      return this.moveLeft()
    } else if (y < this.cur_chunk.y && x === this.cur_chunk.x) {
      return this.moveDown()
    } else if (y > this.cur_chunk.y && x === this.cur_chunk.x) {
      return this.moveUp()
    }
  }

  async getChunk(pos) {
    console.log(`Getting chunk ${pos}`)
    const chunk = await DB.load("chunks", [pos.x, pos.y, Character.dim])
    if (chunk === undefined) return this.generateChunk(pos)
    console.log(`Loaded chunk ${pos}`)

    const view = chunk.data
    chunk.data = new Array(chunk.data.length / 2)
      .fill(0)
      .map((_, i) => {
        const id = view.at(i * 2)
        const amount = view.at(i * 2 + 1)
        return { id, amount }
      })

    console.log(`Got chunk ${pos}`)
    return chunk
  }

  async replaceChunk(name, pos) {
    if (!this[name]) return void (
      this[name] = await this.getChunk(pos)
    )

    let { x: prev_x, y: prev_y } = this[name]

    if (pos.eq([prev_x, prev_y])) return;

    const chunk = this[name]
    this.saveChunk(chunk)
    this[name] = await this.getChunk(pos)
  }

  async moveLeft() {
    const r = this.r
    const ur = this.ur
    const dr = this.dr

    this.ur = this.u
    this.r = this.c
    this.dr = this.d
    this.u = this.ul
    this.c = this.l
    this.d = this.dl

    await Promise.all([
      this.saveChunk(r),
      this.saveChunk(ur),
      this.saveChunk(dr),
      this.replaceChunk("ul", Math.vec(this.cur_chunk.x - 1, this.cur_chunk.y - 1)),
      this.replaceChunk("l", Math.vec(this.cur_chunk.x - 1, this.cur_chunk.y)),
      this.replaceChunk("dl", Math.vec(this.cur_chunk.x - 1, this.cur_chunk.y + 1)),
    ])
  }

  async moveRight() {
    const l = this.l
    const ul = this.ul
    const dl = this.dl

    this.ul = this.u
    this.l = this.c
    this.dl = this.d
    this.u = this.ur
    this.c = this.r
    this.d = this.dr

    await Promise.all([
      this.saveChunk(l),
      this.saveChunk(ul),
      this.saveChunk(dl),
      this.replaceChunk("ur", Math.vec(this.cur_chunk.x + 1, this.cur_chunk.y - 1)),
      this.replaceChunk("r", Math.vec(this.cur_chunk.x + 1, this.cur_chunk.y)),
      this.replaceChunk("dr", Math.vec(this.cur_chunk.x + 1, this.cur_chunk.y + 1)),
    ])
  }

  async moveUp() {
    const dl = this.dl
    const d = this.d
    const dr = this.dr

    this.dl = this.l
    this.d = this.c
    this.dr = this.r
    this.l = this.ul
    this.c = this.u
    this.r = this.ur

    await Promise.all([
      this.saveChunk(dl),
      this.saveChunk(d),
      this.saveChunk(dr),
      this.replaceChunk("ul", Math.vec(this.cur_chunk.x - 1, this.cur_chunk.y - 1)),
      this.replaceChunk("u", Math.vec(this.cur_chunk.x, this.cur_chunk.y - 1)),
      this.replaceChunk("ur", Math.vec(this.cur_chunk.x + 1, this.cur_chunk.y - 1)),
    ])
  }

  async moveDown() {
    const ul = this.ul
    const u = this.u
    const ur = this.ur

    this.ul = this.l
    this.u = this.c
    this.ur = this.r
    this.l = this.dl
    this.c = this.d
    this.r = this.dr

    await Promise.all([
      this.saveChunk(ul),
      this.saveChunk(u),
      this.saveChunk(ur),
      this.replaceChunk("dl", Math.vec(this.cur_chunk.x - 1, this.cur_chunk.y + 1)),
      this.replaceChunk("d", Math.vec(this.cur_chunk.x, this.cur_chunk.y + 1)),
      this.replaceChunk("dr", Math.vec(this.cur_chunk.x + 1, this.cur_chunk.y + 1)),
    ])
  }


  async visible_tiles() {
    await this.updateChunks();

    return function*() {
      for (let x = -Chunks.render_radius.w; x <= Chunks.render_radius.w; x += 1) {
        for (let y = -Chunks.render_radius.h; y <= Chunks.render_radius.h; y += 1) {
          const global_pos = this.#cur_pos.plus(Math.vec(x, y))

          yield [
            x + Chunks.render_radius.w,
            y + Chunks.render_radius.h,
            ...this.getTile(global_pos)
          ]
        }
      }
    }.bind(this)()
  }

  /** use chunkGetTile for performance */
  getTile(pos) {
    const center_x = this.cur_chunk.x
    const center_y = this.cur_chunk.y
    const chunk_x = Math.floor(pos.x / Chunks.tiles_per_chunk.w)
    const chunk_y = Math.floor(pos.y / Chunks.tiles_per_chunk.h)

    // console.log({center_x, center_y}, {chunk_x, chunk_y}, x, y)

    return center_x === chunk_x && center_y === chunk_y ? this.chunkGetTile(this.c, pos)
      : center_x < chunk_x && center_y === chunk_y ? this.chunkGetTile(this.r, pos)
        : chunk_x < center_x && center_y === chunk_y ? this.chunkGetTile(this.l, pos)
          : center_x === chunk_x && center_y < chunk_y ? this.chunkGetTile(this.d, pos)
            : center_x === chunk_x && chunk_y < center_y ? this.chunkGetTile(this.u, pos)
              : center_x < chunk_x && center_y < chunk_y ? this.chunkGetTile(this.dr, pos)
                : chunk_x < center_x && center_y < chunk_y ? this.chunkGetTile(this.dl, pos)
                  : center_x < chunk_x && chunk_y < center_y ? this.chunkGetTile(this.ur, pos)
                    : chunk_x < center_x && chunk_y < center_y ? this.chunkGetTile(this.ul, pos)
                      : [null, null]
  }

  chunkGetTile(chunk, pos) {
    const local_pos = pos.minus(Math.vec(
      chunk.x * Chunks.tiles_per_chunk.w,
      chunk.y * Chunks.tiles_per_chunk.h
    ))
    if (local_pos.x < 0) local_pos.x = Chunks.tiles_per_chunk.w - local_pos.x
    if (local_pos.y < 0) local_pos.y = Chunks.tiles_per_chunk.h - local_pos.y
    if (local_pos.x >= Chunks.tiles_per_chunk.w || local_pos.y >= Chunks.tiles_per_chunk.h)
      throw new Error(`You can only get tiles within the bounds of tile (<0, 0>..<${Chunks.tiles_per_chunk.w}, ${Chunks.tiles_per_chunk.h}>), got ${local_pos}`)
    return [chunk.data[local_pos.x + local_pos.y * Chunks.tiles_per_chunk.w], chunk.biome]
  }

  setTile(pos, params) {
    const center_x = this.cur_chunk.x
    const center_y = this.cur_chunk.y
    const chunk_x = Math.floor(pos.x / Chunks.tiles_per_chunk.w)
    const chunk_y = Math.floor(pos.y / Chunks.tiles_per_chunk.h)

    // console.log({center_x, center_y}, {chunk_x, chunk_y}, pos.toString())

    return center_x === chunk_x && center_y === chunk_y ? this.chunkSetTile(this.c, pos, params)
      : center_x < chunk_x && center_y === chunk_y ? this.chunkSetTile(this.r, pos, params)
        : chunk_x < center_x && center_y === chunk_y ? this.chunkSetTile(this.l, pos, params)
          : center_x === chunk_x && center_y < chunk_y ? this.chunkSetTile(this.d, pos, params)
            : center_x === chunk_x && chunk_y < center_y ? this.chunkSetTile(this.u, pos, params)
              : center_x < chunk_x && center_y < chunk_y ? this.chunkSetTile(this.dr, pos, params)
                : chunk_x < center_x && center_y < chunk_y ? this.chunkSetTile(this.dl, pos, params)
                  : center_x < chunk_x && chunk_y < center_y ? this.chunkSetTile(this.ur, pos, params)
                    : chunk_x < center_x && chunk_y < center_y ? this.chunkSetTile(this.ul, pos, params)
                      : [null, null]
  }

  chunkSetTile(chunk, pos, { amount, id, name, d_amount }) {
    const local_pos = pos.minus(Math.vec(
      chunk.x * Chunks.tiles_per_chunk.w,
      chunk.y * Chunks.tiles_per_chunk.h
    ))
    if (local_pos.x < 0) local_pos.x = Chunks.tiles_per_chunk.w - local_pos.x
    if (local_pos.y < 0) local_pos.y = Chunks.tiles_per_chunk.h - local_pos.y
    if (local_pos.x >= Chunks.tiles_per_chunk.w || local_pos.y >= Chunks.tiles_per_chunk.h)
      throw new Error(`You can only set tiles within the bounds of tile (<0, 0>..<${Chunks.tiles_per_chunk.w}, ${Chunks.tiles_per_chunk.h}>), got ${local_pos}`)

    const tile = chunk.data[local_pos.x + local_pos.y * Chunks.tiles_per_chunk.w]
    // console.log(tile)

    if (id !== undefined) tile.id = id

    if (name !== undefined) tile.id = BIOME_POOLS[chunk.biome].indexOf(name)

    if (amount !== undefined) tile.amount = Math.max(amount, 0)
    else tile.amount = Math.max(tile.amount + (d_amount ?? 0), 0)

    return chunk.data[local_pos.x + local_pos.y * Chunks.tiles_per_chunk.w] = tile
  }
}
