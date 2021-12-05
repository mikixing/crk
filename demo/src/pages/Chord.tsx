import React, { useEffect, useRef } from 'react'
import { Stage, Group, Shape, deg2rad } from '@mikixing/crk'
import { initCanvas, getRoundCircle, Vector } from '../util'

const data = {
  title: {
    text: '2021年国际旅游情况',
    font: '20px PingFangSC-Regular',
    color: '#333',
    top: 70,
  },
  labels: ['北京', '上海', '深圳', '广州', '长沙'],
  weights: [400, 200, 300, 100, 200, 132, 110, 100],
  links: [
    [10, 20, 11, 12, 30, 10, 50, 60, 10],
    [30, 40, 80, 20, 40, 10, 20, 20],
    [30, 40, 80, 20, 40, 11, 20, 15],
    [30, 40, 80, 20, 40, 34, 8],
    [30, 40, 80, 20, 40, 20, 10],
  ],
  radius: 250,
  thickness: 20,
  gap: 3, // 圆弧间的间隔角度
  style: {
    font: '20px PingFangSC-Regular',
    fontColor: '#333',
  },
  bordered: true,
}

function stdList(list: number[], len: number, val = 0): number[] {
  const ret = Array(len).fill(val)
  if (list?.length) {
    return ret.map((e, i) => list[i] ?? e)
  }

  return ret
}

