import { GUI } from 'dat.gui'
import React, { useEffect, useRef } from 'react'
import { Stage, Shape } from '@mikixing/crk'
import { initCanvas, getRoundCircle } from '../util'

let needsUpdate = false
let id: number
export default function RoundCircle() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    needsUpdate = true
    return initStage(canvasRef.current as HTMLCanvasElement)
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

function initStage(canvas: HTMLCanvasElement) {
  needsUpdate = true
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

  gui.add(d, 'startAngle', 0, 360, 1).onChange(() => (needsUpdate = true))
  gui.add(d, 'endAngle', 0, 360, 1).onChange(() => (needsUpdate = true))
  gui.add(d, 'thickness', 10, 500, 1).onChange(() => (needsUpdate = true))
  gui.add(d, 'radius', 0, 500, 1).onChange(() => (needsUpdate = true))
  gui.add(d, 'roundRadius', 0, 200, 1).onChange(() => (needsUpdate = true))

  gui.add(d, 'anticlockwise').onChange(() => (needsUpdate = true))
  gui.addColor(d, 'fill').onChange(() => (needsUpdate = true))

  canvas.getContext('2d') as CanvasRenderingContext2D
  initCanvas(canvas, canvas.offsetWidth, canvas.offsetHeight)

  const stage = new Stage(canvas)

  const shape = new Shape()
  const g = shape.graphics
  stage.addChild(shape)

  update()

  return () => {
    gui.destroy()
  }

  function update() {
    if (needsUpdate) {
      g.clear()
      getRoundCircle(g, d)
      g.setFillStyle(d.fill)
      g.fill()
      g.stroke()

      stage.update()
      needsUpdate = false
    }
    id = requestAnimationFrame(update)
  }
}
