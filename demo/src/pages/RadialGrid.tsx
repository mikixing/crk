import React, { useEffect, useRef } from 'react'
import { Stage, Shape, Group, deg2rad, Ticker } from '@mikixing/crk'
import { getRoundCircle, Vector, setWheel, getBackgroundData } from '../util'
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
    { name: 'Netflix', value: 0.37 },
    { name: 'Other', value: 0.36 },
    { name: 'Youtube', value: 0.18 },
    { name: 'Http', value: 0.06 },
    { name: 'Amazon Video', value: 0.03 },
  ]
  const maxValue = Math.max(...data.map(item => item.value))
  const maxAngle = 270

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  const stage = new Stage(canvas)
  stage.enableMouseOver()

  const container = new Group()
  stage.addChild(container)

  let { width, height, ticker, dispose } = stdStage(stage, {
    onResize: (ev, w, h) => {
      width = w
      height = h
      ticker.needsUpdate = true
      container.set(
        getBackgroundData(720, 700, width, height, {
          paddingTop: 20,
          paddingBottom: 20,
        })
      )
    },
  })
  container.set(
    getBackgroundData(720, 700, width, height, {
      paddingTop: 20,
      paddingBottom: 20,
    })
  )
  ticker.needsUpdate = true
  ticker.on('frame', () => {
    stage.update()
  })

  const removeWheel = setWheel(container, () => {
    ticker.needsUpdate = true
  })

  const radius = 50
  const gap = 50
  const len = data.length

  {
    const grp = new Group()
    container.addChild(grp)

    grp.x = 360
    grp.y = height / 2 - 30

    const arr = new Array(len + 1).fill(1)
    arr.forEach((item, i) => {
      const shape = new Shape()
      const g = shape.graphics

      const r = radius + i * gap
      g.arc(0, 0, r, 0, Math.PI * 2)

      const step = 30
      let angle = 0
      if (i === arr.length - 1) {
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
    container.addChild(grp)

    grp.x = 360
    grp.y = height / 2 - 30
    grp.rotation = -90

    grp.delegate('mouseover', 'bar', ev => {
      const el = ev.currentTarget
      ticker.needsUpdate = true

      el && (el.alpha = 1)
    })

    grp.delegate('mouseout', 'bar', ev => {
      const el = ev.currentTarget
      ticker.needsUpdate = true

      el && (el.alpha = 0.8)
    })

    data.forEach((item, i) => {
      const shape = new Shape()
      const g = shape.graphics
      grp.addChild(shape)

      shape.addAttr('bar')

      shape.alpha = 0.8

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

  return () => {
    dispose()
    removeWheel()
  }
}
