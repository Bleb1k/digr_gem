import { DB } from "./database.js"
import { enum_ } from "./enum.js"
import { Inventory } from "./inventory.js"
import { isKeyDown, Key } from "./keys.js"
import { BIOME_POOLS, tileEffect } from "./resources.js"

export class Character {
  static dimensions = enum_("mine", "surface")
  static move_recharge = 1000 / 5
  static hit_recharge = 1000 / 5
  static strength = 0

  static move_charge = 0
  static hit_accumulator = 0
  static move_vec = Math.vec(0, 0)

  static async init() {
    const result = await DB.load("character", 0)
    this.pos = Math.vec(...(result?.pos ?? [50, 50]))
    this.dim = result?.dim ?? this.dimensions.mine

    /** @type {HTMLInputElement} */
    let spd_elem = document.getElementById("character_speed").lastElementChild
    this.move_recharge = 1000 / parseFloat(spd_elem.value)
    spd_elem.addEventListener('change', () => {
      this.move_recharge = 1000 / +spd_elem.value
    })

    /** @type {HTMLInputElement} */
    const str_elem = document.getElementById("character_stren").lastElementChild
    this.strength = parseFloat(str_elem.value)
    str_elem.addEventListener('change', () => {
      this.strength = parseFloat(str_elem.value)
    })

    await this.save()
  }

  static async move(dt, chunks) {
    await chunks.saving
    if ((this.move_charge -= dt) > 0) return false
    while (this.move_charge <= 0) {
      const move_vec = Math.vec(0, 0)
      if (isKeyDown(Key.up) || isKeyDown(Key.w)) //up
        move_vec.y -= 1
      if (isKeyDown(Key.left) || isKeyDown(Key.a))
        move_vec.x -= 1
      if (isKeyDown(Key.down) || isKeyDown(Key.s))
        move_vec.y += 1
      if (isKeyDown(Key.right) || isKeyDown(Key.d))
        move_vec.x += 1
      if (move_vec.eq([0, 0])) {
        this.move_charge += dt
        return false
      }
      const new_pos = this.pos.plus(move_vec)
      const tile = chunks.getTile(new_pos)
      if (tile[0].amount > 0) {
        this.move_vec = move_vec
        this.hit(chunks, new_pos)
        this.move_charge += this.hit_recharge
      }
      if (tile[0].amount === 0) {
        this.move_vec = Math.vec(0, 0)
        this.hit_accumulator = 0
        this.pos = new_pos
        this.move_charge += this.move_recharge
      }
    }
    return true
  }

  static hit(chunks, pos) {
    const [tile, biome] = chunks.getTile(pos)
    const { name, hardness } = BIOME_POOLS[biome][tile.id]

    if (hardness < 1) return
    // if (this.strength * 100 < hardness) return

    tileEffect(biome, name)

    if ((this.hit_accumulator += this.strength) < hardness) return

    const broken_amount = Math.min(Math.floor(this.hit_accumulator / hardness), tile.amount)

    const { amount: new_amount } = chunks.setTile(pos, { d_amount: -broken_amount })
    // console.log('broken', broken_amount, 'new', new_amount)
    if (new_amount === 0) {
      this.hit_accumulator = 0
      this.move_charge -= this.hit_recharge
    } else this.hit_accumulator -= broken_amount * hardness

    Inventory.store(name, broken_amount)
  }

  static async save() {
    console.log(`Saving character with { pos: ${this.pos}}`)
    await DB.save("character", {
      id: 0,
      pos: this.pos._,
      strength: this.strength,
      move_recharge: this.move_recharge,
      hit_recharge: this.hit_recharge,
    })
  }
}
