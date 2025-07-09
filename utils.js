/**
 * Creates a debounced version of the provided function.
 * 
 * @param {Function} func - The function to debounce.
 * @param {number} delay - The number of milliseconds to delay.
 * @returns {Function} A new debounced function.
 */
export function debounce(func, delay) {
  let timer;

  return (...args) => {
    if (timer === null || timer === undefined) {
      timer = setTimeout(() => {
        timer = null
        func(...args);
      }, delay);
    }
  };
}

/**
 * Returns a Promise that resolves after a specified delay.
 * Useful for introducing pauses in asynchronous operations.
 * 
 * @param {number} ms - Delay in milliseconds.
 * @returns {Promise<void>} A Promise that resolves after the delay.
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function prng_init(seed) {
  let s = Math.abs(typeof seed === "string" ? hashCode(seed) : seed); // Ensure positive integer

  function prng() {
    s = Math.imul(s, 1597334677);
    let t = s ^ (s >>> 14);
    t = Math.imul(t, 1044297695);
    return ((t ^ (t >>> 20)) >>> 0) / 4294967296;
  };

  prng.getSeed = () => s

  return prng
}

export function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashCoords(x, y, seed) {
  return (x * 73856093 ^ y * 19349663 ^ seed) >>> 0
}

// Helper to convert string to integer seed
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

class Vector {
  constructor(...vals) {
    if (vals.length === 0) {
      throw new Error("Can't create a vector of zero arity");
    }
    this._ = vals;
  }

  get arity() { return this._.length }

  get x() { return this._[0]; }
  set x(value) { this._[0] = value; }

  get y() { return this._[1]; }
  set y(value) { this._[1] = value; }

  get z() { return this._[2]; }
  set z(value) { this._[2] = value; }

  get w() { return this._[3]; }
  set w(value) { this._[3] = value; }

  magnitude() {
    return Math.sqrt(this._.reduce((sum, val) => sum + val * val, 0));
  }

  add(other) {
    if (other instanceof Array) other = Math.vec(...other)
    if (this.arity !== other.arity) {
      throw new Error('Vectors must have the same arity');
    }
    this._ = this._.map((val, i) => val + other._[i]);
  }

  plus(other) {
    if (other instanceof Array) other = Math.vec(...other)
    if (this.arity !== other.arity) {
      throw new Error('Vectors must have the same arity');
    }
    return new Vector(...this._.map((val, i) => val + other._[i]));
  }

  subtract(other) {
    if (other instanceof Array) other = Math.vec(...other)
    if (this.arity !== other.arity) {
      throw new Error('Vectors must have the same arity');
    }
    this._ = this._.map((val, i) => val - other._[i]);
  }

  minus(other) {
    if (other instanceof Array) other = Math.vec(...other)
    if (this.arity !== other.arity) {
      throw new Error('Vectors must have the same arity');
    }
    return new Vector(...this._.map((val, i) => val - other._[i]));
  }

  /** element-wise */
  multiply(other) {
    if (other instanceof Array) other = Math.vec(...other)
    if (this.arity !== other.arity)
      throw new Error('Vectors must have the same arity');
    this._ = this._.map((v, i) => v * other._[i])
    return this
  }

  /** element-wise */
  times(other) {
    if (other instanceof Array) other = Math.vec(...other)
    if (this.arity !== other.arity)
      throw new Error('Vectors must have the same arity');
    return Math.vec(...this._.map((v, i) => v * other._[i]))
  }

  scale(scalar) {
    if (scalar instanceof Array && scalar.length === this.arity) {
      return new Vector(...this._.map((v, i) => v * scalar[i]))
    }
    return new Vector(...this._.map(val => val * scalar));
  }

  dot(other) {
    if (other instanceof Array) other = Math.vec(...other)
    if (this.arity !== other.arity) {
      throw new Error('Vectors must have the same arity');
    }
    return this._.reduce((sum, val, i) => sum + val * other._[i], 0);
  }

  normalize() {
    const mag = this.magnitude();
    if (mag === 0) {
      throw new Error('Cannot normalize a zero vector');
    }
    return this.scale(1 / mag);
  }

  distanceTo(other) {
    return this.minus(other).magnitude();
  }

  eq(other) {
    if (other instanceof Array) {
      if (this.arity !== other.length) return false;
      return this._.every((val, i) => val === other[i])
    }
    if (this.arity !== other.arity) return false;
    return this._.every((val, i) => val === other._[i]);
  }

  toString() {
    return `<${this._.join(', ')}>`;
  }
}

Math.vec = function(...vals) {
  return new Vector(...vals)
}

const spriteCache = new Map()
export async function loadImage(url) {
  if (spriteCache.has(url)) {
    return spriteCache.get(url)
  }
  return new Promise((ok, err) => {
    const img = new Image()

    img.onload = () => {
      console.log(url, img)
      spriteCache.set(url, img)
      ok(img)
    }
    img.onerror = e => err(new Error(`Failed to load image: ${url}`, { cause: e }))

    img.src = 'assets/' + url
  })
}

export function sprite(path) {
  if (!spriteCache.has(path)) {
    throw new Error(`Can't find sprite '${path}'`)
  }
  return spriteCache.get(path)
}

export function omit(obj, fields) {
  const result = {}

  for (const name in obj) if (!fields.includes(name)) result[name] = obj[name];

  return result
}
