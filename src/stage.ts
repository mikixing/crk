import Group from './group'
import Shape from './shape'
import {
  ClickEvent,
  DblClickEvent,
  MouseOverEvent,
  MouseOutEvent,
  PressdownEvent,
  PressMoveEvent,
  PressUpEvent,
  MouseEnterEvent,
  MouseLeaveEvent,
  RolloutEvent,
  RolloverEvent,
  SyntheticEvent,
} from './lib/SyntheticEvent'

enum STATE {
  'IDLE',
  'PRESS_DOWN',
  'PRESS_MOVE',
}

export default class Stage extends Group {
  public ctx: CanvasRenderingContext2D
  public offCtx = document.createElement('canvas').getContext('2d') // offline ctx

  public mouseMoveOutside = true

  private domStyle: CSSStyleDeclaration

  private state: STATE = STATE.IDLE
  private mousemoveDomEvent: MouseEvent = null
  private hasPressEvent = false

  constructor(
    canvas: HTMLCanvasElement,
    opt?: {
      bindEvent?: boolean
      mouseMoveOutside?: boolean
    }
  ) {
    super()

    const { bindEvent = true, mouseMoveOutside = true } = opt ?? {}
    this.mouseMoveOutside = mouseMoveOutside
    this.setCanvas(canvas, opt)
    this.offCtx.canvas.width = 1
    this.offCtx.canvas.height = 1
  }

  public get canvas() {
    return this.ctx?.canvas
  }

  public setCanvas(
    canvas: HTMLCanvasElement,
    opt?: {
      bindEvent?: boolean
      mouseMoveOutside?: boolean
    }
  ) {
    if (canvas === this.canvas) return

    if (!(canvas instanceof HTMLCanvasElement) || !canvas)
      throw TypeError('canvas must be a HTMLCanvasElement!')

    this.ctx = canvas.getContext('2d')
    this.domStyle = getComputedStyle(this.canvas)

    const { bindEvent = true } = opt ?? {}
    bindEvent && this.bindEvent()
  }

  public clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  public update() {
    this.clearCanvas()
    this.doUpdate(this.ctx)
  }

  private getParentMap(el: Shape | Group | null) {
    const map = {} as Record<string, Group>
    el = el?.parent
    while (el) {
      map[el.uuid] = el
      el = el.parent
    }

    return map
  }
  private trigger(ev: SyntheticEvent) {
    let cursor = 'default'
    do {
      const { currentTarget } = ev
      currentTarget.emit(ev.type, ev)
      if (cursor === 'default' && ev.type === 'mouseover') {
        cursor = currentTarget.cursor
        this.canvas.style.cursor = cursor
      }
      if (ev.type === 'mouseout') {
        cursor = 'default'
        this.canvas.style.cursor = cursor
      }
      if (!ev.bubble) return
    } while ((ev.currentTarget = ev.currentTarget.parent))
  }

  private rollTrigger(ev: SyntheticEvent, lastShape: Shape | null) {
    // ??????lastShape???parent
    let map = this.getParentMap(lastShape)
    do {
      const { currentTarget } = ev
      currentTarget.emit(ev.type, ev)
      if (!ev.bubble) return
    } while (
      (ev.currentTarget = ev.currentTarget.parent) &&
      !map[ev.currentTarget.uuid]
    )
  }

  // ????????????
  getHitItem(x: number, y: number) {
    if (this.ignoreEvent || !this.visible) return
    const { offCtx, children } = this

    const xx = -x
    const yy = -y
    offCtx.save()
    offCtx.clearRect(0, 0, 1, 1)
    offCtx.translate(xx, yy)
    this.setTransform(offCtx)
    const el = this.hit(children, x, y)
    offCtx.restore()

    // ????????????
    // offCanvas.width = offCanvas.height = 1000
    // offCanvas.style.width = '500px'
    // offCanvas.style.height = '500px'
    // document.body.appendChild(offCanvas)
    // offCanvas.style.border = '1px solid red'
    // offCtx.fillStyle = 'red'
    // offCtx.arc(x, y, 20, 0, Math.PI * 2)
    // offCtx.fill()

    return el
  }

  // ????????????,????????????
  private hit(
    tree: (Group | Shape)[],
    clickX?: number,
    clickY?: number
  ): Group | Shape | null {
    for (let i = tree.length - 1; i >= 0; i--) {
      let item = tree[i]
      if (item.ignoreEvent) continue
      let res = null

      if (item instanceof Group) {
        this.offCtx.save()
        item.setTransform(this.offCtx)
        res = this.hit(item.children, clickX, clickY)
        this.offCtx.restore()
      } else if (item instanceof Shape) {
        const { eventRect } = item

        if (eventRect) {
          const { x, y, width, height } = eventRect
          const clickPoint = item.global2local(clickX, clickY)

          if (
            x <= clickPoint.x &&
            x + width >= clickPoint.x &&
            y <= clickPoint.y &&
            y + height >= clickPoint.y
          ) {
            return item
          } else {
            continue
          }
        }

        // ??????shape
        if (item.alpha === 0) continue
        item.doUpdate(this.offCtx)

        let colors = this.offCtx.getImageData(0, 0, 1, 1).data
        if (colors[3]) {
          res = item
        }
      }

      if (res) {
        return res
      }
    }
  }

  public getMouseCoordinateOnCanvas(ev: MouseEvent) {
    // ??????????????????????????????
    const { top, left } = this.canvas.getBoundingClientRect()
    const x = ev.clientX - left - parseInt(this.domStyle.paddingLeft)
    const y = ev.clientY - top - parseInt(this.domStyle.paddingTop)

    return { x, y }
  }

