import React, { useEffect, useRef } from 'react'
import { Stage, Shape, Group } from '@mikixing/crk'
import { linear, easeIn, easeOut, ease, collision } from '@mikixing/transition'
import { initCanvas, getRoundCircle } from '../util'
import { useContentRef } from '../App'

let needsUpdate = false
let id: number
export default function RadialBar() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contentRef = useContentRef()

  useEffect(() => {
    needsUpdate = true
    const dom = contentRef?.current as any as HTMLDivElement
    return initStage(canvasRef.current as HTMLCanvasElement, dom)
  }, [])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(id)
    }
  }, [])

  return (
    <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }}></canvas>
  )
}

function initStage(canvas: HTMLCanvasElement, content: HTMLDivElement) {
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
  const [width, height] = initCanvas(
    canvas,
    content.offsetWidth,
    content.offsetHeight
  )

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
    let currentAngle = 0
    setTimeout(() => {
      const duration = 2000
      const src = {
        angle: 0,
      }
      const dst = {
        angle: endAngle,
        duration: (endAngle / 270) * duration,
        onUpdate: (obj: Record<string, number>) => {
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
      collision(src, dst)
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

    textShape.x = -100

    setTimeout(() => {
      ease(textShape, {
        x: 0,
        alpha: 1,
        // onUpdate(d) {
        //   console.log(d, '------')
        // },
      })
    }, 100 * i)
  })

  update()
  function update() {
    if (needsUpdate) {
      stage.update()
    }
    requestAnimationFrame(update)
  }
}
