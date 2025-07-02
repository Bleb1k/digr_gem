import { draw_ctx } from "./canvas.js"
import { Chunks } from "./chunks.js"
import { DB } from "./database.js"
import { Character } from "./character.js"
import { Metadata } from "./meta.js"
import { isKeyDown, isKeyPressed, Key, updateKeyEvents } from "./keys.js"
import { BIOME_POOLS, tileColor } from "./resources.js"
import { Inventory } from "./inventory.js"

class Game {
  static dt = 0
  static async init() {
    await DB.init()

    try {
      await Promise.all([
        Metadata.init(),
        Character.init(),
        Inventory.init()
      ])
      this.chunks = await Chunks.init(Character.pos)
    } catch (e) {
      if (confirm("Error during load of the game, reset?"))
        (await DB.delete(), location.reload())
      throw e
    }
    this.chunks.chunkSetTile(this.chunks.c, Character.pos, { amount: 0 })

    {
      const element = document.getElementById("game")
      element.focus()
      element.addEventListener("mouseover", _ => element.focus())
      element.addEventListener("keydown", async (evt) => {
        if (evt.code === Key.f5) evt.preventDefault()
      })
    }

    this.update_interval_id = setInterval(async () => {
      updateKeyEvents()
      const time = Date.now()
      this.dt = time - (this.last_time ?? Date.now())
      this.last_time = time
      try { await this.update() } catch (e) {
        if (confirm("Error during load of the game, reset?"))
          (await DB.delete(), location.reload())
        throw e
      }
    }, 1000 / 100);
    const draw_loop = async () => {
      for (; ;) {
        if (this.do_draw) {
          try { await this.draw() } catch (e) {
            if (confirm("Error during load of the game, reset?"))
              (await DB.delete(), location.reload())
            throw e
          }
          this.do_draw = false
        }
        await new Promise((res, rej) => {
          this.draw_loop_id = requestAnimationFrame(() => res())
          this.stop_draw_loop = () => void (cancelAnimationFrame(this.draw_loop_id), rej(), this.draw_loop_id = null)
        })
        if (this.draw_loop_id = null) break;
      }
    }
    draw_loop()
    this.character_blink_interval_id = setInterval(() => {
      Character.shown = !Character.shown
      this.do_draw = true
    }, 300)
    try { this.draw() } catch (e) {
      if (confirm("Error during load of the game, reset?"))
        (await DB.delete(), location.reload())
      throw e
    }
  }
  static async save() {
    await Promise.all([
      Metadata.save(),
      Character.save(),
      Inventory.save(),
      this.chunks.save(),
    ])
  }

  static get error() {
    this.stop_draw_loop()
    clearInterval(this.character_blink_interval_id)
    clearInterval(this.update_interval_id)
    return Error;
  }

  static schedule_draw() {
    this.do_draw = true
  }

  static do_draw = false

  static async update() {
    if (isKeyPressed(Key.f5) && isKeyDown(Key.alt)) {
      await DB.delete()
      return location.reload()
    } else if (isKeyPressed(Key.f5)) {
      await this.save()
      return location.reload()
    }

    if (Character.move(this.dt, this.chunks)) this.schedule_draw()
  }

  static async draw() {
    this.chunks.cur_pos = Character.pos
    for (const [x, y, tile, biome] of await this.chunks.visible_tiles()) {
      let color = tileColor(biome, tile)
      draw_ctx.fillStyle = color
      draw_ctx.fillRect(
        x * 10,
        y * 10,
        Chunks.tile_size.w,
        Chunks.tile_size.h
      )
    }
    if (Character.shown) {
      draw_ctx.fillStyle = "#ccc"
      draw_ctx.fillRect(
        Chunks.render_radius.w * 10,
        Chunks.render_radius.h * 10,
        Chunks.tile_size.w,
        Chunks.tile_size.h
      )
    }
    if (!Character.move_vec.eq([0, 0]) && Character.hit_accumulator > 0) {
      const [tile, biome] = this.chunks.getTile(Character.pos.plus(Character.move_vec))
      const { hardness } = BIOME_POOLS[biome][tile.id]
      const split = Math.min(Character.hit_accumulator, hardness) / hardness
      const gradient = draw_ctx.createConicGradient(0,
        (Chunks.render_radius.w + Character.move_vec.x) * 10 + 5,
        (Chunks.render_radius.h + Character.move_vec.y) * 10 + 5,
      )
      // draw_ctx.fillStyle = `conic-gradient(#ccc8 0deg, #0008 360deg)`
      const color = tileColor(biome, tile)
      gradient.addColorStop(0, color)
      gradient.addColorStop(split, color)
      gradient.addColorStop(split, "#0000")
      gradient.addColorStop(1, "#0000")
      // draw_ctx.filter = "hue-rotate(120deg)"
      draw_ctx.filter = "invert(75%)"
      draw_ctx.fillStyle = gradient
      draw_ctx.fillRect(
        (Chunks.render_radius.w + Character.move_vec.x) * 10,
        (Chunks.render_radius.h + Character.move_vec.y) * 10,
        Chunks.tile_size.w,
        Chunks.tile_size.h
      )
      draw_ctx.filter = "invert(0%)"
      // draw_ctx.filter = "hue-rotate(0deg)"
    }
  }
}

await Game.init()

// await DB.init()
