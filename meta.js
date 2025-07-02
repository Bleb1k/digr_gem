import { DB } from "./database.js"

export class Metadata {
  static async init() {
    const result = await DB.load("metadata", 0)

    this.seed = result?.seed ?? Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)

    await this.save()
  }

  static async save() {
    console.log(`Saving metadata with { seed: ${this.seed} }`)
    await DB.save("metadata", { id: 0, seed: this.seed })
  }
}
