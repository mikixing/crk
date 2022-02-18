import React, { useEffect, useRef } from 'react'
import { Stage, Group, Shape as BaseShape, deg2rad } from '@mikixing/crk'
import { ease } from '@mikixing/transition'
import { getRoundCircle, Vector } from '../util'
import { layout, stdStage } from '../common'

class Shape extends BaseShape {
  public type?: string = ''
}

const data = {
  title: {
    text: '',
    font: '16px PingFangSC-Regular',
    color: '#6cf',
    top: 0,
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
  radius: 300,
  thickness: 20,
  gap: 3, // 圆弧间的间隔角度
  style: {
    font: '16px PingFangSC-Regular',
    fontColor: '#666',
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
    const stage = new Stage(canvas)

    let { width, height, ticker, dispose } = stdStage(stage)

    ticker.on('frame', () => {
      stage.update()
    })

    const containerGrp = new Group()
    containerGrp.y = 100
    stage.addChild(containerGrp)

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
        ca: start + angle / 2, // current angle
        label: labels[i],
        end,
        idx,
      }

      return end + gap
    }, 0)

    stage.enableMouseOver(10)
    // 绘制
    title.text && drawTitle()
    drawContent()

    function drawTitle() {
      const shape = new Shape()
      const g = shape.graphics
      ctx.save()
      ctx.font = title.font
      const textSizeObj = ctx?.measureText(title.text)
      g.setTextStyle({ font: title.font })
        .setFillStyle(title.color)
        .fillText(title.text, 0, 0)
        .fill()
      containerGrp.addChild(shape)
      ctx.restore()

      shape.x = 20 //(width - textSizeObj.width) / 2
      shape.y = 20 //title.top
    }

    function drawContent() {
      const grp = new Group()
      containerGrp.addChild(grp)
      grp.x = origin.x
      grp.y = 300

      let timer: NodeJS.Timeout

      grp.on('mouseover', ev => {
        const { target } = ev
        grp.children.forEach(child => {
          if (target.type === 'base' || target.type === 'text') {
            if ((child as Group).getChildIndex(target) > -1) return
          }
          const children = (child as Group).children as Shape[]
          children.forEach((item: Shape) => {
            if (
              item !== target &&
              item.type !== 'base' &&
              item.type !== 'text'
            ) {
              ease(item, {
                alpha: 0.2,
                duration: 300,
                onUpdate: () => (ticker.needsUpdate = true),
              })
            }
          })
        })
      })
      grp.on('mouseout', ev => {
        const { target } = ev
        clearTimeout(timer)
        grp.children.forEach(child => {
          const children = (child as Group).children as Shape[]
          children.forEach((item: Shape) => {
            ease(item, {
              alpha: 1,
              duration: 300,
              onUpdate: () => (ticker.needsUpdate = true),
            })
          })
        })
      })

      links.reduce((lastAngle, link, i) => {
        const color = `hsl(${((i / len) * 360) | 0}, 50%, 60%)`
        const color2 = `hsla(${((i / len) * 360) | 0}, 50%, 60%, 80%)`
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

        const group = new Group()
        grp.addChild(group)

        {
          const shape = new Shape()
          shape.type = 'base'
          const g = shape.graphics
          group.addChild(shape)

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
        }

        const shape = new Shape()
        shape.type = 'bar'
        const g = shape.graphics
        group.addChild(shape)
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

        {
          // 文字
          // 圆弧起点,中点,结束点
          const shape = new Shape()
          shape.type = 'text'
          group.addChild(shape)
          const g = shape.graphics
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
          const vv = v.normalize().scale(labelWidth).add(v)

          g.beginPath()
            .setFillStyle(fontColor)
            .setTextStyle({ font, baseline: 'middle', textAlign: 'center' })
          g.fillText(text, vv.x, vv.y).setFillStyle('#666')
          g.fill()

          shape.setEventRect(
            vv.x - labelWidth / 2,
            vv.y - labelHeight / 2,
            labelWidth,
            labelHeight
          )
        }
        return endAngle + gap
      }, 0)
    }

    return dispose
  }, [])

  return (
    <layout.CanvasBox>
      <canvas ref={canvasRef}></canvas>
    </layout.CanvasBox>
  )
}
