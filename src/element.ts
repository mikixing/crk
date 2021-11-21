import { EventEmitter } from 'events'

export interface IAccumulator {
  x: number
  y: number
  regX: number
  regY: number
  scaleX: number
  scaleY: number
  rotation: number
  alpha: number
  visible: boolean
}

export default abstract class Element extends EventEmitter {
  public x = 0
  public y = 0
  public regX = 0
  public regY = 0
  public scaleX = 1
  public scaleY = 1
  public rotation = 0
  public alpha = 1
  public visible = true
  public transformMatrix: any

  protected abstract doUpdate(ctx: CanvasRenderingContext2D): void

  setTransform(ctx: CanvasRenderingContext2D) {
    const { x, y, scaleX, scaleY, rotation, transformMatrix, regX, regY } = this

    if (transformMatrix) {
      const { a, b, c, d, e, f } = transformMatrix
      ctx.transform(a, b, c, d, e, f)
    } else {
      ctx.translate(x, y)
      ctx.scale(scaleX, scaleY)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.translate(-regX, -regY)
    }
  }
  scale(x: number, y: number) {
    this.scaleX = x
    this.scaleY = y
  }
}
