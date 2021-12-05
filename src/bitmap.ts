import Element from './element'
import Shape from './shape'
import Group from './group'
import Stage from './stage'

type ImageSource = HTMLImageElement | HTMLCanvasElement

interface ImageLoc {
  sx: number
  sy: number
  sw: number
  sh: number
  dx: number
  dy: number
  dw: number
  dh: number
}

export default class Bitmap extends Shape {
  public source: ImageSource

  constructor(
    image: ImageSource,
    sx?: number,
    sy?: number,
    sw?: number,
    sh?: number,
    dx?: number,
    dy?: number,
    dw?: number,
    dh?: number
  ) {
    super()

    let len = arguments.length
    if (len <= 3) {
      this.setImage(image, sx ?? 0, sy ?? 0)
    } else if (len <= 5) {
      this.setImage(image, sx ?? 0, sy ?? 0, sw ?? 0, sh ?? 0)
    } else {
      this.setImage(
        image,
        sx ?? 0,
        sy ?? 0,
        sw ?? 0,
        sh ?? 0,
        dx ?? 0,
        dy ?? 0,
        dw ?? 0,
        dh ?? 0
      )
    }
  }

  setImage(image: ImageSource, dx: number, dy: number): void
  setImage(
    image: ImageSource,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ): void
  setImage(
    image: ImageSource,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ): void
  setImage(image: ImageSource, ...args: number[]) {
    this.source = image
    this.graphics.clear().drawImage.call(this.graphics, image, ...args)
  }
}
