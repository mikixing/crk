import { EventEmitter } from 'events'
import Matrix, { deg2rad } from './lib/Matrix'
import { SyntheticEvent } from './lib/SyntheticEvent'

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
  public scaleX: number
  public scaleY: number
  public scale = 1
  public rotation = 0
  public skewX = 0
  public skewY = 0
  public alpha = 1
  public visible = true
  public transformMatrix: any
  public parent: Element | null
  public ignoreEvent = false

  // private boundingBox: Rectangle

  protected abstract doUpdate(ctx: CanvasRenderingContext2D): void

  setTransform(ctx: CanvasRenderingContext2D) {
    const {
      x = 0,
      y = 0,
      rotation = 0,
      transformMatrix,
      scale = 1,
      regX = 0,
      regY = 0,
      alpha = 1,
      skewX = 0,
      skewY = 0,
    } = this

    const scaleX = this.scaleX ?? scale
    const scaleY = this.scaleY ?? scale

    ctx.globalAlpha *= alpha

    const mat =
      transformMatrix ||
      new Matrix()
        .translate(x, y)
        .skew(skewX * deg2rad, skewY * deg2rad)
        .rotate(rotation * deg2rad)
        .scale(scaleX, scaleY)
        .translate(-regX, -regY)

    const { a, b, c, d, e, f } = mat
    ctx.transform(a, b, c, d, e, f)
  }

  set(opt?: Partial<Transform & { alpha: number; visible: boolean }>) {
    opt && Object.assign(this, opt)
  }

  // setBoundingBox(
  //   x: number,
  //   y: number,
  //   width: number,
  //   height: number
  // ): Rectangle {
  //   this.boundingBox = { x, y, width, height }
  //   return this.boundingBox
  // }

  // getBoundingBox(): Rectangle | null | undefined {
  //   return this.boundingBox
  // }

  getMatrix() {
    return (
      this.transformMatrix ||
      new Matrix()
        .translate(this.x, this.y)
        .skew(this.skewX, this.skewY)
        .rotate(this.rotation)
        .scale(this.scaleX ?? this.scale, this.scaleY ?? this.scale)
        .translate(-this.regX, -this.regY)
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
    return mat.transformPoint(x, y)
  }

  public local2local(el: Element, x: number, y: number) {
    const p = this.local2global(x, y)
    return el.global2local(p.x, p.y)
  }
}