  public enableMouseOver(millisecond = 10) {
    let timer: NodeJS.Timeout
    let hoverTarget: Shape | Group = null
    this.canvas.addEventListener('mouseover', (ev: MouseEvent) => {
      let isInit = true
      timer = setInterval(() => {
        if (!isInit) {
          ev = this.mousemoveDomEvent
        }
        isInit = false
        if (!ev) return
        if (this.hasPressEvent) return
        const { x, y } = this.getMouseCoordinateOnCanvas(ev)
        let target = this.getHitItem(x, y)

        if (target !== hoverTarget) {
          if (hoverTarget) {
            this.trigger(
              new MouseOutEvent(ev, {
                x,
                y,
                currentTarget: hoverTarget,
                target: hoverTarget,
              })
            )
            this.rollTrigger(
              new RolloutEvent(ev, {
                x,
                y,
                currentTarget: hoverTarget,
                target: hoverTarget,
              }),
              target as Shape
            )
          }
          if (target) {
            this.trigger(
              new MouseOverEvent(ev, {
                x,
                y,
                currentTarget: target,
                target,
              })
            )
            this.rollTrigger(
              new RolloverEvent(ev, {
                x,
                y,
                currentTarget: target,
                target,
              }),
              hoverTarget as Shape
            )
          }
        }
        hoverTarget = target
      }, millisecond)
    })

    if (millisecond === 0) {
      clearInterval(timer)
      hoverTarget = null
    }

    let mouseoutFn: (ev: MouseEvent) => void
    this.canvas.addEventListener(
      'mouseout',
      (mouseoutFn = (ev: MouseEvent) => {
        this.canvas.removeEventListener('mouseout', mouseoutFn)
        clearInterval(timer)

        const { x, y } = this.getMouseCoordinateOnCanvas(ev)
        if (hoverTarget) {
          this.trigger(
            new MouseOutEvent(ev, {
              x,
              y,
              currentTarget: hoverTarget,
              target: hoverTarget,
            })
          )
          this.rollTrigger(
            new RolloutEvent(ev, {
              x,
              y,
              currentTarget: hoverTarget,
              target: hoverTarget,
            }),
            null
          )
        }
        hoverTarget = null
      })
    )
  }

  private bindEvent() {
    let clickTarget: Shape | Group = null
    let pressTarget: Shape | Group = null
    // ??????????????????
    this.canvas.addEventListener('contextmenu', (ev: MouseEvent) => {
      clickTarget = null
      pressTarget = null
    })
    // click??????
    this.canvas.addEventListener('click', (ev: MouseEvent) => {
      const { x, y } = this.getMouseCoordinateOnCanvas(ev)

      const target = this.getHitItem(x, y)
      if (target && clickTarget) {
        clickTarget = null
        this.trigger(
          new ClickEvent(ev, {
            x,
            y,
            currentTarget: target,
            target,
          })
        )
      }
    })

    // dblclick??????
    this.canvas.addEventListener('dblclick', (ev: MouseEvent) => {
      const { x, y } = this.getMouseCoordinateOnCanvas(ev)

      const target = this.getHitItem(x, y)
      if (target) {
        this.trigger(
          new DblClickEvent(ev, {
            x,
            y,
            currentTarget: target,
            target,
          })
        )
      }
    })

    // mousedown??????
    this.canvas.addEventListener('mousedown', (ev: MouseEvent) => {
      const { x, y } = this.getMouseCoordinateOnCanvas(ev)

      const target = this.getHitItem(x, y)
      if (target) {
        this.hasPressEvent = true
        this.trigger(
          new PressdownEvent(ev, {
            x,
            y,
            currentTarget: target,
            target,
          })
        )
        pressTarget = target
        clickTarget = target
        this.state = STATE.PRESS_DOWN
      }
    })

    // pressmove??????
    document.addEventListener('mousemove', (ev: MouseEvent) => {
      if (!this.mouseMoveOutside && ev.target !== this.canvas) return

      const { x, y } = this.getMouseCoordinateOnCanvas(ev)
      if (
        pressTarget &&
        (this.state === STATE.PRESS_DOWN || this.state === STATE.PRESS_MOVE)
      ) {
        this.state = STATE.PRESS_MOVE
        this.trigger(
          new PressMoveEvent(ev, {
            x,
            y,
            currentTarget: pressTarget,
            target: pressTarget,
          })
        )
      }
      this.mousemoveDomEvent = ev
    })

    document.addEventListener('mouseup', (ev: MouseEvent) => {
      if (!this.mouseMoveOutside && ev.target !== this.canvas) return

      const { x, y } = this.getMouseCoordinateOnCanvas(ev)

      if (pressTarget) {
        this.hasPressEvent = false
        this.trigger(
          new PressUpEvent(ev, {
            x,
            y,
            currentTarget: pressTarget,
            target: pressTarget,
          })
        )
        pressTarget = null
        this.state = STATE.IDLE
      }
      if (clickTarget) {
        this.trigger(
          new ClickEvent(ev, {
            x,
            y,
            currentTarget: clickTarget,
            target: clickTarget,
          })
        )
        clickTarget = null
      }
    })

    // mouseenter,mouseleave????????????stage
    // mouseenter
    this.canvas.addEventListener('mouseenter', (ev: MouseEvent) => {
      const { x, y } = this.getMouseCoordinateOnCanvas(ev)

      this.trigger(
        new MouseEnterEvent(ev, {
          x,
          y,
          currentTarget: this,
          target: this,
        })
      )
    })

    // mouseleave
    this.canvas.addEventListener('mouseleave', (ev: MouseEvent) => {
      const { x, y } = this.getMouseCoordinateOnCanvas(ev)

      this.trigger(
        new MouseLeaveEvent(ev, {
          x,
          y,
          currentTarget: this,
          target: this,
        })
      )
    })
  }
}
