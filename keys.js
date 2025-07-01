import { enum_ } from "./enum.js";

export const Key = {
  esc: "Escape",
  f1: "F1",
  f2: "F2",
  f3: "F3",
  f4: "F4",
  f5: "F5",
  f6: "F6",
  f7: "F7",
  f8: "F8",
  f9: "F9",
  f10: "F10",
  f11: "F11",
  f12: "F12",
  f13: "F13",
  f14: "F14",
  f15: "F15",
  f16: "F16",
  f17: "F17",
  f18: "F18",
  f19: "F19",
  f20: "F20",
  f21: "F21",
  f22: "F22",
  f23: "F23",
  f24: "F24",
  print_screen: "PrintScreen",
  pause: "Pause",
  scroll_lock: "ScrollLock",
  insert: "Insert",
  delete: "Delete",
  home: "Home",
  end: "End",
  page_up: "PageUp",
  page_down: "PageDown",
  left: "ArrowLeft",
  up: "ArrowUp",
  right: "ArrowRight",
  down: "ArrowDown",
  tilda: "Backquote", // ~
  backquote: "Backquote", // `
  _0: "Digit0",
  _1: "Digit1",
  _2: "Digit2",
  _3: "Digit3",
  _4: "Digit4",
  _5: "Digit5",
  _6: "Digit6",
  _7: "Digit7",
  _8: "Digit8",
  _9: "Digit9",
  minus: "Minus",
  equal: "Equal",
  backspace: "Backspace",
  meta: "MetaLeft",
  tab: "Tab",
  shift: "ShiftLeft",
  ctrl: "ControlLeft",
  alt: "AltLeft",
  space: "Space",
  context_menu: "ContextMenu",
  backslash: "Backslash",
  a: "KeyA",
  b: "KeyB",
  c: "KeyC",
  d: "KeyD",
  e: "KeyE",
  f: "KeyF",
  g: "KeyG",
  h: "KeyH",
  i: "KeyI",
  j: "KeyJ",
  k: "KeyK",
  l: "KeyL",
  m: "KeyM",
  n: "KeyN",
  o: "KeyO",
  p: "KeyP",
  q: "KeyQ",
  r: "KeyR",
  s: "KeyS",
  t: "KeyT",
  u: "KeyU",
  v: "KeyV",
  w: "KeyW",
  x: "KeyX",
  y: "KeyY",
  z: "KeyZ",
  l_bracket: "BracketLeft",
  r_bracket: "BracketRight",
  semicolon: "Semicolon",
  quote: "Quote",
  period: "Period",
  comma: "Comma",
  slash: "Slash",
  enter: "Enter",
  r_alt: "AltRight",
  r_ctrl: "ControlRight",
  r_shift: "ShiftRight",
  num_lock: "NumLock",
  num_div: "NumpadDivide",
  num_mul: "NumpadMultipy",
  num_minus: "NumpadSubtract",
  num_plus: "NumpadAdd",
  num_comma: "NumpadDecimal",
  num_enter: "NumpadEnter",
  num_0: "Numpad0",
  num_1: "Numpad1",
  num_2: "Numpad2",
  num_3: "Numpad3",
  num_4: "Numpad4",
  num_5: "Numpad5",
  num_6: "Numpad6",
  num_7: "Numpad7",
  num_8: "Numpad8",
  num_9: "Numpad9",
}

let keys_down_accumulator = {}
let keys_down = {}
let key_events_accumulator = {}
let key_events = {}

document.getElementById("game").addEventListener("keydown", (e) => {
  e.preventDefault()
  // e.stopPropagation()
  // e.stopImmediatePropagation()
  if (key_events_accumulator[e.code] === 'up')
    return key_events_accumulator[e.code] = 'click'
  else
    key_events_accumulator[e.code] = "down"
  keys_down_accumulator[e.code] = true
})
document.getElementById("game").addEventListener("keyup", (e) => {
  e.preventDefault()
  // e.stopPropagation()
  // e.stopImmediatePropagation()
  if (key_events_accumulator[e.code] === 'down')
    key_events_accumulator[e.code] = 'click'
  else
    key_events_accumulator[e.code] = "up"
  delete keys_down_accumulator[e.code]
})

export function updateKeyEvents() {
  keys_down = {...keys_down_accumulator}
  key_events = key_events_accumulator
  key_events_accumulator = {}
}

export function isKeyPressed(key) {
  return key_events[key] === 'down' || key_events[key] === 'click'
}

export function isKeyReleased(key) {
  return key_events[key] === 'up' || key_events[key] === 'click'
}

export function isKeyDown(key) {
  return keys_down[key] === true
}

export function isKeyUp(key) {
  return !keys_down[key]
}
