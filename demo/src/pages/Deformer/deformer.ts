import { EventEmitter } from 'events'
import { Group, Element, Shape, deg2rad, Matrix, rad2deg } from '@mikixing/crk'
import { dragable, Vector } from '../../util'

interface IOption {
  cvw?: number
  cvh?: number
  radius?: number
  color?: string
  fillColor?: string
  hoverAlpha?: number
  activeAlpha?: number
}

type TWatchEvent = 'create' | 'update' | 'active' | 'move' | 'dispose'

enum states {
  active,
  idle,
  hover,
}

export default class Deformer extends EventEmitter {
  public el: Element
  public state = states.idle

  private _disabled = false

  private width: number
  private height: number

  private panel = new Group()
  private toolGrp = new Group()
  private maskGrp = new Group()
  private container: Group

  private cvw: number = 10
  private cvh: number = 10
  private radius: number = 10
  private color: string = '#6cf'
  private fillColor: string = '#ffe'
  private hoverAlpha: number = 0.25
  private activeAlpha: number = 0.5

  private hasOpenHover: boolean = false

  private tikerUpdate: Function = () => {}

  private cvs = [
    { x: 0, y: 0, i: 4, fx: 1, fy: 1 },
    { x: 0.5, y: 0, i: 5, fx: 0, fy: 1 },
    { x: 1, y: 0, i: 6, fx: 1, fy: 1 },
    { x: 1, y: 0.5, i: 7, fx: 1, fy: 0 },
    { x: 1, y: 1, i: 0, fx: 1, fy: 1 },
    { x: 0.5, y: 1, i: 1, fx: 0, fy: 1 },
    { x: 0, y: 1, i: 2, fx: 1, fy: 1 },
    { x: 0, y: 0.5, i: 3, fx: 1, fy: 0 },
  ]
  private cvShapes: Shape[] = []
  private rotateBtn = new Shape()
  private bar = new Shape()
  private pivotShape = new Shape()

  constructor(
    el: Element,
    width: number,
    height: number,
    container: Group,
    opt = {} as IOption
  ) {
    super()
    this.el = el
    this.container = container
    this.width = width
    this.height = height
    // 标准化参数
    this.set(opt)

    this.panel.addChild(this.maskGrp, this.toolGrp)
    this.addPanel()
    this.rotateBtn = new Shape()
    this.bar = new Shape()

    this.hasOpenHover = false

    el.cursor = 'pointer'
    this.rotateBtn.cursor = 'pointer'

    this.create()
  }

  get disabled() {
    return this._disabled
  }
  set disabled(v: boolean) {
    if (this._disabled !== v) {
      if (!v) {
        this.removePanel()
      } else {
        this.addPanel()
        this.updateMask()
        this.updateTool()
        this.updateRotateBtn()
      }
    }
    this._disabled = v
  }

  private set(opt = {} as IOption) {
    this.cvw = opt.cvw ?? this.cvw // control vertex width
    this.cvh = opt.cvh ?? this.cvh
    this.radius = opt.radius ?? this.radius
    this.color = opt.color ?? this.color
    this.fillColor = opt.fillColor ?? this.fillColor
    this.hoverAlpha = opt.hoverAlpha ?? this.hoverAlpha
    this.activeAlpha = opt.activeAlpha ?? this.activeAlpha
  }

  private addPanel() {
    this.container.addChild(this.panel)
  }

  private removePanel() {
    this.container.removeChild(this.panel)
  }

  public create() {
    if (this.disabled) {
      return console.warn(
        'this deformer is disabled, you can enable this then try update it when using'
      )
    }

    this.setMask()
    this.setCv()
    this.setRotateBtn()
    // deformer创建完成
    this.emit('create')
    this.tikerUpdate && this.tikerUpdate()
  }

  public update(opt = {} as IOption) {
    if (this.disabled) {
      return console.warn(
        'this deformer is disabled, you can enable this then try update it when using'
      )
    }
    this.set(opt)
    const el = this.el
    this.updateMask()
    this.updateTool()
    this.updateRotateBtn()

    this.emit('update')
    this.tikerUpdate && this.tikerUpdate()
  }

