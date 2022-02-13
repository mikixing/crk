import React, { useEffect, useRef } from 'react'
import setTree from './tree'

export default function Tree() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement
    return setTree(canvas)
  }, [canvasRef])

  return (
    <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }}></canvas>
  )
}
