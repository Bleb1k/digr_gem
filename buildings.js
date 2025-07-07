import { DB } from "./database.js"

export class Buildings {
  static async init() {
    const result = await DB.load("buildings", 0)

    await this.save()
  }

  static async save() {
    console.log(`Saving buildings`)
    await DB.save("buildings", { dim: Game.chunks.dim })
  }
}