  private setMask() {
    const { el } = this
    this.toggleHover(false)
    this.maskGrp.cursor = 'pointer'
    this.maskGrp.removeAllChildren()
    const mask = new Shape()
    this.maskGrp.addChild(mask)
    this.updateMask()

    el.on('mouseover', ev => {
      this.hasOpenHover && this.toggleHover()
      this.tikerUpdate && this.tikerUpdate()
    }).on('mouseout', ev => {
      if (this.state === states.active) return

      this.toggleHover(false)
      this.tikerUpdate && this.tikerUpdate()
    })

    dragable(el, {
      onPressdown: ev => {
        this.toggleActive()
        this.emit('active')
        this.tikerUpdate && this.tikerUpdate()
      },
      onPressmove: (ev, ox, oy, dx, dy) => {
        const x = (el.x = ox + dx)
        const y = (el.y = oy + dy)
        this.updateMask()
        this.updateTool()
        this.emit('move')
        this.tikerUpdate && this.tikerUpdate()

        return [x, y]
      },
    })

    mask.removeAllListeners()

    let sx: number // start x, start y
    let sy: number
    let p1 = {} as { x: number; y: number }

    dragable(mask, {
      onPressdown: ev => {
        sx = el.x
        sy = el.y
        p1 = (el.parent || el).global2local(ev.x, ev.y)
        this.toggleActive()

        this.tikerUpdate && this.tikerUpdate()
      },
      onPressmove: ev => {
        const p2 = (el.parent || el).global2local(ev.x, ev.y) // 鼠标位置在bmGrp中对应的坐标
        el.x = sx + p2.x - p1.x
        el.y = sy + p2.y - p1.y
        this.updateMask()
        this.updateTool()

        this.emit('move')
        this.tikerUpdate && this.tikerUpdate()

        return [mask.x, mask.y]
      },
    })
  }

  private setCv() {
    this.toolGrp.removeAllChildren()
    const { width, height, el } = this

    const { toolGrp, cvw, cvh } = this
    this.cvShapes = this.cvs.map((p, i) => {
      const x = p.x * width
      const y = p.y * height

      const cvShape = new Shape()
      toolGrp.addChild(cvShape)
      let pt = el.local2local(toolGrp, x, y)
      cvShape.regX = cvw / 2
      cvShape.regY = cvh / 2
      cvShape.x = pt.x
      cvShape.y = pt.y

      cvShape.graphics
        .setFillStyle(this.fillColor)
        .setStrokeStyle({ color: this.color })
        .rect(0, 0, cvw, cvh)
        .fill()
        .stroke()

      let sx: number, // scale x
        sy: number, // scale y
        signX: number,
        signY: number,
        elWorldMat: Matrix,
        pivot = { x: this.cvs[p.i].x * width, y: this.cvs[p.i].y * height }
      cvShape
        .removeAllListeners()
        .on('pressdown', ev => {
          this.setPivot(el as Shape, pivot.x, pivot.y)
          elWorldMat = el.getWorldMatrix().invert()
          sx = el.scaleX
          sy = el.scaleY

          const cp = elWorldMat.transformPoint(ev.x, ev.y)
          signX = Math.sign(cp.x - pivot.x)
          signY = Math.sign(cp.y - pivot.y)

          this.tikerUpdate && this.tikerUpdate()
        })
        .on('pressmove', (ev: any) => {
          const cp = elWorldMat.transformPoint(ev.x, ev.y)

          p.fx && (el.scaleX = (((cp.x - pivot.x) * signX) / width) * sx)
          p.fy && (el.scaleY = (((cp.y - pivot.y) * signY) / height) * sy)

          this.updateMask()
          this.updateTool()

          this.tikerUpdate && this.tikerUpdate()
        })

      switch (i) {
        case 0:
          cvShape.cursor = 'nwse-resize'
          break
        case 1:
          cvShape.cursor = 'ns-resize'
          break
        case 2:
          cvShape.cursor = 'nesw-resize'
          break
        case 3:
          cvShape.cursor = 'ew-resize'
          break
        case 4:
          cvShape.cursor = 'nwse-resize'
          break
        case 5:
          cvShape.cursor = 'ns-resize'
          break
        case 6:
          cvShape.cursor = 'nesw-resize'
          break
        case 7:
          cvShape.cursor = 'ew-resize'
          break
        default:
          cvShape.cursor = 'ns-resize'
      }

      return cvShape
    })
  }

