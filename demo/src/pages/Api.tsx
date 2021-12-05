import React, { useEffect, useRef } from 'react'
import { Stage, Shape } from '@mikixing/crk'
import { initCanvas } from '../util'

export default function RadialBar() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    return initStage(canvasRef.current as HTMLCanvasElement)
  }, [])

  return <canvas ref={canvasRef}></canvas>
}

function initStage(canvas: HTMLCanvasElement) {
  initCanvas(canvas)
  const stage = new Stage(canvas)

  const shape = new Shape()
  const g = shape.graphics

  g.beginPath()
    .setStrokeStyle({ color: 'green', lineWidth: 3 })
    .moveTo(100, 100)
    .lineTo(200, 200)
    .lineTo(200, 120)
    .closePath()
    .stroke()
    .save()
    .setStrokeStyle({ color: 'purple', lineWidth: 3 })
    .moveTo(300, 300)
    .lineTo(400, 400)
    .lineTo(400, 420)
    .closePath()
    .stroke()
    .restore()

  stage.addChild(shape)
  stage.update()
}
