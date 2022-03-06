import { ActionTypes } from './constant'

type ActionItem = {
  type: ActionTypes
  args?: any
}

export interface StrokeStyle {
  color?: string
  lineWidth?: number
  cap?: 'butt' | 'round' | 'square'
  join?: 'bevel' | 'round' | 'miter'
  miterLimit?: number
}

export interface TextStyle {
  font?: string
  baseline?:
    | 'top'
    | 'hanging'
    | 'middle'
    | 'alphabetic'
    | 'ideographic'
    | 'bottom'
  textAlign?: 'left' | 'right' | 'center' | 'start' | 'end'
}

export interface ILinearGradient {
  colors: string[]
  ratios: number[]
  x0: number
  y0: number
  x1: number
  y1: number
}
export interface IRadialGradient {
  colors: string[]
  ratios: number[]
  x0: number
  y0: number
  r0: number
  x1: number
  y1: number
  r1: number
}

export interface IShadow {
  shadowColor: string
  shadowOffsetX?: number
  shadowOffsetY?: number
  shadowBlur?: number
}

export default class Graphics {
  public actions: ActionItem[] = []

  private addAction(type: ActionTypes, args?: any) {
    this.actions.push({ type, args })
    return this
  }

  beginPath() {
    return this.addAction(ActionTypes.beginPath)
  }

  moveTo(x: number, y: number) {
    return this.addAction(ActionTypes.moveTo, [x, y])
  }

  lineTo(x: number, y: number) {
    return this.addAction(ActionTypes.lineTo, [x, y])
  }

  bezierCurveTo(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number
  ) {
    return this.addAction(ActionTypes.bezierCurveTo, [x1, y1, x2, y2, x3, y3])
  }
  quadraticCurveTo(x1: number, y1: number, x2: number, y2: number) {
    return this.addAction(ActionTypes.quadraticCurveTo, [x1, y1, x2, y2])
  }

  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    anticlockwise = false
  ) {
    return this.addAction(ActionTypes.arc, [
      x,
      y,
      radius,
      startAngle,
      endAngle,
      anticlockwise,
    ])
  }

  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number) {
    return this.addAction(ActionTypes.arcTo, [x1, y1, x2, y2, radius])
  }

  rect(x: number, y: number, width: number, height: number) {
    return this.addAction(ActionTypes.rect, [x, y, width, height])
  }

  closePath() {
    return this.addAction(ActionTypes.closePath)
  }

  // lineStyle
  // 设置描边宽度,颜色,端点,导角
  setStrokeStyle(args: StrokeStyle) {
    return this.addAction(ActionTypes.setStrokeStyle, args)
  }

  setStrokeDash(segments: [number, number], offset: number = 0) {
    return this.addAction(ActionTypes.setStrokeDash, [segments, offset])
  }

  setFillStyle(color: string) {
    return this.addAction(ActionTypes.setFillStyle, [color])
  }

  stroke() {
    return this.addAction(ActionTypes.stroke)
  }

  fill(windingRule?: 'nonzero' | 'evenodd') {
    return this.addAction(ActionTypes.fill, windingRule)
  }

  drawImage(image: CanvasImageSource, dx: number, dy: number): this
  drawImage(
    image: CanvasImageSource,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ): this
  drawImage(
    image: CanvasImageSource,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ): void
  drawImage(...args: any[]): this {
    return this.addAction(ActionTypes.drawImage, args)
  }
  clear() {
    this.actions.length = 0
    return this
  }

  // 字体相关
  setTextStyle(args: TextStyle) {
    return this.addAction(ActionTypes.setTextStyle, args)
  }

  strokeText(text: string, x: number, y: number, maxWidth?: number) {
    return this.addAction(ActionTypes.strokeText, [text, x, y, maxWidth])
  }

  fillText(text: string, x = 0, y = 0, maxWidth?: number) {
    return this.addAction(ActionTypes.fillText, [text, x, y, maxWidth])
  }
  // 渐变
  createLinearGradientStroke(
    colors: string[],
    ratios: number[],
    x0: number,
    y0: number,
    x1: number,
    y1: number
  ) {
    return this.addAction(ActionTypes.createLinearGradientStroke, [
      colors,
      ratios,
      x0,
      y0,
      x1,
      y1,
    ])
  }

  createLinearGradientFill(
    colors: string[],
    ratios: number[],
    x0: number,
    y0: number,
    x1: number,
    y1: number
  ) {
    return this.addAction(ActionTypes.createLinearGradientFill, [
      colors,
      ratios,
      x0,
      y0,
      x1,
      y1,
    ])
  }
  createRadialGradientFill(
    colors: string[],
    ratios: number[],
    x0: number,
    y0: number,
    r0: number,
    x1: number,
    y1: number,
    r1: number
  ) {
    return this.addAction(ActionTypes.createRadialGradientFill, [
      colors,
      ratios,
      x0,
      y0,
      r0,
      x1,
      y1,
      r1,
    ])
  }
  createRadialGradientStroke(
    colors: string[],
    ratios: number[],
    x0: number,
    y0: number,
    r0: number,
    x1: number,
    y1: number,
    r1: number
  ) {
    return this.addAction(ActionTypes.createRadialGradientStroke, [
      colors,
      ratios,
      x0,
      y0,
      r0,
      x1,
      y1,
      r1,
    ])
  }

  // 设置阴影
  setShadow(opt: IShadow) {
    return this.addAction(ActionTypes.setShadow, opt)
  }

  // 状态保存,重置
  save() {
    return this.addAction(ActionTypes.save)
  }
  restore() {
    return this.addAction(ActionTypes.restore)
  }
}
