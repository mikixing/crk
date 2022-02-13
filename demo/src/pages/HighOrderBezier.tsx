import { useEffect, useRef } from 'react'
import { Stage, Group, Shape, CrkSyntheticEvent } from '@mikixing/crk'
import { dragable, getLUT, initCanvas } from '../util'

let needsUpdate = true
let id: number
export default function HighOrderBezier() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    needsUpdate = true
    const canvas = canvasRef.current as HTMLCanvasElement
    console.log('hahhah')
    console.log(canvas.offsetWidth, canvas.offsetHeight, '------')

    const [width, height] = initCanvas(
      canvas,
      canvas.offsetWidth,
      canvas.offsetHeight
    )

    const stage = new Stage(canvas)
    const container = new Group()
    stage.addChild(container)

    const points = [
      [575, 521],
      [49, 592],
      [85, 279],
      [535, 342],
      [699, 433],
      [10, 202],
      [421, 53],
      [519, 195],
    ]

    addCurve(container)

    container.x = 50
    container.y = 0

    stage.enableMouseOver()
    update()

    function addCurve(ctn: Group) {
      const line = new Shape()
      const curve = new Shape()
      ctn.addChild(line, curve)

      setLine()
      setCurve()

      points.forEach((p, i) => {
        let [x, y] = p

        const circle = new Shape()
        circle.cursor = 'pointer'
        const text = new Shape()
        text.graphics
          .setTextStyle({ font: '#666' })
          .fillText(`p${i} (${x}, ${y})`, x + 10, y + 10)

        circle.set({ x, y })

        circle.graphics
          .clear()
          .setStrokeStyle({ color: '#666', lineWidth: 3 })
          .setFillStyle('#fa6')
          .arc(0, 0, 5, 0, Math.PI * 2)
          .stroke()
          .fill()

        let sx: number // ev start x
        let sy: number // ev start y
        let psx: number // p start x
        let psy: number // p start y
        dragable(circle, {
          onPressdown: (ev: CrkSyntheticEvent) => {
            psx = p[0]
            psy = p[1]
            sx = ev.x
            sy = ev.y
          },
          onPressmove: (
            ev: CrkSyntheticEvent,
            ox: number,
            oy: number,
            dx: number,
            dy: number
          ) => {
            needsUpdate = true

            const cx = ev.x - sx
            const cy = ev.y - sy

            let x = (p[0] = psx + cx)
            let y = (p[1] = psy + cy)

            text.graphics.clear().fillText(`(${x}, ${y})`, x + 10, y + 10)

            setLine()
            setCurve()

            needsUpdate = true
            return [ox + dx, oy + dy]
          },
        })

        ctn.addChild(circle, text)
      })

      function setLine() {
        const g = line.graphics
          .clear()
          .setStrokeStyle({ color: '#ccc' })
          .moveTo(points[0][0], points[0][1])

        for (let i = 1; i < points.length; i++) {
          const arr = points[i]
          g.lineTo(arr[0], arr[1])
        }
        g.stroke()
      }

      function setCurve() {
        const xlist = points.map(e => e[0])
        const ylist = points.map(e => e[1])

        const lutX = getLUT(xlist)
        const lutY = getLUT(ylist)

        const g = curve.graphics
          .clear()
          .setStrokeStyle({ color: '#99c', lineWidth: 3 })
          .moveTo(points[0][0], points[0][1])

        for (let i = 1; i < lutX.length; i++) {
          g.lineTo(lutX[i], lutY[i])
        }
        g.stroke()
      }
    }

    function update() {
      if (needsUpdate) {
        needsUpdate = false
        stage.update()
      }
      id = requestAnimationFrame(update)
    }
    return () => {
      cancelAnimationFrame(id)
    }
  }, [canvasRef])
  return (
    <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }}></canvas>
  )
}
