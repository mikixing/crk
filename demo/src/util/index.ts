import { Graphics } from '@mikixing/crk'

export function initCanvas(
  canvas: HTMLCanvasElement,
  width?: number,
  height?: number,
  dpr = window.devicePixelRatio
) {
  width = width || document.documentElement.clientWidth
  height = height || document.documentElement.clientHeight
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'

  let ctx = canvas.getContext('2d')
  ctx?.scale(dpr, dpr)

  return [width, height]
}

export function setRoundRect(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  r = 0
) {
  // 贝塞尔曲线操作杆长度
  let rod = (4 / 3) * (2 ** 0.5 - 1) * r
  // 顺时针绘制
  g.moveTo(x + r, y)
  g.lineTo(x + w - r, y)
  g.bezierCurveTo(x + w - r + rod, y, x + w, y + r - rod, x + w, y + r)
  g.lineTo(x + w, y + h - r)
  g.bezierCurveTo(
    x + w,
    y + h - r + rod,
    x + w - r + rod,
    y + h,
    x + w - r,
    y + h
  )
  g.lineTo(x + r, y + h)
  g.bezierCurveTo(x + r - rod, y + h, x, y + h - r + rod, x, y + h - r)
  g.lineTo(x, y + r)
  g.bezierCurveTo(x, y + r - rod, x + r - rod, y, x + r, y)
  g.closePath()
}

function getRad(va: Vector, vb: Vector) {
  va = va.normalize()
  vb = vb.normalize()

  const sin = va.cross(vb)
  const cos = va.dot(vb)

  let theta = Math.asin(sin) // [-90°, 90°]
  return cos > 0 ? theta : Math.sign(sin) * Math.PI - theta
}

interface IV {
  x: number
  y: number
}
export class Vector {
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

export { default as getRoundCircle } from './getRoundCircle'
