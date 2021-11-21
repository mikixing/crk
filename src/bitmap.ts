import Element from './element'
import Shape from './shape'
import Group from './group'
import Stage from './stage'

export default class Bitmap extends Element {
  public parent: Group | Stage = null
  public source: HTMLImageElement | HTMLCanvasElement

  private shape = new Shape()

  constructor(
    img: HTMLImageElement | HTMLCanvasElement,
    x: number = 0,
    y: number = 0
  ) {
    super()
    this.setImage(img, x, y)
  }

  setImage(img: HTMLImageElement | HTMLCanvasElement, x = 0, y = 0) {
    this.source = img

    const g = this.shape.graphics
    g.clear()
    g.drawImage(img, x, y)
  }

  doUpdate(ctx: CanvasRenderingContext2D) {
    this.shape.doUpdate(ctx)
  }
}
