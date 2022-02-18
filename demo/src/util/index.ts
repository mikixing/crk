import { Element, Graphics, Group, Matrix, Shape, Stage } from '@mikixing/crk'
import Vector from './vector'
import Bezier from './bezier'

export { default as Vector } from './vector'
export { default as Bezier, getLUT } from './bezier'
export { default as getRoundCircle } from './getRoundCircle'
export { default as loadImage } from './loadImage'
export { default as dragable } from './dragable'

//适配屏幕分辨率
export function initCanvas(
  canvas: HTMLCanvasElement,
  width?: number,
  height?: number,
  dpr = window.devicePixelRatio
) {
  width =
    width ??
    canvas.parentElement?.offsetWidth ??
    document.documentElement.clientWidth
  height =
    height ??
    canvas.parentElement?.offsetHeight ??
    document.documentElement.clientHeight

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

// 随机生成min-max范围的值
export const rand = (min: number, max: number) => {
  return Math.random() * (max - min) + min
}

// 生成min-max范围的值
export const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(min, val), max)

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
  public el: Group | Shape
  public left: number
  public right: number
  public top: number
  public bottom: number

  constructor(el: Group | Shape) {
    this.el = el
    this.left = Infinity
    this.right = -Infinity
    this.top = Infinity
    this.bottom = -Infinity
    this.getBoundingBox()
  }

  public get x() {
    return this.left
  }

  public get y() {
    return this.top
  }

  public get width() {
    return this.right - this.left
  }

  public get height() {
    return this.bottom - this.top
  }

  public get boundingBox() {
    return {
      left: this.left,
      right: this.right,
      top: this.top,
      bottom: this.bottom,
    }
  }

  public getBoundingBox() {
    this.doGetBoundingBox(this.el)
    return this.boundingBox
  }

  private doGetBoundingBox(el: Group | Shape) {
    if (el instanceof Group) {
      ;(el as Group).children.forEach(child => {
        this.doGetBoundingBox(child)
      })
    } else {
      const coor1 = el.parent?.local2local(this.el, el.x, el.y) as {
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

  public addBoundingBox(a: TBoundingBox): TBoundingBox {
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
  opt = {} as {
    isContain?: boolean
    padding?: number[] | number
    paddingLeft?: number
    paddingTop?: number
    paddingRight?: number
    paddingBottom?: number
  }
) {
  let {
    isContain = true,
    padding,
    paddingLeft,
    paddingTop,
    paddingRight,
    paddingBottom,
  } = opt

  if (!Array.isArray(padding)) {
    padding = Array(4).fill(typeof padding === 'number' ? padding : 0)
  }

  paddingTop = paddingTop ?? padding[0] ?? 0
  paddingRight = paddingRight ?? padding[1] ?? 0
  paddingBottom = paddingBottom ?? padding[2] ?? 0
  paddingLeft = paddingLeft ?? padding[3] ?? 0

  dw = dw - paddingLeft - paddingRight
  dh = dh - paddingTop - paddingBottom

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
    x: (dw - sw * scale) / 2 + paddingLeft,
    y: (dh - sh * scale) / 2 + paddingTop,
  }
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

export function debounce<T extends (...args: any[]) => void>(fn: T, t = 500) {
  let timer: NodeJS.Timeout
  return function (...args: Parameters<T>) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      // @ts-ignore
      fn.call(this, ...args)
    }, t)
  }
}

export function setWheel(
  el: Group,
  onChange?: (x: number, y: number, scale: number) => void
) {
  const { stage } = el

  if (!stage) {
    throw new Error('please set el as a descendant of a stage')
  }

  const { canvas } = stage

  let wheelFn: (ev: WheelEvent) => void
  let timer: NodeJS.Timeout
  let bb: DOMRect | null = null
  canvas.addEventListener(
    'wheel',
    (wheelFn = ev => {
      ev.preventDefault()

      let x = 0
      let y = 0
      let scale = 1

      if (ev.deltaMode === ev.DOM_DELTA_PIXEL) {
        if (ev.ctrlKey || ev.metaKey) {
          bb = bb || canvas.getBoundingClientRect()

          clearTimeout(timer)
          timer = setTimeout(() => (bb = null), 500)

          // zoom
          let { x, y } = el.global2local(ev.clientX - bb.x, ev.clientY - bb.y)
          setAnchor(el, x, y)

          el.scale = scale = el.scale * Math.pow(0.98, ev.deltaY)
        } else {
          x = -ev.deltaX
          y = -ev.deltaY

          const pt = el.parent ? el.parent.global2local(x, y) : { x, y }

          el.x += pt.x
          el.y += pt.y
        }

        onChange?.(x, y, scale)
      }
    })
  )

  return () => {
    window.removeEventListener('wheel', wheelFn)
  }
}

// 读取上传文件
export function getFileDataURL(file: File) {
  return new Promise((r, j) => {
    const reader = new FileReader()
    reader.onload = (ev: any) => r(ev.target.result)
    reader.onerror = j
    reader.readAsDataURL(file)
  })
}
