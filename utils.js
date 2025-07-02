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
    this.components = vals;
  }

  get arity() { return this.components.length }

  get x() { return this.components[0]; }
  set x(value) { this.components[0] = value; }

  get y() { return this.components[1]; }
  set y(value) { this.components[1] = value; }

  get z() { return this.components[2]; }
  set z(value) { this.components[2] = value; }

  get w() { return this.components[3]; }
  set w(value) { this.components[3] = value; }

  magnitude() {
    return Math.sqrt(this.components.reduce((sum, val) => sum + val * val, 0));
  }

  add(other) {
    if (this.arity !== other.arity) {
      throw new Error('Vectors must have the same arity');
    }
    this.components = this.components.map((val, i) => val + other.components[i]);
  }

  plus(other) {
    if (this.arity !== other.arity) {
      throw new Error('Vectors must have the same arity');
    }
    return new Vector(...this.components.map((val, i) => val + other.components[i]));
  }

  subtract(other) {
    if (this.arity !== other.arity) {
      throw new Error('Vectors must have the same arity');
    }
    this.components = this.components.map((val, i) => val - other.components[i]);
  }

  minus(other) {
    if (this.arity !== other.arity) {
      throw new Error('Vectors must have the same arity');
    }
    return new Vector(...this.components.map((val, i) => val - other.components[i]));
  }

  scale(scalar) {
    return new Vector(...this.components.map(val => val * scalar));
  }

  dot(other) {
    if (this.arity !== other.arity) {
      throw new Error('Vectors must have the same arity');
    }
    return this.components.reduce((sum, val, i) => sum + val * other.components[i], 0);
  }

  normalize() {
    const mag = this.magnitude();
    if (mag === 0) {
      throw new Error('Cannot normalize a zero vector');
    }
    return this.scale(1 / mag);
  }

  distanceTo(other) {
    return this.subtract(other).magnitude();
  }

  eq(other) {
    if (other instanceof Array) {
      if (this.arity !== other.length) return false;
      return this.components.every((val, i) => val === other[i])
    }
    if (this.arity !== other.arity) return false;
    return this.components.every((val, i) => val === other.components[i]);
  }

  toString() {
    return `<${this.components.join(', ')}>`;
  }
}

Math.vec = function(...vals) {
  return new Vector(...vals)
}
