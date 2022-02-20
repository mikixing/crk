import { useEffect, useRef } from 'react'
import { layout, stdStage } from '../common'
import { dragable, getBackgroundData, Vector } from '../util'
import { rad2deg, Stage, Group, Shape } from '@mikixing/crk'

export default function Triangle() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let canvas = canvasRef.current as HTMLCanvasElement

    const stage = new Stage(canvas)
    stage.enableMouseOver()
    const lineGroup = new Group()
    const textGroup = new Group()
    const circleGroup = new Group()
    const dragCircleGroup = new Group()
    const panel = new Group()

    panel.addChild(lineGroup, textGroup, circleGroup, dragCircleGroup)
    stage.addChild(panel)

    let { dispose, ticker, width, height } = stdStage(stage, {
      onResize: (ev, w, h) => {
        width = w
        height = h
        ticker.needsUpdate = true
        panel.set(
          getBackgroundData(700, 600, width, height, {
            padding: 50,
          })
        )
      },
    })
    panel.set(
      getBackgroundData(700, 600, width, height, {
        padding: 50,
      })
    )

    const texts = ['A', 'B', 'C']
    const triangle = [
      new Vector(50, 50),
      new Vector(600, 100),
      new Vector(400, 500),
    ].map((e, i) => {
      // @ts-ignore
      e.text = texts[i]
      return e
    })

    function drawLine() {
      const shape = new Shape()
      lineGroup.addChild(shape)

      shape.graphics
        .moveTo(triangle[0].x, triangle[0].y)
        .lineTo(triangle[1].x, triangle[1].y)
        .lineTo(triangle[2].x, triangle[2].y)
        .setStrokeStyle({ lineWidth: 1, color: '#999' })
        .closePath()
        .stroke()
    }

    function drawText(
      content: string | number,
      x = 0,
      y = 0,
      style = {} as any
    ) {
      const { fillStyle = '#999', fontSize = 16 } = style
      const text = new Shape()

      textGroup.addChild(text)

      text.graphics
        .setFillStyle(fillStyle)
        .setTextStyle({ font: `${fontSize}px arial` })
        .fillText(content as string, x, y)
    }

    function drawCircle(
      list = [] as any[],
      opt?: { fillStyle: string; radius: number }
    ) {
      const { fillStyle = '#f70', radius = 10 } = opt ?? {}
      const group = new Group()
      list.forEach((p: { x: number; y: number; text: string }, i) => {
        const shape = new Shape()
        shape.addAttr('circle')
        group.addChild(shape)

        shape.graphics
          .setFillStyle(fillStyle)
          .arc(p.x, p.y, radius, 0, Math.PI * 2)
          .fill()

        p.text && drawText(p.text, p.x + 20, p.y)
      })

      return group
    }

    function getRad(va: Vector, vb: Vector) {
      va = va.normalize()
      vb = vb.normalize()

      const sin = va.cross(vb)
      const cos = va.dot(vb)

      let theta = Math.asin(sin)
      return cos > 0 ? theta : Math.sign(sin) * Math.PI - theta
    }
    function update() {
      lineGroup.removeAllChildren()
      drawLine()

      const AB = triangle[1].substract(triangle[0])
      const AC = triangle[2].substract(triangle[0])
      const BA = triangle[0].substract(triangle[1])
      const BC = triangle[2].substract(triangle[1])
      const CA = triangle[0].substract(triangle[2])
      const CB = triangle[1].substract(triangle[2])

      const A = getRad(AB, AC)
      const B = getRad(BA, BC)
      const C = getRad(CA, CB)

      textGroup.removeAllChildren()
      drawText((A * rad2deg) | 0, triangle[0].x, triangle[0].y + 30, {
        fillStyle: '#6cf',
      })
      drawText((B * rad2deg) | 0, triangle[1].x, triangle[1].y + 30, {
        fillStyle: '#6cf',
      })
      drawText((C * rad2deg) | 0, triangle[2].x, triangle[2].y + 30, {
        fillStyle: '#6cf',
      })

      // 靠近AB线段的1/3平分线交点
      const p1 = getIntersetPoint(
        {
          source: triangle[0],
          direction: AB.rotate(A / 3),
        },
        {
          source: triangle[1],
          direction: BA.rotate(B / 3),
        }
      )

      // 靠近BC线段的1/3平分线交点
      const p2 = getIntersetPoint(
        {
          source: triangle[1],
          direction: BA.rotate((B / 3) * 2),
        },
        {
          source: triangle[2],
          direction: CA.rotate((C / 3) * 2),
        }
      )

      // 靠近AC线段的1/3平分线交点
      const p3 = getIntersetPoint(
        {
          source: triangle[0],
          direction: AB.rotate((A / 3) * 2),
        },
        {
          source: triangle[2],
          direction: CA.rotate(C / 3),
        }
      )

      const shape = new Shape()
      lineGroup.addChild(shape)
      shape.graphics
        .save()
        .beginPath()
        .setStrokeDash([5, 5])
        .setStrokeStyle({ color: '#aaa' })
        .beginPath()
        .moveTo(triangle[0].x, triangle[0].y)
        .lineTo(p1.x, p1.y)
        .setStrokeStyle({ lineWidth: 1 })
        .stroke()

      // A的1/3平分线(顺时针)
      // const posA2 = AB.rotate(A / 3).add(triangle[0])

      // A的2/3平分线(顺时针)
      const posA3 = AB.rotate((A / 3) * 2).add(triangle[0])
      shape.graphics
        .beginPath()
        .moveTo(triangle[0].x, triangle[0].y)
        .lineTo(p3.x, p3.y)
        .setStrokeStyle({ lineWidth: 1 })
        .stroke()

      // B的1/3平分线(逆时针)
      const posB2 = BA.rotate(B / 3).add(triangle[1])
      shape.graphics
        .beginPath()
        .moveTo(triangle[1].x, triangle[1].y)
        .lineTo(p1.x, p1.y)
        .setStrokeStyle({ lineWidth: 1 })
        .stroke()

      // B的2/3平分线(逆时针)
      const posB3 = BA.rotate((B / 3) * 2).add(triangle[1])
      shape.graphics
        .beginPath()
        .moveTo(triangle[1].x, triangle[1].y)
        .lineTo(p2.x, p2.y)
        .setStrokeStyle({ lineWidth: 1 })
        .stroke()

      // C的1/3平分线(顺时针)
      const posC2 = CA.rotate(C / 3).add(triangle[2])
      shape.graphics
        .beginPath()
        .moveTo(triangle[2].x, triangle[2].y)
        .lineTo(p3.x, p3.y)
        .setStrokeStyle({ lineWidth: 1 })
        .stroke()

      // C的2/3平分线(顺时针)
      const posC3 = CA.rotate((C / 3) * 2).add(triangle[2])
      shape.graphics
        .beginPath()
        .moveTo(triangle[2].x, triangle[2].y)
        .lineTo(p2.x, p2.y)
        .setStrokeStyle({ lineWidth: 1 })
        .stroke()
        .restore()

      circleGroup.removeAllChildren()
      circleGroup.addChild(
        drawCircle([p1, p2, p3], {
          radius: 5,
          fillStyle: 'green',
        })
      )

      shape.graphics
        .beginPath()
        .setStrokeStyle({ lineWidth: 5, color: '#c00' })
        .moveTo(p1.x, p1.y)
        .lineTo(p2.x, p2.y)
        .lineTo(p3.x, p3.y)
        .closePath()
        .stroke()
    }

    const dragContainer = drawCircle(triangle as any)
    dragContainer.children.forEach((shape, i) => {
      shape.cursor = 'pointer'
      const p = triangle[i]
      let pox: number, poy: number
      let sx: number, sy: number
      dragable(shape, {
        onPressdown: ev => {
          const tp = shape.parent.global2local(ev.x, ev.y) // transform pointer
          sx = tp.x
          sy = tp.y
          pox = p.x
          poy = p.y
        },
        onPressmove: (ev, ox: number, oy: number, dx: number, dy: number) => {
          const tp = shape.parent.global2local(ev.x, ev.y) // transform pointer
          p.x = pox + tp.x - sx
          p.y = poy + tp.y - sy
          update()
          ticker.needsUpdate = true
          return [ox + dx, oy + dy]
        },
      })
    })
    dragCircleGroup.addChild(dragContainer)
    update()

    function getIntersetPoint(ray: any, ray2: any) {
      if (ray.direction.isParallel(ray2.direction)) {
        return null
      }

      const src2srcVec = ray.source.substract(ray2.source)

      // 单位向量
      const vec = src2srcVec.normalize() // BA

      // sin(α), cos(α)
      const sinA = ray2.direction.cross(vec)
      const cosA = ray2.direction.dot(vec)

      // sin(β), cos(β)
      const sourceToVecN = vec.inverse()
      const sinB = ray.direction.cross(sourceToVecN)
      const cosB = ray.direction.dot(sourceToVecN)

      // 光源到挡板所在直线距离
      const d = src2srcVec.length * sinA

      // 光线和挡板所在直线交点, 光线的t
      const t = d / (sinA * cosB - sinB * cosA)

      // 光线和挡板所在直线交点
      const p = ray.source.add(ray.direction.scale(t))

      return p
    }

    ticker.on('frame', () => {
      stage.update()
    })
    return dispose
  }, [])
  return (
    <layout.CanvasBox>
      <canvas ref={canvasRef}></canvas>
    </layout.CanvasBox>
  )
}
