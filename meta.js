export class Metadata {
  static db

  static async init(db) {
    this.db = db

    const result = await this.db.load("metadata", 0)

    this.seed = result?.seed ?? Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)

    await this.save()
  }

  static async save() {
    console.log(`Saving metadata with { seed: ${this.seed} }`)
    await this.db.save("metadata", { id: 0, seed: this.seed })
  }
}
