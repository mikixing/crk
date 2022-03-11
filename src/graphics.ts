import { ActionTypes, ActionKeyMap, NativeMethodTypes } from './constant'

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

  public get isEmpty() {
    return this.actions.length === 0
  }

  private addAction(type: ActionTypes, args?: any) {
    this.actions.push({ type, args })
    return this
  }

  public beginPath() {
    return this.addAction(ActionTypes.beginPath)
  }

  public moveTo(x: number, y: number) {
    return this.addAction(ActionTypes.moveTo, [x, y])
  }

  public lineTo(x: number, y: number) {
    return this.addAction(ActionTypes.lineTo, [x, y])
  }

  public bezierCurveTo(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number
  ) {
    return this.addAction(ActionTypes.bezierCurveTo, [x1, y1, x2, y2, x3, y3])
  }

  public quadraticCurveTo(x1: number, y1: number, x2: number, y2: number) {
    return this.addAction(ActionTypes.quadraticCurveTo, [x1, y1, x2, y2])
  }

  public arc(
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

  public arcTo(x1: number, y1: number, x2: number, y2: number, radius: number) {
    return this.addAction(ActionTypes.arcTo, [x1, y1, x2, y2, radius])
  }

  public rect(x: number, y: number, width: number, height: number) {
    return this.addAction(ActionTypes.rect, [x, y, width, height])
  }

  public closePath() {
    return this.addAction(ActionTypes.closePath)
  }

  // lineStyle
  // 设置描边宽度,颜色,端点,导角
  public setStrokeStyle(args: StrokeStyle) {
    return this.addAction(ActionTypes.setStrokeStyle, args)
  }

  public setStrokeDash(segments: [number, number], offset: number = 0) {
    return this.addAction(ActionTypes.setStrokeDash, [segments, offset])
  }

  public setFillStyle(color: string) {
    return this.addAction(ActionTypes.setFillStyle, [color])
  }

  public stroke() {
    return this.addAction(ActionTypes.stroke)
  }

  public fill(windingRule?: 'nonzero' | 'evenodd') {
    return this.addAction(ActionTypes.fill, windingRule)
  }

  public drawImage(image: CanvasImageSource, dx: number, dy: number): this
  public drawImage(
    image: CanvasImageSource,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ): this
  public drawImage(
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
  public drawImage(...args: any[]): this {
    return this.addAction(ActionTypes.drawImage, args)
  }

  public clear() {
    this.actions.length = 0
    return this
  }

  // 字体相关
  public setTextStyle(args: TextStyle) {
    return this.addAction(ActionTypes.setTextStyle, args)
  }

  public strokeText(text: string, x = 0, y = 0, maxWidth?: number) {
    return this.addAction(ActionTypes.strokeText, [text, x, y, maxWidth])
  }

  public fillText(text: string, x = 0, y = 0, maxWidth?: number) {
    return this.addAction(ActionTypes.fillText, [text, x, y, maxWidth])
  }

  // 渐变
  public createLinearGradientStroke(
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

  public createLinearGradientFill(
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

  public createRadialGradientFill(
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

  public createRadialGradientStroke(
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
  public setShadow(opt: IShadow) {
    return this.addAction(ActionTypes.setShadow, opt)
  }

  // 状态保存,重置
  public save() {
    return this.addAction(ActionTypes.save)
  }

  public restore() {
    return this.addAction(ActionTypes.restore)
  }

  public use(ctx: CanvasRenderingContext2D) {
    ctx.beginPath()

    const { actions } = this

    let statusCount = 0

    for (let k = 0; k < actions.length; k++) {
      let action = actions[k]
      let { type, args } = action

      switch (type) {
        case ActionTypes.setStrokeStyle: {
          const {
            color = '#000',
            lineWidth = 1,
            cap = 'butt',
            join = 'miter',
            miterLimit = 10,
          } = (args ?? {}) as StrokeStyle

          ctx.strokeStyle = color

          if (lineWidth) {
            ctx.lineWidth = lineWidth
            ctx.lineCap = cap
            ctx.lineJoin = join
            ctx.miterLimit = miterLimit
          }

          break
        }
        case ActionTypes.setFillStyle: {
          ctx.fillStyle = args[0]
          break
        }

        case ActionTypes.setStrokeDash: {
          const [segments, offset] = args as [[number, number], number]

          ctx.setLineDash(segments)
          ctx.lineDashOffset = offset
          break
        }

        case ActionTypes.drawImage: {
          ctx.drawImage(
            ...(args as [image: CanvasImageSource, dx: number, dy: number])
          )

          break
        }

        case ActionTypes.setTextStyle: {
          const { font, baseline, textAlign } = args as TextStyle

          font && (ctx.font = font)
          baseline && (ctx.textBaseline = baseline)
          textAlign && (ctx.textAlign = textAlign)

          break
        }

        case ActionTypes.createLinearGradientFill: {
          const { colors, ratios, x0, y0, x1, y1 } = args as ILinearGradient
          const gradient = ctx.createLinearGradient(x0, y0, x1, y1)
          ratios.forEach((ratio, index) => {
            gradient.addColorStop(ratio, colors[index])
          })
          ctx.fillStyle = gradient

          break
        }
        case ActionTypes.createLinearGradientStroke: {
          const { colors, ratios, x0, y0, x1, y1 } = args as ILinearGradient
          const gradient = ctx.createLinearGradient(x0, y0, x1, y1)
          ratios.forEach((ratio, index) => {
            gradient.addColorStop(ratio, colors[index])
          })
          ctx.strokeStyle = gradient

          break
        }
        case ActionTypes.createLinearGradientFill: {
          const { colors, ratios, x0, y0, r0, x1, y1, r1 } =
            args as IRadialGradient
          const gradient = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1)
          ratios.forEach((ratio, index) => {
            gradient.addColorStop(ratio, colors[index])
          })
          ctx.fillStyle = gradient

          break
        }
        case ActionTypes.createRadialGradientStroke: {
          const { colors, ratios, x0, y0, r0, x1, y1, r1 } =
            args as IRadialGradient
          const gradient = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1)
          ratios.forEach((ratio, index) => {
            gradient.addColorStop(ratio, colors[index])
          })
          ctx.strokeStyle = gradient

          break
        }

        case ActionTypes.setShadow: {
          const { shadowColor, shadowOffsetX, shadowOffsetY, shadowBlur } =
            args as IShadow
          shadowColor && (ctx.shadowColor = shadowColor)
          shadowOffsetX && (ctx.shadowOffsetX = shadowOffsetX)
          shadowOffsetY && (ctx.shadowOffsetY = shadowOffsetY)
          shadowBlur && (ctx.shadowBlur = shadowBlur)
          break
        }

        case ActionTypes.save: {
          statusCount++
          ctx.save()
          break
        }
        case ActionTypes.restore: {
          statusCount--
          this.assertStatus(statusCount < 0)

          ctx.restore()
          break
        }

        default: {
          const method = ActionKeyMap[type] as NativeMethodTypes

          const fn = ctx[method]
          args ? fn?.call(ctx, ...args) : fn?.call(ctx)
        }
      }
    }

    this.assertStatus(statusCount !== 0)
  }

  private assertStatus(flag: boolean) {
    if (flag)
      throw new Error(`make sure 'save()' and 'restore()' appear in pairs!`)
  }
}
