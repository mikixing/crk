import React, { useEffect, useRef } from 'react'
import { Stage, Shape, Group } from '@mikixing/crk'
import { initCanvas, getRoundCircle } from '../util'

export default function RadialBar() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    return initStage(canvasRef.current as HTMLCanvasElement)
  }, [])

  return <canvas ref={canvasRef}></canvas>
}

function initStage(canvas: HTMLCanvasElement) {
  const data = [
    { name: 'Netflix', value: 0.37 },
    { name: 'Other', value: 0.36 },
    { name: 'Youtube', value: 0.18 },
    { name: 'Http', value: 0.06 },
    { name: 'Amazon Video', value: 0.03 },
  ]
  const maxValue = Math.max(...data.map(item => item.value))
  const maxAngle = 270

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  const [width, height] = initCanvas(canvas)

  const stage = new Stage(canvas)
  const grp = new Group()
  stage.addChild(grp)
  grp.x = width / 2
  grp.y = height / 2
  // grp.rotation = -90

  const textGrp = new Group()
  stage.addChild(textGrp)

  const radius = 20
  const gap = 40
  const len = data.length
  data.forEach((item, i) => {
    const shape = new Shape()
    shape.rotation = -90
    const g = shape.graphics
    grp.addChild(shape)
    const r = radius + (len - i) * gap
    const thickness = 20

    const endAngle = (item.value / maxValue) * maxAngle

    getRoundCircle(g, {
      x: 0,
      y: 0,
      startAngle: 0,
      endAngle,
      thickness,
      roundRadius: 30,
      radius: r,
    })
    g.setFillStyle(`hsl(${(((i + 6) / 8) * 200) % 360 | 0} , 60%, 50%`)
    g.fill()

    const textShape = new Shape()
    grp.addChild(textShape)
    const tg = textShape.graphics
    const x = Math.cos(-Math.PI / 2) * (r + thickness)
    const y = Math.sin(-Math.PI / 2) * (r + thickness) + 15
    const font = '16px PingFangSC'
    ctx.save()
    ctx.font = font
    const text = `${item.name} ` + item.value * 100 + '%'
    const m = ctx.measureText(text)
    tg.setTextStyle({ font })
      .setFillStyle('#666')
      .fillText(text, x - m.width - 10, y)

    ctx.restore()
  })

  stage.update()
}
