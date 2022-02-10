import Element from './element'
import Group from './group'
import Stage from './stage'
import Graphics, {
  StrokeStyle,
  TextStyle,
  ILinearGradient,
  IRadialGradient,
} from './graphics'
import { ActionTypes, ActionKeyMap, NativeMethodTypes } from './constant'

export default class Shape extends Element {
  public graphics: Graphics
  public parent: Group | Stage = null
  private gradientFill: any
  constructor(g?: Graphics) {
    super()
    this.graphics = g || new Graphics()
  }

  public doUpdate(ctx: CanvasRenderingContext2D) {
    if (this.graphics.actions.length === 0) return
    let { graphics: g, visible } = this
    let { actions } = g
    if (!visible) return
    if (this.cacheData && !this.cacheData.notCacheCanvas)
      return this.applyCache(ctx)
    let statusCount = 0

    ctx.save()
    this.setTransform(ctx)
    ctx.beginPath()

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

    ctx.restore()
  }

  private assertStatus(flag: boolean) {
    if (flag)
      throw new Error(`make sure 'save()' and 'restore()' appear in pairs!`)
  }
}
