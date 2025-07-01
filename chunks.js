import { enum_ } from "./enum.js"
import { Metadata } from "./meta.js"
import { hashCoords, mulberry32 } from "./utils.js"
import { randomBiomeAt, randomResourceAt } from "./resources.js"

export class Chunks {
  static db

  static dimensions = enum_("mine")

  static async init(db, pos) {
    this.tiles_per_chunk ??= { w: 100, h: 100 }
    this.render_radius ??= { w: 10, h: 10 }
    this.character_tile ??= this.render_radius

    const self = new Chunks()
    self.db = db

    self.cur_pos = pos
    self.cur_chunk = {
      x: Math.floor(pos.x / Chunks.tiles_per_chunk.w),
      y: Math.floor(pos.y / Chunks.tiles_per_chunk.h),
    }
    self.dim = Chunks.dimensions.mine

    self.updateMetadata()
    await self.updateChunks()

    return self
  }

  async save() {
    console.log(`Saving chunks`)
    return Promise.all([
      this.db.save("chunks", this.c),
      this.db.save("chunks", this.l),
      this.db.save("chunks", this.r),
      this.db.save("chunks", this.u),
      this.db.save("chunks", this.d),
      this.db.save("chunks", this.ul),
      this.db.save("chunks", this.ur),
      this.db.save("chunks", this.dl),
      this.db.save("chunks", this.dr),
    ])
  }

  #cur_pos = { x: 0, y: 0 }

  set cur_pos({ x, y }) {
    let same = this.#cur_pos.x === x && this.#cur_pos.y === y
    if (same) return false
    this.#cur_pos = { x, y }
    this.cur_chunk = {
      x: Math.floor(x / Chunks.tiles_per_chunk.w),
      y: Math.floor(y / Chunks.tiles_per_chunk.h),
    }
    return { x, y }
  }

