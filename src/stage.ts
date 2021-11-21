import Group from './group'

export default class Stage extends Group {
  public root = true
  public canvas: HTMLCanvasElement
  public ctx: CanvasRenderingContext2D

  constructor(canvas: HTMLCanvasElement) {
    super()

    if (!(canvas instanceof HTMLCanvasElement) || !canvas)
      throw TypeError('canvas must be a HTMLCanvasElement!')

    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
  }

  public clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  public update() {
    this.clearCanvas()
    this.doUpdate(this.ctx)
  }
}
