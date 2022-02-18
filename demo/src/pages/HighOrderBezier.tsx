import { useEffect, useRef } from 'react'
import { Stage, Group, Shape, CrkSyntheticEvent } from '@mikixing/crk'
import { dragable, getBackgroundData, getLUT, setWheel } from '../util'
import { layout, stdStage } from '../common'

export default function HighOrderBezier() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement

    const stage = new Stage(canvas)
    const grp = new Group()
    stage.addChild(grp)
    stage.enableMouseOver()

    const removeWheel = setWheel(stage, () => (ticker.needsUpdate = true))

    let { width, height, ticker, dispose } = stdStage(stage, {
      onResize: (ev, w, h) => {
        width = w
        height = h
        grp.set(getBackgroundData(900, 700, width, height))
        ticker.needsUpdate = true
      },
    })

    grp.set(getBackgroundData(900, 700, width, height))

    ticker.on('frame', () => {
      stage.update()
    })

    const points = [
      [575, 521],
      [49, 592],
      [85, 279],
      [535, 342],
      [699, 433],
      [650, 100],
      [421, 53],
      [460, 400],
    ]

    addCurve(grp)

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

            const pt = circle.parent.global2local(ev.x, ev.y)
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

            const pt = circle.parent.global2local(ev.x, ev.y)

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
          .setStrokeStyle({ color: '#99c', lineWidth: 3, join: 'round' })
          .moveTo(points[0][0], points[0][1])

        for (let i = 1; i < lutX.length; i++) {
          g.lineTo(lutX[i], lutY[i])
        }
        g.stroke()
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
