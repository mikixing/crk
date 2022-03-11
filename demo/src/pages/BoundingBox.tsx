import { useEffect, useRef } from 'react'
import { Stage, Group, Shape } from '@mikixing/crk'
import { layout, stdStage } from '../common'
import Bezier, { getZeroTangent } from '../util/bezier'
import { dragable, getBackgroundData } from '../util'

const radius = 5
const points = [
  [80, 130],
  [120, 80],
  [200, 230],
  [60, 210],
]

const axisColor = '#999'
const axisWidth = 300
const axisHeight = 300
const xPad = 400
const yPad = 50

export default function BoundingBox() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement
    const stage = new Stage(canvas)
    const curveShape = new Shape()
    const bbShape = new Shape()
    const lineShape = new Shape()
    const xAxisGrp = new Group()
    const yAxisGrp = new Group()
    const xTrangentShape = new Shape()
    const yTrangentShape = new Shape()
    const circleGrp = new Group()
    const graphGrp = new Group()

    xTrangentShape.x = xPad
    xTrangentShape.y = yPad

    yTrangentShape.x = xPad * 2
    yTrangentShape.y = yPad

    graphGrp.addChild(
      curveShape,
      lineShape,
      bbShape,
      circleGrp,
      xAxisGrp,
      yAxisGrp,
      xTrangentShape,
      yTrangentShape
    )
    stage.addChild(graphGrp)

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

    drawAxis({ x: xPad, y: yPad, el: xAxisGrp, xText: 't', yText: 'x' })
    drawAxis({ x: xPad * 2, y: yPad, el: yAxisGrp, xText: 't', yText: 'y' })

    init()

    let { width, height, ticker, dispose } = stdStage(stage, {
      onResize: (ev, w, h) => {
        width = w
        height = h
        graphGrp.set(
          getBackgroundData(1230, 400, width, height, { paddingBottom: 200 })
        )
        init()
        ticker.needsUpdate = true
      },
    })
    graphGrp.set(
      getBackgroundData(1230, 400, width, height, { paddingBottom: 200 })
    )
    ticker.on('frame', () => {
      stage.update()
    })
    ticker.needsUpdate = true

    stage.enableMouseOver()

    function init() {
      setCurve()
      setLine()
      setBoundingBox()
      setXCurve()
      setYCurve()
    }
    function setCurve() {
      curveShape.graphics
        .clear()
        .setStrokeStyle({ color: axisColor })
        .moveTo(...(points[0] as [number, number]))
        .bezierCurveTo(
          ...(points[1] as [number, number]),
          ...(points[2] as [number, number]),
          ...(points[3] as [number, number])
        )
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
    function setBoundingBox() {
      const xList = points.map(p => p[0])
      const yList = points.map(p => p[1])
      const zeroTangentX = getZeroTangent(
        ...(xList as [number, number, number, number])
      )
      zeroTangentX.forEach((t, i) => {
        if (t < 0) zeroTangentX[i] = 0
        if (t > 1) zeroTangentX[i] = 1
      })

      const zeroTangentY = getZeroTangent(
        ...(yList as [number, number, number, number])
      )
      zeroTangentY.forEach((t, i) => {
        if (t < 0) zeroTangentY[i] = 0
        if (t > 1) zeroTangentY[i] = 1
      })

      const xbe = new Bezier(...(xList as [number, number, number, number]))
      const ybe = new Bezier(...(yList as [number, number, number, number]))
      const extremeList = [
        {
          x: xbe.get(zeroTangentX[0]),
          y: ybe.get(zeroTangentY[0]),
        },
        {
          x: xbe.get(zeroTangentX[1]),
          y: ybe.get(zeroTangentY[1]),
        },
        {
          x: xbe.get(0),
          y: ybe.get(0),
        },
        {
          x: xbe.get(1),
          y: ybe.get(1),
        },
      ] // extreme point 极值点和端点

      const extremeObj = extremeList.reduce(
        (accumulator, currentValue) => {
          const { min, max } = accumulator
          const minx = Math.min(min.x, currentValue.x)
          const miny = Math.min(min.y, currentValue.y)
          const maxx = Math.max(max.x, currentValue.x)
          const maxy = Math.max(max.y, currentValue.y)

          return { min: { x: minx, y: miny }, max: { x: maxx, y: maxy } }
        },
        {
          min: { x: Infinity, y: Infinity },
          max: { x: -Infinity, y: -Infinity },
        }
      )

      const { x, y } = extremeObj.min
      const width = extremeObj.max.x - x
      const height = extremeObj.max.y - y
      bbShape.graphics
        .clear()
        .setStrokeStyle({ color: '#6cf' })
        .rect(x, y, width, height)
        .stroke()
    }

    function drawAxis(opt: {
      x: number
      y: number
      el: Group
      xText: string
      yText: string
    }) {
      const { x, y, el, xText, yText } = opt
      el.removeAllChildren()
      el.x = x
      el.y = y
      const shape = new Shape()
      shape.graphics
        .beginPath()
        .setStrokeStyle({ color: axisColor })
        .moveTo(0, 30)
        .lineTo(axisWidth, 30)
        .stroke()
        .beginPath()
        .lineTo(axisWidth, 25)
        .lineTo(axisWidth + 20, 30)
        .lineTo(axisWidth, 35)
        .closePath()
        .setFillStyle(axisColor)
        .fill()
        .beginPath()
        .moveTo(30, 0)
        .lineTo(30, axisHeight)
        .stroke()
        .beginPath()
        .lineTo(25, axisHeight)
        .lineTo(30, axisHeight + 20)
        .lineTo(35, axisHeight)
        .closePath()
        .setFillStyle(axisColor)
        .fill()

      const text1 = new Shape()
      text1.graphics.beginPath().fillText('0')
      text1.x = 35
      text1.y = 25

      const text2 = new Shape()
      text2.graphics.beginPath().fillText('1')
      text2.x = 320
      text2.y = 25

      const text3 = new Shape()
      text3.graphics.beginPath().fillText('300')
      text3.x = 5
      text3.y = 320

      const text4 = new Shape()
      text4.graphics.beginPath().fillText(xText)
      text4.x = 185
      text4.y = 25

      const text5 = new Shape()
      text5.graphics.beginPath().fillText(yText)
      text5.x = 5
      text5.y = 160

      el.addChild(shape, text1, text2, text3, text4, text5)
    }

    function setXCurve() {
      const g = xTrangentShape.graphics

      const times = 350
      const segements = 100
      const xList = points.map(p => p[0])

      g.clear()
      const be = new Bezier(...(xList as [number, number, number, number]))
      for (let i = 0; i < segements; i++) {
        const t = i / segements
        let h = be.get(t)

        if (i === 0) {
          g.beginPath()
            .setStrokeStyle({ color: '#f70' })
            .moveTo(t * times, h)
        } else {
          g.lineTo(t * times, h)
        }
      }
      g.stroke()

      const middle = be.get(0.5)
      g.setStrokeStyle({ color: '#666' })
        .beginPath()
        .arc(0.5 * times, middle, 2, 0, Math.PI * 2)
      g.stroke()
    }

    function setYCurve() {
      const g = yTrangentShape.graphics

      const times = 350
      const segements = 100
      const yList = points.map(p => p[1])

      g.clear()
      const be = new Bezier(...(yList as [number, number, number, number]))
      for (let i = 0; i < segements; i++) {
        const t = i / segements
        let h = be.get(t)

        if (i === 0) {
          g.beginPath()
            .setStrokeStyle({ color: '#f70' })
            .moveTo(t * times, h)
        } else {
          g.lineTo(t * times, h)
        }
      }
      g.stroke()

      const middle = be.get(0.5)
      g.setStrokeStyle({ color: '#666' })
        .beginPath()
        .arc(0.5 * times, middle, 2, 0, Math.PI * 2)
      g.stroke()
    }

    return dispose
  }, [canvasRef])

  return (
    <layout.CanvasBox>
      <canvas ref={canvasRef}></canvas>
    </layout.CanvasBox>
  )
}
