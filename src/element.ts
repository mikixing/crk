import { EventEmitter } from 'events'
import Matrix, { deg2rad } from './lib/Matrix'
import { SyntheticEvent } from './lib/SyntheticEvent'
import { TCursor } from './constant/index'
import { Shape, Stage } from '.'

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
  public rotation = 0 // 角度
  public skewX = 0
  public skewY = 0
  public alpha = 1
  public visible = true
  public transformMatrix: any
  public parent: Element | null
  public ignoreEvent = false
  public rect?: { x: number; y: number; width: number; height: number }
  public cursor: TCursor | string = 'default'

  private _scaleX: number
  private _scaleY: number
  private _attrMap = {} as Record<string, boolean>

  protected cacheData: CacheData = null

  protected abstract doUpdate(ctx: CanvasRenderingContext2D): void

  public get root() {
    let el = this as Element
    while (el.parent && (el = el.parent));
    return el
  }

  public get stage(): Stage {
    const root = this.root
    return root instanceof Stage ? root : null
  }

  public get scaleX() {
    return this._scaleX ?? this.scale
  }

  public set scaleX(v) {
    this._scaleX = v
  }

  public get scaleY() {
    return this._scaleY ?? this.scale
  }

  public set scaleY(v) {
    this._scaleY = v
  }

  public get attrMap() {
    return this._attrMap
  }

  public setTransform(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha *= this.alpha
    const { a, b, c, d, e, f } = this.getMatrix()
    ctx.transform(a, b, c, d, e, f)
  }

  public set(opt?: Partial<Transform & { alpha: number; visible: boolean }>) {
    opt && Object.assign(this, opt)
  }

  public cache(x: number, y: number, width: number, height: number, dpr = 1) {
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

  public updateCache() {
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

  public getMatrix() {
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

  public addAttr(...names: string[]) {
    names.forEach(name => {
      this._attrMap[name] = true
    })
  }

  public removeAttr(...names: string[]) {
    names.forEach(name => {
      delete this._attrMap[name]
    })
  }

  public hasAttr(name: string) {
    const names = name?.trim().split(/\s+/) ?? []
    return names.some(name => name in this._attrMap)
  }

  public delegate(
    type: string,
    attr: string,
    fn: (ev: SyntheticEvent) => void
  ) {
    let handler: (...args: any[]) => void
    this.on(
      type,
      (handler = (ev: SyntheticEvent) => {
        let el = ev.target
        const currentTarget = ev.currentTarget
        do {
          if (el.hasAttr(attr)) {
            ev.currentTarget = el
            fn.call(el, ev)
          }
        } while ((el = el.parent) && el !== this)
        ev.currentTarget = currentTarget
      })
    )

    return () => this.removeListener(type, handler)
  }
}
