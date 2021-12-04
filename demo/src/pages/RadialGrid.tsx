import React, { useEffect, useRef } from 'react'
import { Stage, Shape, Group, deg2rad } from '@mikixing/crk'
import { initCanvas, getRoundCircle, Vector } from '../util'

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

  const radius = 50
  const gap = 50
  const len = data.length

  {
    const grp = new Group()
    stage.addChild(grp)

    grp.x = width / 2
    grp.y = height / 2

    const tmp = new Array(len + 1).fill(1)
    tmp.forEach((item, i) => {
      const shape = new Shape()
      const g = shape.graphics

      const r = radius + i * gap
      g.arc(0, 0, r, 0, Math.PI * 2)

      const step = 30
      let angle = 0
      if (i === tmp.length - 1) {
        while (angle < 360) {
          const x = Math.cos(angle * deg2rad) * r
          const y = Math.sin(angle * deg2rad) * r
          g.moveTo(0, 0).lineTo(x, y)

          const v = new Vector(x, y)
          let scale
          if (angle <= 180) {
            scale = 30
          } else {
            scale = 15
          }
          const v1 = v.normalize().scale(scale).add(v)
          const text = ((angle + 90) % 360) + ''
          const font = '16px PingFangSC'
          ctx.save()
          ctx.font = font
          const m = ctx.measureText(text)
          ctx.restore()
          g.setTextStyle({ font })
            .setFillStyle('#666')
            .fillText(text, v1.x - m.width / 2, v1.y)
          angle += step
        }
      }
      g.setStrokeStyle({ color: '#aaa' }).stroke()
      grp.addChild(shape)
    })
  }

  {
    const grp = new Group()
    stage.addChild(grp)

    grp.x = width / 2
    grp.y = height / 2
    grp.rotation = -90

    data.forEach((item, i) => {
      const shape = new Shape()
      const g = shape.graphics
      grp.addChild(shape)

      const endAngle = (item.value / maxValue) * maxAngle
      console.log()

      getRoundCircle(g, {
        x: 0,
        y: 0,
        startAngle: 0,
        endAngle,
        thickness: 30,
        // roundRadius: 30,
        radius: radius + (len - i - 1) * gap,
      })
      g.setFillStyle(`hsl(${((i / 8) * 360) | 0} , 60%, 50%`)
      g.fill()
    })
  }

  stage.update()
}
