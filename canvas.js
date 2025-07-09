import { Chunks } from "./chunks.js"

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("game")
/** @type {CanvasRenderingContext2D} */
const draw_ctx = canvas.getContext("2d")

/*init:*/ {
  const rect = canvas.getClientRects()[0]
  canvas.width = rect.width
  canvas.height = rect.height

  Chunks.tile_size.w = rect.width / (Chunks.render_radius.w * 2 + 1)
  Chunks.tile_size.h = rect.height / (Chunks.render_radius.h * 2 + 1)

  draw_ctx.imageSmoothingEnabled = false
}

export { draw_ctx }