  private setRotateBtn() {
    let { toolGrp, cvs, color, radius, rotateBtn, bar, pivotShape } = this
    const { width, height, el } = this

    let pivot = { x: cvs[1].x * width, y: cvs[1].y * height }
    let pt = el.local2local(toolGrp, pivot.x, pivot.y)
    let pt2 = el.local2local(toolGrp, width / 2, height / 2)
    let v = new Vector(pt.x, pt.y)
      .substract(new Vector(pt2.x, pt2.y))
      .normalize()
      .scale(40)
    toolGrp.addChild(rotateBtn)
    rotateBtn.graphics
      .clear()
      .setFillStyle(color)
      .arc(0, 0, radius, 0, Math.PI * 2)
      .fill()
    // 手柄
    const sr = radius - 4 // small radius
    const startRad = Math.PI * 1.25
    const endRad = Math.PI * 0.75
    const vv = new Vector(sr * Math.cos(endRad), sr * Math.sin(endRad))
    const vvnormal = vv.normalize()
    const p1 = vvnormal.scale(1.5).add(vv)
    const p2 = vvnormal
      .rotate(Math.PI / 2)
      .scale(2)
      .add(vv)
    const p3 = vvnormal.scale(-1.5).add(vv)
    rotateBtn.graphics
      .beginPath()
      .setStrokeStyle({ lineWidth: 2, color: '#ffe' })
      .arc(0, 0, sr, startRad, endRad)
      .stroke()
      .beginPath()
      .setFillStyle('#ffe')
      .setStrokeStyle({ color: '#ffe', lineWidth: 2 })
      .moveTo(p1.x, p1.y)
      .lineTo(p2.x, p2.y)
      .lineTo(p3.x, p3.y)
      .closePath()
      .stroke()
      .fill()

    rotateBtn.x = pt.x + v.x
    rotateBtn.y = pt.y + v.y

    bar.graphics
      .clear()
      .setStrokeStyle({ color })
      .moveTo(pt.x, pt.y)
      .lineTo(rotateBtn.x, rotateBtn.y)
      .stroke()
    toolGrp.addChild(bar)
    toolGrp.setChildIndex(bar, 0)

    const tmp = el.local2local(
      toolGrp,
      this.cvs[1].x * width,
      this.cvs[3].y * height
    )
    pivotShape.cursor = 'pointer'
    const pivotShapeRadius = 4
    const pivotShapeBar = 4
    pivotShape.graphics
      .clear()
      .arc(tmp.x, tmp.y, pivotShapeRadius, 0, Math.PI * 2)
      .moveTo(tmp.x + pivotShapeRadius, tmp.y)
      .lineTo(tmp.x + pivotShapeRadius + pivotShapeBar, tmp.y)
      .moveTo(tmp.x, tmp.y + pivotShapeRadius)
      .lineTo(tmp.x, tmp.y + pivotShapeRadius + pivotShapeBar)
      .moveTo(tmp.x - pivotShapeRadius, tmp.y)
      .lineTo(tmp.x - pivotShapeRadius - pivotShapeBar, tmp.y)
      .moveTo(tmp.x, tmp.y - pivotShapeRadius)
      .lineTo(tmp.x, tmp.y - pivotShapeRadius - pivotShapeBar)
      .setStrokeStyle({ color: '#222' })
      .stroke()
    toolGrp.addChild(pivotShape)

    let lv: Vector // start vector
    rotateBtn
      .removeAllListeners()
      .on('pressdown', (ev: any) => {
        ev.stopPropagation()

        this.setPivot(el as Shape | Group, width / 2, height / 2)
        const pt = (el.parent ?? el).global2local(ev.x, ev.y)
        lv = new Vector(pt.x, pt.y)
          .substract(new Vector(el.x, el.y))
          .normalize()

        this.tikerUpdate && this.tikerUpdate()
      })
      .on('pressmove', (ev: any) => {
        ev.stopPropagation()
        const pt = (el.parent ?? el).global2local(ev.x, ev.y)
        const v = new Vector(pt.x, pt.y)
          .substract(new Vector(el.x, el.y))
          .normalize()
        const theta = Math.asin(lv.cross(v))
        lv = v

        const angle = theta * rad2deg
        el.rotation += angle

        this.updateMask()
        this.updateTool()

        this.tikerUpdate && this.tikerUpdate()
      })
  }

  private updateMask() {
    const { width, height, el } = this
    const mask = this.maskGrp.children[0] as Shape
    // 顺时针方向
    const p1 = el.local2local(mask, 0, 0)
    const p2 = el.local2local(mask, width, 0)
    const p3 = el.local2local(mask, width, height)
    const p4 = el.local2local(mask, 0, height)

    mask.graphics
      .clear()
      .setFillStyle(this.color)
      .moveTo(p1.x, p1.y)
      .lineTo(p2.x, p2.y)
      .lineTo(p3.x, p3.y)
      .lineTo(p4.x, p4.y)
      .closePath()
      .fill()
  }

  private updateTool() {
    const { width, height, el } = this
    this.cvShapes.forEach((shape, index) => {
      const x = this.cvs[index].x * width
      const y = this.cvs[index].y * height
      let pt = el.local2local(this.toolGrp, x, y)
      shape.x = pt.x
      shape.y = pt.y
    })
    this.updateRotateBtn()
  }

