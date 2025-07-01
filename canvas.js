/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("game")
/** @type {CanvasRenderingContext2D} */
const draw_ctx = canvas.getContext("2d")

/*init:*/ {
  const rect = canvas.getClientRects()[0]
  canvas.width = rect.width
  canvas.height = rect.height
}

export { draw_ctx }
