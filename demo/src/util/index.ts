import { Element, Graphics, Group, Matrix, Shape } from '@mikixing/crk'

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
  canvas.style.display = 'block'

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

function getRad(va: Vector, vb: Vector) {
  va = va.normalize()
  vb = vb.normalize()

  const sin = va.cross(vb)
  const cos = va.dot(vb)

  let theta = Math.asin(sin) // [-90°, 90°]
  return cos > 0 ? theta : Math.sign(sin) * Math.PI - theta
}

export const rand = (min: number, max: number) => {
  return Math.random() * (max - min) + min
}

export const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(min, val), max)

export function getFileDataURL(file: File) {
  return new Promise((r, j) => {
    const reader = new FileReader()
    reader.onload = (ev: any) => r(ev.target.result)
    reader.onerror = j
    reader.readAsDataURL(file)
  })
}

export function getFileText(file: File) {
  return new Promise((r, j) => {
    const reader = new FileReader()
    reader.onload = (ev: any) => r(ev.target.result)
    reader.onerror = j
    reader.readAsText(file)
  })
}

export { default as getRoundCircle } from './getRoundCircle'
export { default as loadImage } from './loadImage'
export { default as dragable } from './dragable'

export const setAnchor = (el: Element, x: number, y: number) => {
  const mat = new Matrix()
    .translate(el.x, el.y)
    .skew(el.skewX, el.skewY)
    .rotate(el.rotation)
    .scale(el.scaleX, el.scaleY)
    .translate(-x, -y)

  const tMat = el.getMatrix()

  el.x += tMat.e - mat.e
  el.y += tMat.f - mat.f
  el.regX = x
  el.regY = y
}

type TBoundingBox = { left: number; right: number; top: number; bottom: number }
export class BoundingBox {
  el: Group | Shape
  left: number
  right: number
  top: number
  bottom: number
  constructor(el: Group | Shape) {
    this.el = el
    this.left = Infinity
    this.right = -Infinity
    this.top = Infinity
    this.bottom = -Infinity
    this.getBoundingBox()
  }

  get boundingBox() {
    return {
      left: this.left,
      right: this.right,
      top: this.top,
      bottom: this.bottom,
    }
  }

  getBoundingBox() {
    this.doGetBoundingBox(this.el)
    return this.boundingBox
  }

  private doGetBoundingBox(el: Group | Shape) {
    if (el instanceof Group) {
      ;(el as Group).children.forEach(child => {
        this.doGetBoundingBox(child)
      })
    } else {
      const coor1 = el.parent?.local2local(el, el.x, el.y) as {
        x: number
        y: number
      }
      const { width = 0, height = 0 } = el as {
        width: number
        height: number
      } & Shape
      const coor2 = el.parent?.local2local(
        this.el,
        el.x + width,
        el.y + height
      ) as {
        x: number
        y: number
      }
      const left = coor1.x
      const right = coor2.x
      const top = coor1.y
      const bottom = coor2.y
      this.addBoundingBox({ left, right, top, bottom })
    }
  }

  addBoundingBox(a: TBoundingBox): TBoundingBox {
    this.left = Math.min(this.left, a.left)
    this.right = Math.max(this.right, a.right)
    this.top = Math.min(this.top, a.top)
    this.bottom = Math.max(this.bottom, a.bottom)
    return this.boundingBox
  }
}

// crk求元素containe,cover的x, y, scale
export function getBackgroundData(
  sw: number,
  sh: number,
  dw: number,
  dh: number,
  isContain = true
) {
  const sr = sw / sh
  const dr = dw / dh

  let scale
  if (isContain) {
    scale = sr > dr ? dw / sw : dh / sh
  } else {
    scale = sr > dr ? dh / sh : dw / sw
  }

  return {
    scale,
    x: (dw - sw * scale) / 2,
    y: (dh - sh * scale) / 2,
  }
}

