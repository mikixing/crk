import { EventEmitter } from 'events'
import { Stage } from '.'
import Matrix, { deg2rad } from './lib/Matrix'
import { SyntheticEvent } from './lib/SyntheticEvent'
import { TCursor } from './constant/index'

export interface Transform {
  x: number
  y: number
  regX: number
  regY: number
  scaleX: number
  scaleY: number
  scale: number
  rotation: number
  skewX: number
  skewY: number
}

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

export interface CacheData {
  x: number
  y: number
  width: number
  height: number
  dpr: number
  canvas: HTMLCanvasElement
  notCacheCanvas?: boolean
}

let count = 0
export default abstract class Element
  extends EventEmitter
  implements Transform
{
  public readonly uuid = ++count
  public x = 0
  public y = 0
  public regX = 0
  public regY = 0
  public scale = 1
  public rotation = 0
  public skewX = 0
  public skewY = 0
  public alpha = 1
  public visible = true
  public transformMatrix: any
  public parent: Element | null
  public ignoreEvent = false
  public rect?: { x: number; y: number; width: number; height: number }
  public cursor: TCursor = 'default'

  private _scaleX: number
  private _scaleY: number
  private _eventRect: Rectangle = null

  protected cacheData: CacheData = null

  protected abstract doUpdate(ctx: CanvasRenderingContext2D): void

  get scaleX() {
    return this._scaleX ?? this.scale
  }

  set scaleX(v) {
    this._scaleX = v
  }

  get scaleY() {
    return this._scaleY ?? this.scale
  }

  set scaleY(v) {
    this._scaleY = v
  }

  setTransform(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha *= this.alpha
    const { a, b, c, d, e, f } = this.getMatrix()
    ctx.transform(a, b, c, d, e, f)
  }

  set(opt?: Partial<Transform & { alpha: number; visible: boolean }>) {
    opt && Object.assign(this, opt)
  }

  setEventRect(x: number, y: number, width: number, height: number): Rectangle {
    this._eventRect = { x, y, width, height }
    return this._eventRect
  }

  getEventRect(): Rectangle | null | undefined {
    return this._eventRect
  }

  cache(x: number, y: number, width: number, height: number, dpr = 1) {
    const canvas = document.createElement('canvas')
    canvas.width = width * dpr
    canvas.height = height * dpr
    this.cacheData = {
      x,
      y,
      width,
      height,
      dpr,
      canvas,
    }
    this.updateCache()
  }
  updateCache() {
    if (!this.cacheData) throw new Error('please use cache() first!')
    const { canvas, x, y, width, height, dpr } = this.cacheData
    this.cacheData.notCacheCanvas = true
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, width * dpr, height * dpr)
    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.translate(-x, -y)
    this.doUpdate(ctx)
    ctx.restore()
    this.cacheData.notCacheCanvas = false
  }
  protected applyCache(ctx: CanvasRenderingContext2D) {
    const { canvas, x, y, width, height, dpr } = this.cacheData
    ctx.drawImage(canvas, 0, 0, width * dpr, height * dpr, x, y, width, height)
    // document.body.appendChild(canvas)
    return
  }

  getMatrix() {
    const {
      x = 0,
      y = 0,
      rotation = 0,
      transformMatrix,
      scaleX,
      scaleY,
      regX = 0,
      regY = 0,
      skewX = 0,
      skewY = 0,
    } = this

    return (
      transformMatrix ||
      new Matrix()
        .translate(x, y)
        .skew(skewX * deg2rad, skewY * deg2rad)
        .rotate(rotation * deg2rad)
        .scale(scaleX, scaleY)
        .translate(-regX, -regY)
    )
  }

  public getWorldMatrix() {
    let mat = new Matrix()
    let el = this as Element
    do {
      mat.prependMatrix(el.getMatrix())
    } while ((el = el.parent))

    return mat
  }

  public local2global(x: number, y: number) {
    let mat = this.getWorldMatrix()
    return mat.transformPoint(x, y)
  }

  public global2local(x: number, y: number) {
    let mat = this.getWorldMatrix().invert()
    let res = mat.transformPoint(x, y)
    return res
  }

  public local2local(el: Element, x: number, y: number) {
    const p = this.local2global(x, y)
    return el.global2local(p.x, p.y)
  }
}
