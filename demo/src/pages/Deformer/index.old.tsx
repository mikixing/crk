import React, { useEffect, useRef } from 'react'
import {
  Stage,
  Group,
  Shape as RawShape,
  deg2rad,
  Bitmap,
  Matrix,
  rad2deg,
} from '@mikixing/crk'
import { initCanvas, Vector, loadImage } from '../../util'

enum ShapeType {
  tool,
  rotateHandler,
  bar,
  mask,
  raw,
  ignore,
}

interface Pt {
  x: number
  y: number
}

class Shape extends RawShape {
  _type?: ShapeType
  _point?: Pt
}

export default function Deformer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement
    init(canvas)
  }, [])

  return <canvas ref={canvasRef}></canvas>
}

async function init(canvas: HTMLCanvasElement) {
  canvas.getContext('2d') as CanvasRenderingContext2D
  initCanvas(canvas)
  const stage = new Stage(canvas)
  const bmGrp = new Group()
  const maskGrp = new Group()
  const toolGrp = new Group()
  const panelGrp = new Group()
  toolGrp.visible = false

  panelGrp.addChild(bmGrp, maskGrp, toolGrp)
  stage.addChild(panelGrp)

  stage.mouseMoveOutside = true

  const images = [
    // 'http://localhost:3000/images/f.jpeg',
    'http://localhost:3000/images/fb.png',
  ]

  const [img] = await loadImage(images)
  const bm = new Bitmap(img)

  bm.x = 500
  bm.y = 100
  bm.rotation = 50
  bm.scale = 0.5
  // bm.skewX = 45
  bmGrp.addChild(bm)
  bmGrp.rotation = 30
  const mask = new Shape()
  maskGrp.addChild(mask)
  maskGrp.x = 200
  maskGrp.rotation = 50

  const { width: bmWidth, height: bmHeight } = bm.source
  setPivot(bm, bmWidth / 2, bmHeight / 2)

  const cvw = 10
  const cvh = 10
  const points = [
    { x: 0, y: 0, pivotIndex: 4, fx: 1, fy: 1 },
    { x: bmWidth / 2, y: 0, pivotIndex: 5, fx: 0, fy: 1 },
    { x: bmWidth, y: 0, pivotIndex: 6, fx: 1, fy: 1 },
    { x: bmWidth, y: bmHeight / 2, pivotIndex: 7, fx: 1, fy: 0 },
    { x: bmWidth, y: bmHeight, pivotIndex: 0, fx: 1, fy: 1 },
    { x: bmWidth / 2, y: bmHeight, pivotIndex: 1, fx: 0, fy: 1 },
    { x: 0, y: bmHeight, pivotIndex: 2, fx: 1, fy: 1 },
    { x: 0, y: bmHeight / 2, pivotIndex: 3, fx: 1, fy: 0 },
  ]

  const pointShapes = points.map((p, i) => {
    const shape = new Shape()
    toolGrp.addChild(shape)
    let pt = bm.local2local(toolGrp, p.x, p.y)
    shape.regX = cvw / 2
    shape.regY = cvh / 2
    shape.x = pt.x
    shape.y = pt.y

    shape._point = p
    shape._type = ShapeType.tool

    shape.graphics
      .setFillStyle('#ffe7')
      .setStrokeStyle({ lineWidth: 1, color: '#6cf' })
      .rect(0, 0, cvw, cvh)
      .fill()
      .stroke()

    return shape
  })
  let rotateBtn: Shape
  let barLine: Shape
  {
    let pt = bm.local2local(toolGrp, points[1].x, points[1].y)
    let pt2 = bm.local2local(toolGrp, bmWidth / 2, bmHeight / 2)
    let v = new Vector(pt.x, pt.y)
      .substract(new Vector(pt2.x, pt2.y))
      .normalize()
      .scale(40)

    const radius = 10
    rotateBtn = new Shape()
    toolGrp.addChild(rotateBtn)
    rotateBtn._type = ShapeType.rotateHandler
    rotateBtn._point = points[1]
    rotateBtn.graphics
      .setFillStyle('#6cf')
      .arc(0, 0, radius, 0, Math.PI * 2)
      .fill()
    rotateBtn.x = pt.x + v.x
    rotateBtn.y = pt.y + v.y

    let lv: Vector // start vector
    rotateBtn.on('pressdown', (ev: any) => {
      ev.stopPropagation()

      setPivot(bm, bmWidth / 2, bmHeight / 2)
      const pt = bmGrp.global2local(ev.x, ev.y)
      lv = new Vector(pt.x, pt.y).substract(new Vector(bm.x, bm.y)).normalize()
    })
    rotateBtn.on('pressmove', (ev: any) => {
      ev.stopPropagation()
      const pt = bmGrp.global2local(ev.x, ev.y)
      const v = new Vector(pt.x, pt.y)
        .substract(new Vector(bm.x, bm.y))
        .normalize()
      const theta = Math.asin(lv.cross(v))
      lv = v

      const angle = theta * rad2deg
      bm.rotation += angle

      drawMask()
      drawTool()
    })
    barLine = new Shape()
    barLine.graphics
      .setStrokeStyle({ color: '#6cf', lineWidth: 1 })
      .moveTo(pt.x, pt.y)
      .lineTo(rotateBtn.x, rotateBtn.y)
      .stroke()
    toolGrp.addChild(barLine)
    toolGrp.swapChildren(barLine, rotateBtn)

    barLine._type = ShapeType.bar
    barLine._point = points[1]
  }

  let sx: number // scaleX
  let sy: number // scaleY
  let target: Shape
  let activeIndex: number
  let activePoint: Pt & { pivotIndex: number; fx: number; fy: number }
  let pivot: Pt
  let signX: number
  let signY: number
  let bmWorldMat: Matrix

  let isActive = false
  toolGrp.on('pressdown', ev => {
    target = ev.target

    activeIndex = toolGrp.getChildIndex(target)
    activePoint = points[activeIndex]
    pivot = points[activePoint.pivotIndex]
    setPivot(bm, pivot.x, pivot.y)
    bmWorldMat = bm.getWorldMatrix().invert()
    sx = bm.scaleX
    sy = bm.scaleY

    const cp = bmWorldMat.transformPoint(ev.x, ev.y)
    signX = Math.sign(cp.x - pivot.x)
    signY = Math.sign(cp.y - pivot.y)
  })

  toolGrp.on('pressmove', (ev: any) => {
    const cp = bmWorldMat.transformPoint(ev.x, ev.y)

    activePoint.fx && (bm.scaleX = (((cp.x - pivot.x) * signX) / bmWidth) * sx)
    activePoint.fy && (bm.scaleY = (((cp.y - pivot.y) * signY) / bmHeight) * sy)

    drawMask()
    drawTool()
  })

  bmGrp
    .on('mouseover', (ev: any) => {
      maskGrp.visible = true
      maskGrp.ignoreEvent = true
      maskGrp.alpha = 0.25
      drawMask()
    })
    .on('mouseout', (ev: any) => {
      if (isActive) return
      maskGrp.visible = false
    })
    .on('pressdown', () => {
      maskGrp.ignoreEvent = false
      maskGrp.alpha = 0.5
      toolGrp.visible = true
      isActive = true

      setPivot(bm, bmWidth / 2, bmHeight / 2)
      drawMask()
      drawTool()
    })

  {
    let ox: number, oy: number // target origin x, y
    let p1: Pt
    mask
      .on('pressdown', (ev: any) => {
        ox = bm.x
        oy = bm.y
        p1 = bmGrp.global2local(ev.x, ev.y)
      })
      .on('pressmove', (ev: any) => {
        const p2 = bmGrp.global2local(ev.x, ev.y) // 鼠标位置在bmGrp中对应的坐标
        bm.x = ox + p2.x - p1.x
        bm.y = oy + p2.y - p1.y
        drawMask()
        drawTool()
      })
      .on('mouseout', () => {
        // isActive = false
        // maskGrp.visible = false
        // toolGrp.visible = false
        // maskGrp.ignoreEvent = true
      })
  }

  stage.enableMouseOver(16)

  update()

  function update() {
    stage.update()
    requestAnimationFrame(update)
  }

  function drawMask() {
    // 顺时针方向
    const p1 = bm.local2local(mask, 0, 0)
    const p2 = bm.local2local(mask, bmWidth, 0)
    const p3 = bm.local2local(mask, bmWidth, bmHeight)
    const p4 = bm.local2local(mask, 0, bmHeight)

    mask.graphics
      .clear()
      .setFillStyle('#6cf')
      .moveTo(p1.x, p1.y)
      .lineTo(p2.x, p2.y)
      .lineTo(p3.x, p3.y)
      .lineTo(p4.x, p4.y)
      .closePath()
      .fill()
  }

  function drawTool() {
    pointShapes.forEach(child => {
      const { _point } = child as Shape
      let pt = bm.local2local(toolGrp, _point?.x ?? 0, _point?.y ?? 0)
      child.x = pt.x
      child.y = pt.y
    })
    setRotateBtn()
  }
  function setRotateBtn() {
    const { _point } = rotateBtn
    const radius = 10
    let pt = bm.local2local(toolGrp, _point?.x ?? 0, _point?.y ?? 0)
    let pt2 = bm.local2local(toolGrp, bmWidth / 2, bmHeight / 2)
    let v = new Vector(pt.x, pt.y)
      .substract(new Vector(pt2.x, pt2.y))
      .normalize()
      .scale(40)

    rotateBtn.graphics
      .clear()
      .setFillStyle('#6cf')
      .arc(0, 0, radius, 0, Math.PI * 2)
      .fill()
    rotateBtn.x = pt.x + v.x
    rotateBtn.y = pt.y + v.y

    barLine.graphics
      .clear()
      .setStrokeStyle({ color: '#6cf', lineWidth: 1 })
      .moveTo(pt.x, pt.y)
      .lineTo(pt.x + v.x, pt.y + v.y)
      .stroke()
  }
}

function setPivot(el: Shape | Group, x: number, y: number) {
  const mat = new Matrix()
    .skew(el.skewX, el.skewY)
    .rotate(el.rotation * deg2rad)
    .scale(el.scaleX ?? el.scale, el.scaleY ?? el.scale)
    .translate(-x, -y)

  const tMat = el.getMatrix()

  el.x = tMat.e - mat.e
  el.y = tMat.f - mat.f
  el.regX = x
  el.regY = y
}
