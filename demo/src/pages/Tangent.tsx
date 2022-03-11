import { useEffect, useRef } from 'react'
import { Shape, Group, Stage } from '@mikixing/crk'
import { layout, stdStage } from '../common'
import { Bezier, dragable, Vector, getBackgroundData } from '../util'
import { dfdt } from '../util/bezier'

const points = [
  [250, 200],
  [400, 100],
  [500, 400],
  [280, 320],
]

const maxWidth = 740
const maxHeight = 540
const radius = 5

export default function Trangent() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement
    const stage = new Stage(canvas)
    const graphGrp = new Group()
    const circleGrp = new Group()

    points.forEach(p => {
      const shape = new Shape()
      shape.cursor = 'pointer'
      circleGrp.addChild(shape)

      let sources = [...p]
      let sx: number // start x
      let sy: number //  start y
      dragable(shape, {
        onPressdown: ev => {
          const tp = graphGrp.global2local(ev.x, ev.y)
          sx = tp.x
          sy = tp.y
        },
        onPressmove: ev => {
          const tp = graphGrp.global2local(ev.x, ev.y)
          const cx = tp.x
          const cy = tp.y
          p[0] = sources[0] + cx - sx
          p[1] = sources[1] + cy - sy

          init()
          ticker.needsUpdate = true

          return [0, 0]
        },
        onPressup: ev => {
          sources = [...p]
        },
      })
    })

    const lineShape = new Shape()
    const curveShape = new Shape()
    const ntGrp = new Group() // normal tangent 法线,切线
    graphGrp.addChild(lineShape, curveShape, circleGrp, ntGrp)
    stage.addChild(graphGrp)

    init()

    function init() {
      setCurve()
      setLine()
      setTangentNormal()
    }

    function setCurve() {
      const p0 = points[0]
      const p1 = points[1]
      const p2 = points[2]
      const p3 = points[3]
      curveShape.graphics
        .clear()
        .beginPath()
        .moveTo(p0[0], p0[1])
        .bezierCurveTo(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1])
        .setStrokeStyle({ lineWidth: 2, color: '#333' })
        .stroke()
    }

    function setLine() {
      points.forEach((item, index) => {
        const shape = circleGrp.children[index] as Shape
        shape.graphics
          .clear()
          .setStrokeStyle({ lineWidth: 2, color: '#333' })
          .setFillStyle('#f70')
          .arc(item[0], item[1], radius, 0, Math.PI * 2)
          .stroke()
          .fill()
      })

      const lg = lineShape.graphics
      lg.clear().setStrokeStyle({ color: '#ccc' })
      points.forEach((p, index) => {
        if (index === 0) {
          lg.moveTo(p[0], p[1])
        } else {
          lg.lineTo(p[0], p[1])
        }
      })
      lg.stroke()
    }
    function setTangentNormal() {
      const segement = 1000
      const len = 30
      const total = 10
      const xList = points.map(item => item[0])
      const yList = points.map(item => item[1])
      const xCurve = new Bezier(...xList)
      const yCurve = new Bezier(...yList)

      ntGrp.removeAllChildren()
      let ttv, tnv
      for (let i = 1; i < segement; i++) {
        const t = i / segement
        if (i % (segement / total) !== 0) continue

        const y = yCurve.get(t)
        const x = xCurve.get(t)
        // @ts-ignore
        const k = dfdt(...yList, t) / dfdt(...xList, t)

        let tv = new Vector(1, k).normalize()
        if (ttv && tv.dot(ttv) < 0) {
          tv = tv.inverse()
        }
        ttv = tv

        let nv = new Vector(-k, 1).normalize()
        if (tnv && nv.dot(tnv) < 0) {
          nv = nv.inverse()
        }
        tnv = nv

        const shape = new Shape()
        shape.graphics
          .beginPath()
          .setStrokeStyle({ color: '#6ca', lineWidth: 1 })
          .moveTo(x, y)
          .lineTo(x + nv.x * len, y + nv.y * len)
          .stroke()
          .beginPath()
          .setStrokeStyle({ color: '#e6f', lineWidth: 1 })
          .moveTo(x, y)
          .lineTo(x + tv.x * len, y + tv.y * len)
          .stroke()
          .beginPath()
          .setFillStyle('red')
          .arc(x, y, 3, 0, Math.PI * 2)
          .fill()
        ntGrp.addChild(shape)
      }
    }

    let { width, height, ticker, dispose } = stdStage(stage, {
      onResize(ev, w, h) {
        init()
        width = w
        height = h
        graphGrp.set(
          getBackgroundData(maxWidth, maxHeight, width, height, {
            paddingTop: 50,
            paddingBottom: 50,
          })
        )
        ticker.needsUpdate = true
      },
    })
    graphGrp.set(
      getBackgroundData(maxWidth, maxHeight, width, height, {
        paddingTop: 50,
        paddingBottom: 50,
      })
    )
    ticker.on('frame', () => {
      stage.update()
    })
    ticker.needsUpdate = true

    stage.enableMouseOver()

    return dispose
  }, [canvasRef])
  return (
    <layout.CanvasBox>
      <canvas ref={canvasRef}></canvas>
    </layout.CanvasBox>
  )
}
