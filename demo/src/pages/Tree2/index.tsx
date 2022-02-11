import React, { useEffect, useRef } from 'react'
import { Button } from 'antd'
import setView, { reset, resort } from './view'

export default function Tree() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement
    return setView(canvas)
  }, [])

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%' }}
      ></canvas>
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          padding: 10,
          background: '#fff',
          // border: '1px solid #999',
        }}
      >
        <Button size="small" onClick={reset}>
          reset
        </Button>
        <br />
        <br />
        <Button size="small" onClick={resort}>
          resort
        </Button>
      </div>
    </>
  )
}