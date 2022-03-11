import { Transform } from 'stream'
import Graphics from './graphics'
import { getMatrix } from './lib'

export default class Mask extends Graphics {
  public x = 0
  public y = 0
  public regX = 0
  public regY = 0
  public scale = 1
  public rotation = 0 // 角度
  public skewX = 0
  public skewY = 0
  public alpha = 1

  private _scaleX: number
  private _scaleY: number

  public getMatrix() {
    return getMatrix(this)
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

  public setTransform(ctx: CanvasRenderingContext2D) {
    const matrix = this.getMatrix()
    const { a, b, c, d, e, f } = matrix
    ctx.transform(a, b, c, d, e, f)
    return matrix
  }

  public set(opt?: Partial<Transform & { alpha: number; visible: boolean }>) {
    opt && Object.assign(this, opt)
    return this
  }
}
