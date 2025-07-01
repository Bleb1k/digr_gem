import { draw_ctx } from "./canvas.js"
import { Chunks } from "./chunks.js"
import { DB } from "./database.js"
import { sleep } from "./utils.js"
import { Character } from "./character.js"
import { Metadata } from "./meta.js"
import { isKeyDown, isKeyPressed, Key, updateKeyEvents } from "./keys.js"
import { tileColor } from "./resources.js"

class Game {
  static dt = 0
  static async init() {
    this.db = await DB.init()

    await Metadata.init(this.db)
    await Character.init(this.db)
    this.chunks = await Chunks.init(this.db, Character.pos)

    {
      const element = document.getElementById("game")
      element.addEventListener("mouseover", _ => element.focus())
      element.addEventListener("keydown", async (evt) => {
        const key = evt.keyCode
        if (key === Key.f5) {
          evt.preventDefault()
          console.log("defaults prevented")
        }
      })
    }

    this.update_interval_id = setInterval(async () => {
      updateKeyEvents()
      const time = Date.now()
      this.dt = time - (this.last_time ?? Date.now())
      this.last_time = time
      await this.update()
    }, 1000 / 100);
    const draw_loop = async () => {
      for (; ;) {
        if (this.do_draw) {
          this.draw()
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
    this.draw()
  }
  static async save() {
    await Metadata.save()
    await Character.save()
    await this.chunks.save()
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
      await this.db.delete()
      console.log("successfully deleted game database")
      await sleep(1000)
      return location.reload()
    } else if (isKeyPressed(Key.f5)) {
      await this.save()
      return location.reload()
    }

    foo: if ((Character.move_charge -= this.dt) <= 0) while (Character.move_charge <= 0) {
      const {x,y} = Character.pos
      if (isKeyDown(Key.up) || isKeyDown(Key.w)) //up
        Character.pos.y -= 1
      if (isKeyDown(Key.left) || isKeyDown(Key.a))
        Character.pos.x -= 1
      if (isKeyDown(Key.down) || isKeyDown(Key.s))
        Character.pos.y += 1
      if (isKeyDown(Key.right) || isKeyDown(Key.d))
        Character.pos.x += 1
      if (x === Character.pos.x && y === Character.pos.y) {
        Character.move_charge += this.dt
        break foo
      }
      Character.move_charge += Character.move_recharge
      this.schedule_draw()
    }
  }

  static async draw() {
    this.chunks.cur_pos = Character.pos
    for (const [x, y, tile, biome] of await this.chunks.visible_tiles()) {
      let color = tileColor(biome, tile)
      draw_ctx.fillStyle = color
      draw_ctx.fillRect(x * 10, y * 10, 9, 9)
    }
    if (Character.shown) {
      draw_ctx.fillStyle = "#ccc"
      draw_ctx.fillRect(Chunks.render_radius.w * 10, Chunks.render_radius.h * 10, 9, 9)
    }
  }
}

await Game.init()

// await DB.init()