export default function Diagram() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    const [width, height] = initCanvas(canvas)

    const stage = new Stage(canvas)

    const { title, labels, radius, thickness, gap, style, bordered } = data

    // 数据标准化
    const len = labels.length
    const origin = { x: width / 2, y: height / 2 }
    const totalGap = len * gap
    const totalAngle = 360 - totalGap

    // 权重
    const weights = stdList(data.weights, len)
    const weightSum = weights.reduce((a, w) => a + w)

    const links = labels.map((_, i) => {
      return stdList(data.links[i], len)
    })
    const sumList = labels.map((label, i) => {
      const link = links[i]
      return link.reduce((sum, n, j) => {
        const m = i === j ? 0 : links[j][i]
        return sum + n + m
      }, 0)
    })

    // 记录每段弧的开始角度,结束角度,比重
    const arcList = new Array(len).fill(0)
    arcList.reduce((lastAngle, _, i) => {
      const start = lastAngle
      const angle = (weights[i] / weightSum) * totalAngle
      const end = start + angle
      const idx = i

      arcList[i] = {
        start,
        angle,
        ca: start + angle / 2,
        label: labels[i],
        end,
        idx,
      }

      return end + gap
    }, 0)

    // 绘制
    drawTitle()
    drawContent()
    stage.update()

    function drawTitle() {
      const shape = new Shape()
      const g = shape.graphics
      ctx.save()
      ctx.font = title.font
      const textSizeObj = ctx?.measureText(title.text)
      g.setTextStyle({ font: title.font })
        .fillText(title.text, 0, 0)
        .setFillStyle(title.color)
        .fill()
      stage.addChild(shape)
      ctx.restore()

      shape.x = (width - textSizeObj.width) / 2
      shape.y = title.top
    }

    function drawContent() {
      const grp = new Group()
      // grp.alpha = 0.5
      const shape = new Shape()
      const g = shape.graphics
      grp.addChild(shape)
      stage.addChild(grp)

      grp.x = origin.x
      grp.y = origin.y

      links.reduce((lastAngle, link, i) => {
        const color = `hsl(${((i / len) * 360) | 0}, 50%, 60%)`
        const color2 = `hsla(${((i / len) * 360) | 0}, 50%, 60%, 70%)`
        const color3 = `hsl(${((i / len) * 360) | 0}, 50%, 40%)`

        // 权重归一化
        const weight = weights[i] / weightSum
        const startAngle = lastAngle
        const endAngle = startAngle + arcList[i].angle
        const startRad = startAngle * deg2rad
        const endRad = endAngle * deg2rad
        const ca = startAngle + arcList[i].angle / 2
        const r1 = radius // 大圆
        const r2 = radius - thickness // 小圆
        const sum1 = sumList[i]

        // 大圆
        getRoundCircle(g, {
          x: 0,
          y: 0,
          startAngle,
          endAngle,
          radius: r2,
          thickness: r1 - r2,
          startOuterRadius: 1000,
          endOuterRadius: 1000,
        })

        g.setFillStyle(color).fill()

        const list = arcList.slice()
        let count = i
        let isTraversed = true // 是否遍历
        let isLastChild = i === len - 1 // 是否是最后一个元素
        if (len === 1) return
        if (len === 2) {
          connectBar(i === 0 ? 1 : 0)
          connectBar(i === 0 ? 0 : 1)
        } else {
          while (isTraversed) {
            // 逆时针遍历
            count--
            if (isLastChild && count === 0) {
              isTraversed = false
              connectBar(i)
              connectBar(count)
            } else if (count < 0) {
              count = len - 1
              if (count === i + 1) {
                // 既是最后一个元素,又和遍历元素相邻
                isTraversed = false
                connectBar(i)
                connectBar(count)
              } else {
                connectBar(count)
              }
            } else if (count === i + 1) {
              // 和遍历元素相邻
              isTraversed = false
              connectBar(i)
              connectBar(count)
            } else {
              connectBar(count)
            }
          }
        }
        // 绘制条
        function connectBar(count: number) {
          const n = link[count]
          if (n <= 0) return
          // 目标总和
          const sum2 = sumList[count]

          // 角度
          const a1 = (n / sum1) * list[i].angle // 当前底座的角度
          const a2 = (n / sum2) * list[count].angle // 目标底座的角度
          const a3 = list[i].start
          const a4 = list[count].end

          let p0 = {
              x: Math.cos(deg2rad * a3) * r2,
              y: Math.sin(deg2rad * a3) * r2,
            },
            p2
          list[i].start = a3 + a1 // 当前底座

          if (i === count) {
            p2 = {
              x: Math.cos(deg2rad * a3) * r2,
              y: Math.sin(deg2rad * a3) * r2,
            }
            g.beginPath()
              .arc(0, 0, r2, deg2rad * a3, deg2rad * list[i].start)
              .quadraticCurveTo(0, 0, p2.x, p2.y)
          } else {
            list[count].end = a4 - a2 // 目标底座
            p2 = {
              x: Math.cos(deg2rad * list[count].end) * r2,
              y: Math.sin(deg2rad * list[count].end) * r2,
            }
            g.beginPath()
              .arc(0, 0, r2, deg2rad * a3, deg2rad * list[i].start)
              .quadraticCurveTo(0, 0, p2.x, p2.y)
              .arc(0, 0, r2, deg2rad * list[count].end, deg2rad * a4)
              .quadraticCurveTo(0, 0, p0.x, p0.y)
          }

          g.closePath()
            .setFillStyle(color2)
            .setStrokeStyle({ color: color3, join: 'round' })
            .fill()
          if (bordered) g.stroke()
        }

        // 文字
        // 圆弧起点,中点,结束点
        const sx = Math.cos(startRad) * r1
        const sy = Math.sin(startRad) * r1
        const cx = Math.cos(deg2rad * ca) * r1
        const cy = Math.sin(deg2rad * ca) * r1
        const ex = Math.cos(endRad) * r1
        const ey = Math.sin(endRad) * r1

        const { font, fontColor } = style
        ctx?.save()
        ctx.font = font
        const text = labels[i] ?? '未命名'
        const textSizeObj = ctx?.measureText(text)
        ctx?.restore()
        let { width: labelWidth, fontBoundingBoxAscent: labelHeight } =
          textSizeObj

        const v = new Vector(cx, cy)
        const vv = v
          .normalize()
          .scale(labelWidth / 2)
          .add(v)

        g.beginPath()
          .setFillStyle(fontColor)
          .setTextStyle({ font, baseline: 'middle', textAlign: 'center' })

        g.fillText(text, vv.x, vv.y).setFillStyle('#666')

        g.fill()
        return endAngle + gap
      }, 0)
    }
  }, [])

  return <canvas ref={canvasRef}></canvas>
}
