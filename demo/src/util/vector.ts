interface IV {
  x: number
  y: number
}
export default class Vector {
  public x: number
  public y: number

  static from(v: IV) {
    return new Vector(v.x, v.y)
  }

  static ZERO = 1e-8

  static fromArray(v: number[]) {
    return new Vector(v[0], v[1])
  }

  constructor(x: number, y: number) {
    this.x = x ?? 1
    this.y = y ?? 1
  }

  get length() {
    return (this.x ** 2 + this.y ** 2) ** 0.5
  }

  normalize() {
    let len = this.length
    return new Vector(this.x / len, this.y / len)
  }

  add(v: Vector | IV) {
    return new Vector(this.x + v.x, this.y + v.y)
  }

  isParallel(v: Vector | IV) {
    return Math.abs(this.x / v.x - this.y / v.y) < Vector.ZERO
  }

  // 反向
  inverse() {
    return new Vector(-this.x, -this.y)
  }

  // 相减
  substract(v: Vector | IV) {
    return new Vector(this.x - v.x, this.y - v.y)
  }

  // 点乘
  dot(v: Vector | IV) {
    return this.x * v.x + this.y * v.y
  }

  // 叉乘
  cross(v: Vector | IV) {
    return this.x * v.y - this.y * v.x
  }

  scale(v: Vector | IV | number) {
    if (typeof v === 'number') return new Vector(this.x * v, this.y * v)
    return new Vector(this.x * v.x, this.y * v.y)
  }

  rotate(rad: number) {
    const sin = Math.sin(rad)
    const cos = Math.cos(rad)
    return new Vector(cos * this.x - sin * this.y, sin * this.x + cos * this.y)
  }

  getRad(v: Vector) {
    return getRad(this, v)
  }
}

function getRad(va: Vector, vb: Vector) {
  va = va.normalize()
  vb = vb.normalize()

  const sin = va.cross(vb)
  const cos = va.dot(vb)

  let theta = Math.asin(sin) // [-90°, 90°]
  return cos > 0 ? theta : Math.sign(sin) * Math.PI - theta
}