export function adjustPosition(
  canvas: HTMLCanvasElement,
  el: Group | Shape,
  opt = {} as {
    padding?: number[] | number
    paddingLeft?: number
    paddingTop?: number
    paddingRight?: number
    paddingBottom?: number
  },
  cb?: Function
) {
  const boundingBox = new BoundingBox(el).boundingBox
  // @ts-ignore
  // window.boundingBox = boundingBox
  // boxShape.graphics
  //   .clear()
  //   .setStrokeStyle({ lineWidth: 1, color: 'red' })
  //   .moveTo(boundingBox.left, boundingBox.top)
  //   .lineTo(boundingBox.right, boundingBox.top)
  //   .lineTo(boundingBox.right, boundingBox.bottom)
  //   .lineTo(boundingBox.left, boundingBox.bottom)
  //   .closePath()
  //   .stroke()
  // ;(nodeTree as Group).addChild(boxShape)

  let { padding, paddingLeft, paddingTop, paddingRight, paddingBottom } = opt

  if (!Array.isArray(padding)) {
    padding = Array(4).fill(typeof padding === 'number' ? padding : 0)
  }

  paddingTop = paddingTop ?? padding[0] ?? 0
  paddingRight = paddingRight ?? padding[1] ?? 0
  paddingBottom = paddingBottom ?? padding[2] ?? 0
  paddingLeft = paddingLeft ?? padding[3] ?? 0

  const sw = boundingBox.right - boundingBox.left // source width
  const sh = boundingBox.bottom - boundingBox.top // source height
  const dw = canvas.offsetWidth - paddingLeft - paddingRight // destination width
  const dh = canvas.offsetHeight - paddingTop - paddingBottom // destination height

  const { scale, x, y } = getBackgroundData(sw, sh, dw, dh)
  cb?.(x + paddingLeft, y + paddingTop, scale)
}

export function mix(a: number | number[], b: number | number[], p: number) {
  switch (_check(a, b)) {
    case 1:
      return (a as number) + ((b as number) - (a as number)) * p
    case 2:
      return (a as number[]).map((e, i) => e + ((b as number[])[i] - e) * p)
  }
}
function _check(a: number | number[], b: number | number[]) {
  if (typeof a === 'number') {
    if (typeof b === 'number') {
      return 1
    } else {
      throw new TypeError(`b 必须是 number! typeof b: ${typeof b}`)
    }
  } else if (Array.isArray(a)) {
    if (Array.isArray(b)) {
      if (a.length === b.length) {
        return 2
      } else {
        throw new TypeError(
          `数组a 和 b长度必须相等, a.length: ${a.length}, b.length: ${b.length}`
        )
      }
    }
  } else {
    throw new TypeError(`a 和 b 必须是 number 或 包含number的数组`)
  }
}

export const Bezier = (_ => {
  const lut = [
    [1],
    [1, 1],
    [1, 2, 1],
    [1, 3, 3, 1],
    [1, 4, 6, 4, 1],
    [1, 5, 10, 10, 5, 1],
    [1, 6, 15, 20, 15, 6, 1],
    [1, 7, 21, 35, 35, 21, 7, 1],
    [1, 8, 28, 56, 70, 56, 28, 8, 1],
    [1, 9, 36, 84, 126, 126, 84, 36, 9, 1],
    [1, 10, 45, 120, 210, 252, 210, 120, 45, 10, 1],
  ]

  class Bezier {
    public params: number[] = []
    constructor(...args: number[]) {
      args.length && this.setParam(...args)
    }

    setParam(...args: number[]) {
      this.params = args
    }

    get(t: number) {
      const { params = [] } = this

      if (!params || !params.length || typeof t !== 'number') {
        return 0
      }

      const n = params.length - 1
      const binomials = lut[n]

      let i = 0,
        val = 0,
        ke

      for (; i <= n; i++) {
        ke = binomials[i] * (1 - t) ** (n - i) * t ** i
        val += ke * params[i]
      }

      return val
    }
  }

  return Bezier
})()
export function getLUT(list: number[], interval = 0.01) {
  const segments = Math.ceil(1 / interval)
  const lut = Array(segments + 1)
  const be = new Bezier(...list)

  for (let i = 0, t = 0; ; i++) {
    lut[i] = be.get(t)

    if (t === 1) {
      break
    }

    t = Math.min(1, t + interval)
  }

  return lut
}
