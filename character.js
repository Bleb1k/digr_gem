import { isKeyDown, Key } from "./keys.js"
import { BIOME_POOLS } from "./resources.js"

export class Character {
  static db

  static move_recharge = 200
  static hit_recharge = 1000
  static strength = 0

  static move_charge = 0
  static hit_accumulator = 0
  static move_vec = Math.vec(0, 0)

  static async init(db) {
    this.db = db

    const result = await this.db.load("character", 0)
    this.pos = Math.vec(...(result?.pos ?? [50, 50]))

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
      console.log(`${this.pos} + ${move_vec} = ${new_pos}`)
      const tile = chunks.getTile(new_pos)[0]
      console.log(new_pos.toString())
      if (tile.amount > 0) {
        console.log(new_pos.toString())
        this.move_vec = move_vec
        console.log(new_pos.toString())
        this.hit(chunks, new_pos)
        this.move_charge += this.hit_recharge
      } else {
        this.move_vec = Math.vec(0, 0)
        this.pos = new_pos
        this.move_charge += this.move_recharge
      }
    }
    return true
  }

  static hit(chunks, pos) {
    console.log(`hitting ${pos}`)
    const [tile, biome] = chunks.getTile(pos)
    const { hardness } = BIOME_POOLS[biome][tile.id]
    
    console.log('acc', this.hit_accumulator, 'hardness', hardness, 'amount', tile.amount)
    if (this.strength * 10 < hardness) return
    if ((this.hit_accumulator += this.strength) < hardness) return

    const broken_amount = Math.min(Math.floor(this.hit_accumulator / hardness), tile.amount)
    
    const { amount: new_amount } = chunks.setTile(pos, {d_amount: -broken_amount})
    console.log('broken', broken_amount, 'new', new_amount)
    if (new_amount <= 0) this.hit_accumulator = 0
    else this.hit_accumulator -= broken_amount * hardness
  }

  static async save() {
    console.log(`Saving character with { pos: ${this.pos}}`)
    await this.db.save("character", {
      id: 0,
      pos: this.pos.components,
      strength: this.strength,
      move_recharge: this.move_recharge,
      hit_recharge: this.hit_recharge,
    })
  }
}