  private updateRotateBtn() {
    const { el, radius, toolGrp, rotateBtn, bar, color, pivotShape } = this
    const { width, height } = this
    const pivot = { x: this.cvs[1].x * width, y: this.cvs[1].y * height }

    let pt = el.local2local(toolGrp, pivot.x, pivot.y)
    let pt2 = el.local2local(toolGrp, width / 2, height / 2)
    let v = new Vector(pt.x, pt.y)
      .substract(new Vector(pt2.x, pt2.y))
      .normalize()
      .scale(40)

    rotateBtn.graphics
      .clear()
      .setFillStyle(color)
      .arc(0, 0, radius, 0, Math.PI * 2)
      .fill()
    rotateBtn.x = pt.x + v.x
    rotateBtn.y = pt.y + v.y

    // 手柄
    const sr = radius - 4 // small radius
    const startRad = Math.PI * 1.25
    const endRad = Math.PI * 0.75
    const vv = new Vector(sr * Math.cos(endRad), sr * Math.sin(endRad))
    const vvnormal = vv.normalize()
    const p1 = vvnormal.scale(1.5).add(vv)
    const p2 = vvnormal
      .rotate(Math.PI / 2)
      .scale(2)
      .add(vv)
    const p3 = vvnormal.scale(-1.5).add(vv)
    rotateBtn.graphics
      .beginPath()
      .setStrokeStyle({ lineWidth: 2, color: '#ffe' })
      .arc(0, 0, sr, startRad, endRad)
      .stroke()
      .beginPath()
      .setFillStyle('#ffe')
      .setStrokeStyle({ color: '#ffe', lineWidth: 2 })
      .moveTo(p1.x, p1.y)
      .lineTo(p2.x, p2.y)
      .lineTo(p3.x, p3.y)
      .closePath()
      .stroke()
      .fill()

    bar.graphics
      .clear()
      .setStrokeStyle({ color })
      .moveTo(pt.x, pt.y)
      .lineTo(pt.x + v.x, pt.y + v.y)
      .stroke()

    const tmp = el.local2local(
      toolGrp,
      this.cvs[1].x * width,
      this.cvs[3].y * height
    )
    pivotShape.cursor = 'pointer'
    const pivotShapeRadius = 4
    const pivotShapeBar = 4
    pivotShape.graphics
      .clear()
      .arc(tmp.x, tmp.y, pivotShapeRadius, 0, Math.PI * 2)
      .moveTo(tmp.x + pivotShapeRadius, tmp.y)
      .lineTo(tmp.x + pivotShapeRadius + pivotShapeBar, tmp.y)
      .moveTo(tmp.x, tmp.y + pivotShapeRadius)
      .lineTo(tmp.x, tmp.y + pivotShapeRadius + pivotShapeBar)
      .moveTo(tmp.x - pivotShapeRadius, tmp.y)
      .lineTo(tmp.x - pivotShapeRadius - pivotShapeBar, tmp.y)
      .moveTo(tmp.x, tmp.y - pivotShapeRadius)
      .lineTo(tmp.x, tmp.y - pivotShapeRadius - pivotShapeBar)
      .setStrokeStyle({ color: '#222' })
      .stroke()
  }

  private setPivot(el: Shape | Group, x: number, y: number) {
    const mat = new Matrix()
      .skew(el.skewX, el.skewY)
      .rotate(el.rotation * deg2rad)
      .scale(el.scaleX, el.scaleY)
      .translate(-x, -y)

    const tMat = el.getMatrix()

    el.x = tMat.e - mat.e
    el.y = tMat.f - mat.f
    el.regX = x
    el.regY = y
  }

  public openHover() {
    this.hasOpenHover = true
  }

  public toggleHover(val = true) {
    const { maskGrp, toolGrp, hoverAlpha } = this
    maskGrp.ignoreEvent = toolGrp.ignoreEvent = true
    maskGrp.visible = val
    toolGrp.visible = false
    if (val) {
      maskGrp.alpha = hoverAlpha
      this.state = states.hover
    } else {
      this.state = states.idle
    }
  }

  public toggleActive(val = true) {
    const { maskGrp, toolGrp, activeAlpha } = this
    maskGrp.ignoreEvent = toolGrp.ignoreEvent = !val
    maskGrp.visible = toolGrp.visible = val

    if (val) {
      maskGrp.alpha = activeAlpha
      this.state = states.active
    } else {
      this.state = states.idle
    }
  }

  public dispose() {
    this.removePanel()
    this.emit('dispose')
  }

  // 监听钩子
  public watchEvent(fn: Function): void
  public watchEvent(opt: Record<TWatchEvent, Function>): void
  public watchEvent(...args: any[]) {
    let item = args[0]
    if (typeof item === 'function') {
      this.on('update', item)
        .on('active', item)
        .on('move', item)
        .on('dispose', item)
    } else {
      for (let key in item) {
        const fn = item[key]
        this.on(key, fn)
      }
    }
  }

  // 注册视图更新函数
  public bindTickerUpdate(fn: Function) {
    this.tikerUpdate = fn
  }
}
