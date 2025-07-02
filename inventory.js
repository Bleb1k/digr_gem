import { DB } from "./database.js"

const list_element = document.getElementById("inventory")

const update_handlers = {}

export class Inventory {
  static resources = {}

  static async init() {
    const result = await DB.load("inventory", 0)

    this.resources = result?.resources ?? {}
    for (const name in this.resources) {
      createResourceElement(name)
      update_handlers[name](this.resources[name])
    }

    await this.save()
  }

  static store(name, amount) {
    if (this.resources[name] === undefined) {
      this.resources[name] = 0
      createResourceElement(name)
    }
    update_handlers[name](
      this.resources[name] += amount
    )
  }

  /**
   * @param {{[name: string]: number}[]} resources 
   */
  static use(resources) {
    for (const name in resources)
      if (!this.resources[name] || this.resources[name] < resources[name])
        return false
    for (const name in resources)
      this.resources[name] -= resources[name]
    return true
  }

  static async save() {
    await DB.save("inventory", {
      id: 0,
      resources: this.resources
    })
  }
}

function createResourceElement(name) {
  const box_e = document.createElement("tr")
  const name_e = document.createElement("td")
  const count_e = document.createElement("td")

  name_e.innerText = name + ":"
  count_e.innerText = "0"

  box_e.appendChild(name_e)
  box_e.appendChild(count_e)
  list_element.appendChild(box_e)

  update_handlers[name] = (count) => {
    count_e.innerText = count
  }
}
