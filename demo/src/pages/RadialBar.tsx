import React, { useEffect, useRef } from 'react'
import { Stage, Shape, Group } from '@mikixing/crk'
import { ease, easeIn } from '@mikixing/transition'
import { getRoundCircle, getBackgroundData } from '../util'
import { layout, stdStage } from '../common'

export default function RadialBar() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    return initStage(canvasRef.current as HTMLCanvasElement)
  }, [])

  return (
    <layout.CanvasBox>
      <canvas ref={canvasRef}></canvas>
    </layout.CanvasBox>
  )
}

function initStage(canvas: HTMLCanvasElement) {
  const data = [
    { name: 'Netflix', value: 0.82 },
    { name: 'Other', value: 0.73 },
    { name: 'Youtube', value: 0.65 },
    { name: 'Http', value: 0.41 },
    { name: 'Amazon Video', value: 0.37 },
  ]
  const maxValue = Math.max(...data.map(item => item.value))
  const maxAngle = 270

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

  const stage = new Stage(canvas)
  const container = new Group()
  const grp = new Group()
  grp.x = 200
  grp.y = 300
  const textGrp = new Group()
  container.addChild(grp, textGrp)
  stage.addChild(container)

  let { width, height, ticker, dispose } = stdStage(stage, {
    onResize: (ev, w, h) => {
      width = w
      height = h
      ticker.needsUpdate = true
      container.set(getBackgroundData(500, 600, width, height))
    },
  })

  ticker.on('frame', () => {
    stage.update()
  })
  const { x: left, y: top, scale } = getBackgroundData(500, 600, width, height)
  container.set({
    x: left,
    y: top,
    scale,
  })

  const radius = 20
  const gap = 35
  const len = data.length
  data.forEach((item, i) => {
    const shape = new Shape()
    shape.rotation = -90
    const g = shape.graphics
    grp.addChild(shape)
    const r = radius + (len - i) * gap
    const thickness = 20

    const endAngle = (item.value / maxValue) * maxAngle
    let currentAngle = 0
    setTimeout(() => {
      const duration = 2000
      const src = {
        angle: 0,
      }
      const dst = {
        angle: endAngle,
        duration: ((endAngle / 270) * duration) / 3,
        onUpdate: (obj: Record<string, number>) => {
          ticker.needsUpdate = true
          currentAngle = obj.angle
          g.clear()
          getRoundCircle(g, {
            x: 0,
            y: 0,
            startAngle: 0,
            endAngle: currentAngle,
            thickness,
            roundRadius: 30,
            radius: r,
          })

          g.setFillStyle(`hsl(${(((i + 6) / 8) * 200) % 360 | 0} , 60%, 50%`)
            .fill()
            .setStrokeStyle({
              color: '#666',
              lineWidth: 1,
            })
            .stroke()
        },
      }
      easeIn(src, dst)
      ticker.needsUpdate = true
    }, 300 * i)

    const textShape = new Shape()
    grp.addChild(textShape)

    textShape.alpha = 0

    const tg = textShape.graphics
    const x = Math.cos(-Math.PI / 2) * (r + thickness)
    const y = Math.sin(-Math.PI / 2) * (r + thickness) + 15
    const font = '16px PingFangSC'
    ctx.save()
    ctx.font = font
    const text = `${item.name} ` + ((item.value * 100) | 0) + '%'
    tg.setTextStyle({ font, textAlign: 'right' })
      .setFillStyle('#666')
      .fillText(text, x - 10, y)

    ctx.restore()

    setTimeout(() => {
      ease(textShape, {
        x: 0,
        alpha: 1,
        onUpdate: obj => {
          Object.assign(textShape, obj)
          ticker.needsUpdate = true
        },
      })
      ticker.needsUpdate = true
    }, 100 * i)
  })

  return dispose
}
