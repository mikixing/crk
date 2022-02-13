import { useEffect, useRef } from 'react'
import { Shape, Group, Stage, CrkSyntheticEvent } from '@mikixing/crk'
import { initCanvas, mix, dragable } from '../util'

let needsUpdate = true
let id: number
export default function DeCasteljau() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    needsUpdate = true
    const canvas = canvasRef.current as HTMLCanvasElement
    const [width, height] = initCanvas(
      canvas,
      canvas.offsetWidth,
      canvas.offsetHeight
    )
    start()

    function start() {
      const points = [
        [250, 300],
        [200, 100],
        [600, 150],
        [500, 320],
      ]
      const stage = new Stage(canvas as HTMLCanvasElement)
      const line = new Shape()
      const curve = new Shape()
      const container = new Group()
      stage.addChild(container)
      container.addChild(line, curve)

      setLine()
      setCurve()

      points.forEach(p => {
        let [x, y] = p
        const circle = new Shape()
        circle.cursor = 'pointer'
        const text = new Shape()
        text.graphics
          .setTextStyle({ font: '10px Verdana' })
          .setFillStyle('#666')
          .fillText(`(${x}, ${y})`, x + 10, y + 10)
          .stroke()

        circle.set({ x, y })

        circle.graphics
          .clear()
          .arc(0, 0, 6, 0, Math.PI * 2)
          .setStrokeStyle({ lineWidth: 2, color: '#555' })
          .setFillStyle('#fa6')
          .fill()
          .stroke()

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

            console.log('----->', cx, cy, x, y)

            text.graphics.clear().fillText(`(${x}, ${y})`, x + 10, y + 10)

            setLine()
            setCurve()

            needsUpdate = true
            return [ox + dx, oy + dy]
          },
        })

        container.addChild(circle, text)
      })

      const track = new Shape()
      container.addChild(track)

      canvas.onmousemove = ev => {
        const { x } = canvas.getBoundingClientRect()
        const p = (ev.clientX - x) / canvas.offsetWidth

        const a = mix(points[0], points[1], p) as number[]
        const b = mix(points[1], points[2], p) as number[]
        const c = mix(points[2], points[3], p) as number[]

        const ab = mix(a, b, p) as number[]
        const bc = mix(b, c, p) as number[]

        const abc = mix(ab, bc, p) as number[]

        const r = 4
        track.graphics
          .clear()
          .setStrokeStyle({ lineWidth: 1, color: '#333' })
          .arc(a[0], a[1], r, 0, Math.PI * 2)
          .moveTo(b[0], b[1])
          .arc(b[0], b[1], r, 0, Math.PI * 2)
          .moveTo(c[0], c[1])
          .arc(c[0], c[1], r, 0, Math.PI * 2)
          .moveTo(ab[0], ab[1])
          .arc(ab[0], ab[1], r, 0, Math.PI * 2)
          .moveTo(bc[0], bc[1])
          .arc(bc[0], bc[1], r, 0, Math.PI * 2)
          .moveTo(a[0], a[1])
          .lineTo(b[0], b[1])
          .lineTo(c[0], c[1])
          .moveTo(ab[0], ab[1])
          .lineTo(bc[0], bc[1])
          .stroke()

        track.graphics
          .beginPath()
          .setFillStyle('#6cf')
          .arc(abc[0], abc[1], r, 0, Math.PI * 2)
          .fill()
          .stroke()

        needsUpdate = true
      }

      container.x = 50
      container.y = 20

      stage.enableMouseOver()
      update()

      function setLine() {
        line.graphics
          .clear()
          .moveTo(points[0][0], points[0][1])
          .lineTo(points[1][0], points[1][1])
          .lineTo(points[2][0], points[2][1])
          .lineTo(points[3][0], points[3][1])
          .setStrokeStyle({ color: '#ccc' })
          .stroke()
      }

      function setCurve() {
        curve.graphics
          .clear()
          .moveTo(points[0][0], points[0][1])
          .bezierCurveTo(
            points[1][0],
            points[1][1],
            points[2][0],
            points[2][1],
            points[3][0],
            points[3][1]
          )
          .setStrokeStyle({ color: '#99c', lineWidth: 3 })
          .stroke()
      }
      function update() {
        if (needsUpdate) {
          stage.update()
          needsUpdate = false
        }
        id = requestAnimationFrame(update)
      }
    }
    return () => {
      cancelAnimationFrame(id)
    }
  }, [canvasRef])

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%' }}
      ></canvas>
    </div>
  )
}
