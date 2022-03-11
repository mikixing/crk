import Element from './element'
import Group from './group'
import Stage from './stage'
import Graphics from './graphics'

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

export default class Shape extends Element {
  public graphics: Graphics
  public parent: Group | Stage = null

  private _eventRect: Rectangle = null

  constructor(g?: Graphics) {
    super()
    this.graphics = g || new Graphics()
  }

  public get eventRect(): Rectangle | null {
    return this._eventRect || null
  }

  public setEventRect(
    x: number,
    y: number,
    width: number,
    height: number
  ): Rectangle {
    this._eventRect = { x, y, width, height }
    return this._eventRect
  }

  public doUpdate(ctx: CanvasRenderingContext2D) {
    let { graphics, visible, mask } = this
    if (!visible || graphics.isEmpty) return

    if (this.cacheData && !this.cacheData.notCacheCanvas)
      return this.applyCache(ctx)

    ctx.save()
    if (mask) {
      const mat = mask.setTransform(ctx)
      mask.use(ctx)
      ctx.clip()

      const { a, b, c, d, e, f } = mat.invert()
      ctx.transform(a, b, c, d, e, f) // reset transform to the last state
    }

    this.setTransform(ctx)
    graphics.use(ctx)

    ctx.restore()
  }
}
