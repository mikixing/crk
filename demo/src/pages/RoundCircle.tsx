import { GUI } from 'dat.gui'
import React, { useEffect, useRef } from 'react'
import { Stage, Shape } from '@mikixing/crk'
import { initCanvas, getRoundCircle } from '../util'

export default function RoundCircle() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    return initStage(canvasRef.current as HTMLCanvasElement)
  }, [])

  return <canvas ref={canvasRef}></canvas>
}

function initStage(canvas: HTMLCanvasElement) {
  let willUpdate = true
  const gui = new GUI()
  const d = {
    x: 400,
    y: 280,
    startAngle: 30,
    endAngle: 150,
    thickness: 130,
    radius: 60,
    roundRadius: 50,
    anticlockwise: true,
    fill: '#f70',
    xLen: 500,
    yLen: 500,
  }

  gui.add(d, 'startAngle', 0, 360, 1).onChange(() => (willUpdate = true))
  gui.add(d, 'endAngle', 0, 360, 1).onChange(() => (willUpdate = true))
  gui.add(d, 'thickness', 10, 500, 1).onChange(() => (willUpdate = true))
  gui.add(d, 'radius', 0, 500, 1).onChange(() => (willUpdate = true))
  gui.add(d, 'roundRadius', 0, 200, 1).onChange(() => (willUpdate = true))

  gui.add(d, 'anticlockwise').onChange(() => (willUpdate = true))
  gui.addColor(d, 'fill').onChange(() => (willUpdate = true))

  canvas.getContext('2d') as CanvasRenderingContext2D
  initCanvas(canvas)

  const stage = new Stage(canvas)

  const shape = new Shape()
  const g = shape.graphics
  stage.addChild(shape)

  update()

  return () => {
    gui.destroy()
  }

  function update() {
    if (willUpdate) {
      g.clear()
      getRoundCircle(g, d)
      g.setFillStyle(d.fill)
      g.fill()
      g.stroke()

      stage.update()
      willUpdate = false
    }
    requestAnimationFrame(update)
  }
}
