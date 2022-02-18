import { useEffect, useRef } from 'react'
import { Shape, Group, Stage, CrkSyntheticEvent } from '@mikixing/crk'
import { mix, dragable, getBackgroundData, setWheel } from '../util'
import { layout, stdStage } from '../common'

export default function DeCasteljau() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement
    const stage = new Stage(canvas as HTMLCanvasElement)
    stage.enableMouseOver()

    let { width, height, ticker, dispose } = stdStage(stage, {
      onResize: (ev, w, h) => {
        width = w
        height = h
        grp.set(getBackgroundData(800, 500, width, height))
        ticker.needsUpdate = true
      },
    })

    const removeWheel = setWheel(stage, () => (ticker.needsUpdate = true))

    ticker.on('frame', () => {
      stage.update()
    })

    const grp = new Group()
    stage.addChild(grp)

    start()

    function start() {
      const points = [
        [250, 300],
        [200, 100],
        [600, 150],
        [500, 320],
      ]
      const line = new Shape()
      const curve = new Shape()

      grp.addChild(line, curve)

      setLine()
      setCurve()

      grp.set(getBackgroundData(800, 500, width, height))

      points.forEach(p => {
        let [x, y] = p
        const circle = new Shape()
        circle.cursor = 'pointer'
        const text = new Shape()
        text.graphics
          .setTextStyle({ font: '10px Verdana' })
          .setFillStyle('#666')
          .fillText(`(${x | 0}, ${y | 0})`, x + 10, y + 10)
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

            const pt = grp.global2local(ev.x, ev.y)
            sx = pt.x
            sy = pt.y
          },
          onPressmove: (
            ev: CrkSyntheticEvent,
            ox: number,
            oy: number,
            dx: number,
            dy: number
          ) => {
            ticker.needsUpdate = true

            const pt = grp.global2local(ev.x, ev.y)

            const cx = pt.x - sx
            const cy = pt.y - sy

            let x = (p[0] = psx + cx)
            let y = (p[1] = psy + cy)

            text.graphics
              .clear()
              .fillText(`(${x | 0}, ${y | 0})`, x + 10, y + 10)

            setLine()
            setCurve()

            ticker.needsUpdate = true
            return [ox + dx, oy + dy]
          },
        })

        grp.addChild(circle, text)
      })

      const track = new Shape()
      grp.addChild(track)

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

        ticker.needsUpdate = true
      }

      // grp.x = 50
      // grp.y = 20

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
    }

    return () => {
      dispose()
      removeWheel()
    }
  }, [canvasRef])

  return (
    <layout.CanvasBox>
      <canvas ref={canvasRef}></canvas>
    </layout.CanvasBox>
  )
}
