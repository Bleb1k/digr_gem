export class Character {
  static db

  static move_recharge = 5
  static move_charge = 0

  static async init(db) {
    this.db = db

    const result = await this.db.load("character", 0)

    this.pos = result?.pos ?? { x: 50, y: 50 }

    /** @type {HTMLInputElement} */
    const element = document.getElementById("character_speed").lastElementChild
    console.log(element, element.value)
    this.move_recharge = 1000 / parseFloat(element.value)
    element.addEventListener('change', () => {
      this.move_recharge = 1000 / parseFloat(element.value)
    })

    await this.save()
  }

  static async save() {
    console.log(`Saving character with { world_pos: <${this.pos.x}, ${this.pos.y}>}`)
    await this.db.save("character", {
      id: 0,
      pos: this.pos,
    })
  }
}
