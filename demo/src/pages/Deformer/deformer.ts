import { Group, Element, Shape, deg2rad, Matrix, rad2deg } from '@mikixing/crk'
import { Vector } from '../../util'

interface IOption {
  cvw?: number
  cvh?: number
  radius?: number
  color?: string
  fillColor?: string
  hoverAlpha?: number
  activeAlpha?: number
}

interface IRect {
  x: number
  y: number
  width: number
  height: number
}

export default class Deformer {
  public els: Element[]
  public status = 'idle'
  private panel = new Group()
  private toolGrp = new Group()
  private maskGrp = new Group()
  private container: Group

  private cvw: number
  private cvh: number
  private radius: number
  private color: string
  private fillColor: string
  private hoverAlpha: number
  private activeAlpha: number

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

  constructor(els = [] as Element[], container: Group, opt = {} as IOption) {
    this.els = els
    this.cvw = opt.cvw ?? 10
    this.cvh = opt.cvh ?? 10
    this.radius = opt.radius ?? 10
    this.color = opt.color ?? '#6cf'
    this.fillColor = opt.fillColor ?? '#ffe'
    this.hoverAlpha = opt.hoverAlpha ?? 0.25
    this.activeAlpha = opt.activeAlpha ?? 0.5
    this.container = container
    this.panel.addChild(this.maskGrp, this.toolGrp)
    this.container.addChild(this.panel)
    this.set(els, container, opt)
  }

  private assert(els: Element[]) {
    els.forEach((el, index) => {
      if (!(el instanceof Element)) {
        throw new TypeError(`第${index}个元素不是Element实例`)
      }
    })
  }

  private generateMask(el: Element) {
    this.maskGrp.removeAllChildren()
    const mask = new Shape()
    this.maskGrp.addChild(mask)
    this.updateMask(el)
    let ox: number, oy: number // target origin x, y
    let p1: { x: number; y: number }
    mask
      .on('pressdown', (ev: any) => {
        ox = el.x
        oy = el.y
        p1 = (el.parent || el).global2local(ev.x, ev.y)
        if (this) {
        }
      })
      .on('pressmove', (ev: any) => {
        const p2 = (el.parent || el).global2local(ev.x, ev.y) // 鼠标位置在bmGrp中对应的坐标
        el.x = ox + p2.x - p1.x
        el.y = oy + p2.y - p1.y
        this.updateMask(el)
        this.updateTool(el)
      })
  }

  private generateCv(el: Element) {
    this.toolGrp.removeAllChildren()
    const { rect } = el
    const { width, height } = rect as IRect

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
      cvShape.on('pressdown', ev => {
        this.setPivot(el as Shape, pivot.x, pivot.y)
        elWorldMat = el.getWorldMatrix().invert()
        sx = el.scaleX
        sy = el.scaleY

        const cp = elWorldMat.transformPoint(ev.x, ev.y)
        signX = Math.sign(cp.x - pivot.x)
        signY = Math.sign(cp.y - pivot.y)
      })

      cvShape.on('pressmove', (ev: any) => {
        const cp = elWorldMat.transformPoint(ev.x, ev.y)

        p.fx && (el.scaleX = (((cp.x - pivot.x) * signX) / width) * sx)
        p.fy && (el.scaleY = (((cp.y - pivot.y) * signY) / height) * sy)

        this.updateMask(el)
        this.updateTool(el)
      })

      return cvShape
    })
  }

  private generateRotateBtn(el: Element) {
    let { toolGrp, cvs, color, radius, rotateBtn, bar } = this
    const { rect } = el
    const { width, height } = rect as IRect

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

    let lv: Vector // start vector
    rotateBtn.on('pressdown', (ev: any) => {
      ev.stopPropagation()

      this.setPivot(el as Shape | Group, width / 2, height / 2)
      const pt = (el.parent ?? el).global2local(ev.x, ev.y)
      lv = new Vector(pt.x, pt.y).substract(new Vector(el.x, el.y)).normalize()
    })
    rotateBtn.on('pressmove', (ev: any) => {
      ev.stopPropagation()
      const pt = (el.parent ?? el).global2local(ev.x, ev.y)
      const v = new Vector(pt.x, pt.y)
        .substract(new Vector(el.x, el.y))
        .normalize()
      const theta = Math.asin(lv.cross(v))
      lv = v

      const angle = theta * rad2deg
      el.rotation += angle

      this.updateMask(el)
      this.updateTool(el)
    })
  }

  private updateMask(el: Element) {
    const { rect } = el
    const { width, height } = rect as IRect
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

  private updateTool(el: Element) {
    const { rect } = el
    const { width, height } = rect as IRect
    this.cvShapes.forEach((shape, index) => {
      const x = this.cvs[index].x * width
      const y = this.cvs[index].y * height
      let pt = el.local2local(this.toolGrp, x, y)
      shape.x = pt.x
      shape.y = pt.y
    })
    this.updateRotateBtn(el)
  }

  private updateRotateBtn(el: Element) {
    const { radius, toolGrp, rotateBtn, bar, color } = this
    const { rect } = el
    const { width, height } = rect as IRect
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

  public set(els = [] as Element[], container?: Group, opt = {} as IOption) {
    this.assert(els)
    this.els = els
    this.container = container ?? this.container
    this.cvw = opt.cvw ?? this.cvw ?? 10
    this.cvh = opt.cvh ?? this.cvh ?? 10
    this.radius = opt.radius ?? this.radius ?? 10
    this.color = opt.color ?? this.color ?? '#6cf'
    this.fillColor = opt.fillColor ?? this.fillColor ?? '#ffe'
    this.hoverAlpha = opt.hoverAlpha ?? this.hoverAlpha ?? 0.25
    this.activeAlpha = opt.activeAlpha ?? this.activeAlpha ?? 0.5
    this.rotateBtn = new Shape()
    this.bar = new Shape()

    if (els.length === 1) {
      this.generateMask(els[0])
      this.generateCv(els[0])
      this.generateRotateBtn(els[0])
      this.toggleHover(false)
    } else if (els.length > 1) {
      //
    }
  }

  public toggleHover(val = true) {
    const { maskGrp, toolGrp, hoverAlpha } = this
    maskGrp.ignoreEvent = toolGrp.ignoreEvent = true
    maskGrp.visible = val
    toolGrp.visible = false
    if (val) {
      maskGrp.alpha = hoverAlpha
      this.status = 'hover'
    } else {
      this.status = 'idle'
    }
  }

  public toggleActive(val = true) {
    const { maskGrp, toolGrp, activeAlpha } = this
    maskGrp.ignoreEvent = toolGrp.ignoreEvent = !val
    maskGrp.visible = toolGrp.visible = val

    if (val) {
      maskGrp.alpha = activeAlpha
      this.status = 'active'
    } else {
      this.status = 'idle'
    }
  }
}