  get cur_pos() { return this.#cur_pos }

  updateMetadata() {
    this.seed = Metadata.seed
  }

  generateChunk(x, y) {
    console.log(`Generating chunk <${x}, ${y}>`)
    const chunk = { x, y }

    const chunkSeed = hashCoords(x, y, this.seed)
    const rng = mulberry32(chunkSeed)

    chunk.biome = randomBiomeAt(y, rng)

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
    const { x, y } = this.c ?? { x: 0, y: 0 }
    if (
      undefined === (this.c && this.l && this.r && this.u && this.d && this.ul && this.ur && this.dl && this.dr)
      || (this.cur_chunk.x !== x && this.cur_chunk.y !== y)
    ) {
      await Promise.all([
        this.replaceChunk("c", this.cur_chunk.x, this.cur_chunk.y),
        this.replaceChunk("l", this.cur_chunk.x - 1, this.cur_chunk.y),
        this.replaceChunk("r", this.cur_chunk.x + 1, this.cur_chunk.y),
        this.replaceChunk("u", this.cur_chunk.x, this.cur_chunk.y - 1),
        this.replaceChunk("d", this.cur_chunk.x, this.cur_chunk.y + 1),
        this.replaceChunk("ul", this.cur_chunk.x - 1, this.cur_chunk.y - 1),
        this.replaceChunk("ur", this.cur_chunk.x + 1, this.cur_chunk.y - 1),
        this.replaceChunk("dl", this.cur_chunk.x - 1, this.cur_chunk.y + 1),
        this.replaceChunk("dr", this.cur_chunk.x + 1, this.cur_chunk.y + 1),
      ])
    } else if (x < this.cur_chunk.x && y === this.cur_chunk.y) {
      await this.moveRight()
    } else if (x > this.cur_chunk.x && y === this.cur_chunk.y) {
      await this.moveLeft()
    } else if (y < this.cur_chunk.y && x === this.cur_chunk.x) {
      await this.moveDown()
    } else if (y > this.cur_chunk.y && x === this.cur_chunk.x) {
      await this.moveUp()
    }
  }

  async getChunk(x, y) {
    return (await this.db.load("chunks", [x, y]))
      ?? this.generateChunk(x, y)
  }

  async replaceChunk(name, x, y) {
    if (!this[name]) return void (
      this[name] = await this.getChunk(x, y)
    )

    let { x: prev_x, y: prev_y } = this[name]

    if (prev_x === x && prev_y === y) return;

    const chunk = this[name]
    this.db.save("chunks", chunk)
    this[name] = await this.getChunk(x, y)
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
      this.db.save("chunks", r),
      this.db.save("chunks", ur),
      this.db.save("chunks", dr),
      this.replaceChunk("ul", this.cur_chunk.x - 1, this.cur_chunk.y - 1),
      this.replaceChunk("l", this.cur_chunk.x - 1, this.cur_chunk.y),
      this.replaceChunk("dl", this.cur_chunk.x - 1, this.cur_chunk.y + 1),
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
      this.db.save("chunks", l),
      this.db.save("chunks", ul),
      this.db.save("chunks", dl),
      this.replaceChunk("ur", this.cur_chunk.x + 1, this.cur_chunk.y - 1),
      this.replaceChunk("r", this.cur_chunk.x + 1, this.cur_chunk.y),
      this.replaceChunk("dr", this.cur_chunk.x + 1, this.cur_chunk.y + 1),
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
      this.db.save("chunks", dl),
      this.db.save("chunks", d),
      this.db.save("chunks", dr),
      this.replaceChunk("ul", this.cur_chunk.x - 1, this.cur_chunk.y - 1),
      this.replaceChunk("u", this.cur_chunk.x, this.cur_chunk.y - 1),
      this.replaceChunk("ur", this.cur_chunk.x + 1, this.cur_chunk.y - 1),
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
      this.db.save("chunks", ul),
      this.db.save("chunks", u),
      this.db.save("chunks", ur),
      this.replaceChunk("dl", this.cur_chunk.x - 1, this.cur_chunk.y + 1),
      this.replaceChunk("d", this.cur_chunk.x, this.cur_chunk.y + 1),
      this.replaceChunk("dr", this.cur_chunk.x + 1, this.cur_chunk.y + 1),
    ])
  }


  async visible_tiles() {
    await this.updateChunks();

    return function*() {
      for (let x = -Chunks.render_radius.w; x <= Chunks.render_radius.w; x += 1) {
        for (let y = -Chunks.render_radius.h; y <= Chunks.render_radius.h; y += 1) {
          const global_x = this.#cur_pos.x + x
          const global_y = this.#cur_pos.y + y

          yield [
            x + Chunks.render_radius.w,
            y + Chunks.render_radius.h,
            ...this.getTile(global_x, global_y)
          ]
        }
      }
    }.bind(this)()
  }

  getTile(x, y) {
    const center_x = this.cur_chunk.x
    const center_y = this.cur_chunk.y
    const chunk_x = Math.floor(x / Chunks.tiles_per_chunk.w)
    const chunk_y = Math.floor(y / Chunks.tiles_per_chunk.h)

    // console.log({center_x, center_y}, {chunk_x, chunk_y}, x, y)

    return center_x === chunk_x && center_y === chunk_y ? this.chunkGetTile(this.c, x, y)
      : center_x < chunk_x && center_y === chunk_y ? this.chunkGetTile(this.r, x, y)
        : chunk_x < center_x && center_y === chunk_y ? this.chunkGetTile(this.l, x, y)
          : center_x === chunk_x && center_y < chunk_y ? this.chunkGetTile(this.d, x, y)
            : center_x === chunk_x && chunk_y < center_y ? this.chunkGetTile(this.u, x, y)
              : center_x < chunk_x && center_y < chunk_y ? this.chunkGetTile(this.dr, x, y)
                : chunk_x < center_x && center_y < chunk_y ? this.chunkGetTile(this.dl, x, y)
                  : center_x < chunk_x && chunk_y < center_y ? this.chunkGetTile(this.ur, x, y)
                    : chunk_x < center_x && chunk_y < center_y ? this.chunkGetTile(this.ul, x, y)
                      : [null, null]
  }

  /** x and y are global */
  chunkGetTile(chunk, x, y) {
    x = x - chunk.x * Chunks.tiles_per_chunk.w
    if (x < 0) x = Chunks.tiles_per_chunk.w - x
    y = y - chunk.y * Chunks.tiles_per_chunk.h
    if (y < 0) y = Chunks.tiles_per_chunk.h - y
    if (x >= Chunks.tiles_per_chunk.w || y >= Chunks.tiles_per_chunk.h)
      throw new Error(`You can only get tiles within the bounds of tile (<0, 0>..<${Chunks.tiles_per_chunk.w}, ${Chunks.tiles_per_chunk.h}>), got <${x}, ${y}>`)
    return [chunk.data[x + y * Chunks.tiles_per_chunk.w], chunk.biome]
  }
}
