import { draw_ctx } from "./canvas.js"
import { Character } from "./character.js"
import { Chunks } from "./chunks.js"
import { DB } from "./database.js"
import { enum_ } from "./enum.js"
import { loadImage as loadImage_, omit, sprite as sprite_ } from "./utils.js"

const sprite = (path) => sprite_(`buildings/${path}.webp`)
const loadImage = (path) => [path, loadImage_(`buildings/${path}.webp`)]

export class Building {
  static states = enum_("active", "passive")

  static charcoal_pit(pos) {
    let self = new Building("charcoal_pit")

    self.size = Math.vec(2, 2)
    self.pos = pos

    self.cur_state = Building.states.passive

    self.sprites = {
      active: self.sprite("active"),
      passive: self.sprite("passive")
    }

    self.update = function() {}

    return self
  }

  constructor(type) {
    this.type = type
    this.sprites = {}
    this.pos = Math.vec(0, 0)
    this.size = Math.vec(0, 0)
    this.cur_state = Building.states.passive
  }

  #size = Math.vec(0, 0)
  #tile_size = Math.vec(0, 0)
  get size() {   return this.#tile_size  }
  set size(vec) {
    this.#size = vec.scale([Chunks.tile_size.w/16, Chunks.tile_size.h/16])
    this.#tile_size = vec
  }

  sprite(path) {
    return {
      name: path,
      img: sprite(`${this.type}/${path}`)
    }
  }

  draw() {
    // draw_ctx.scale(Chunks.tile_size.w, Chunks.tile_size.h)
    // console.log(`${this.pos} - ${Character.pos} = ${this.pos.minus(Character.pos).scale(10)}`)
    const pos = this.pos.minus(
      Character.pos.minus([Chunks.render_radius.w, Chunks.render_radius.h])
    ).scale([Chunks.tile_size.w, Chunks.tile_size.h])
    draw_ctx.translate(pos.x, pos.y)

    draw_ctx.scale(this.#size.x, this.#size.y)
    switch (this.cur_state) {
      case Building.states.active:
        draw_ctx.drawImage(this.sprites.active.img, 0, 0)
        break
      case Building.states.passive:
        draw_ctx.drawImage(this.sprites.passive.img, 0, 0)
        break
      default:
        throw new Error(`Can't draw state ${this.cur_state}`)
    }
    draw_ctx.resetTransform()
  }
}

export class Buildings {
  static async init() {
    await Promise.all([
      loadImage("charcoal_pit/active"),
      loadImage("charcoal_pit/passive"),
    ])

    const self = new Buildings()
    // const result = await DB.load("buildings", Character.dim)


    // await self.save()

    return self
  }

  data = []

  push(building) {
    this.data.push(building)
    console.log(JSON.stringify(omit(building, [])))
  }

  [Symbol.iterator]() {
    let index = 0;
    return {
      next: () => {
        if (index < this.data.length) {
          return { value: this.data[index++], done: false };
        } else {
          return { done: true };
        }
      }
    };
  }
  async save() {
    console.log(`Saving buildings`)
    await DB.save("buildings", {
      dim: Character.dim
    })
  }
}
