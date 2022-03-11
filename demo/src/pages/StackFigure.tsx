import { useEffect, useRef } from 'react'
import { Mask, Ticker } from '@mikixing/crk'
import { ease } from '@mikixing/transition'
import { layout, stdStage } from '../common'
import { Stage, Group as BaseGroup, Shape as BaseShape } from '@mikixing/crk'
import { getBackgroundData } from '../util'

interface ISeriesItem {
  name: string
  list: number[]
}

interface IData {
  title: Record<'text', string>
  legend: Record<'list', string[]>
  size: Record<'width' | 'height', number>
  grid: Record<'left' | 'right' | 'top' | 'bottom', number>
  data: {
    xAxis: {
      list: string[]
    }
    yAxis: {
      step: number
    }
    series: ISeriesItem[]
  }
}

interface ICustomSeriesItem extends ISeriesItem {
  visible: boolean
  accumulator: number[]
  idx: string
  color: string
}

interface IKnotsItem {
  idx: string
  color: string
  list: { x: number; y: number }[]
  alpha?: number
}

interface IStack {
  areaShape: Shape
  lineShape: Shape
  circleShape: Shape
  visible: boolean
  idx: string
  color: string
  data: IKnotsItem
}

class Shape extends BaseShape {
  public _data?: IKnotsItem
  public idx?: string
}

class Group extends BaseGroup {
  public idx?: string
}

const gap = 4
const textColor = '#555'
const dashColor = '#777'

export default function StackFigure() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const opt = {
      title: {
        text: '堆叠区域图',
      },
      legend: {
        list: ['邮件营销', '联盟广告', '视频广告', '直接访问', '搜索引擎'],
      },
      size: {
        width: 800,
        height: 600,
      },
      grid: {
        left: 30,
        right: 30,
        bottom: 30,
        top: 30,
      },
      data: {
        xAxis: {
          list: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        },
        yAxis: {
          step: 500,
        },
        series: [
          {
            name: '邮件营销',
            list: [120, 132, 101, 134, 90, 230, 210],
          },
          {
            name: '联盟广告',
            list: [220, 182, 191, 234, 290, 330, 310],
          },
          {
            name: '视频广告',
            list: [150, 232, 201, 154, 190, 330, 410],
          },
          {
            name: '直接访问',
            list: [320, 332, 301, 334, 390, 330, 320],
          },
          {
            name: '搜索引擎',
            list: [820, 932, 901, 2000, 1290, 1330, 1320],
          },
        ],
      },
    }

    class Table {
      public canvas: HTMLCanvasElement
      public title: { text: string }
      public legend: { list: string[] }
      public size: { width: number; height: number }
      public grid: { left: number; right: number; bottom: number; top: number }
      public data: {
        xAxis: {
          list: string[]
        }
        yAxis: {
          step: number
        }
        series: ISeriesItem[]
      }
      public target: null | Shape = null
      public stage: Stage
      public panelGrp: Group = new Group()
      public xUnit = 0
      public common = {} as {
        color: string[]
        colorAlpha: string[]
      }

      private customSeries: ICustomSeriesItem[] = []
      private stacks: IStack[] = []

      private lineGrp = new Group()
      private circleGrp = new Group()
      private graphGrp = new Group()
      private legendGrp = new Group()
      private axisGrp = new Group()
      private dashGrp = new Group()
      private contentGrp = new Group()

      private yCount?: number // 纵坐标格子

      private contentWidth: number = 0
      private contentHeight: number = 0
      private ticker: Ticker

      private dispose: Function

      private isInit = true

      private animationData = [] as any[]

      constructor(canvas: HTMLCanvasElement, opt: IData) {
        this.canvas = canvas

        this.contentGrp.cursor = 'pointer'

        this.stage = new Stage(this.canvas)
        this.panelGrp.addChild(this.legendGrp, this.contentGrp)
        this.contentGrp.addChild(this.axisGrp, this.graphGrp, this.dashGrp)
        this.stage.addChild(this.panelGrp)

        this.title = opt.title
        this.legend = opt.legend
        this.size = opt.size
        this.grid = opt.grid
        this.data = opt.data

        this.common.color = this.legend.list.map((_, i) => {
          return `hsl(${((i / 10) * 360) | 0}, 60%, 60%)`
        })
        this.common.colorAlpha = this.legend.list.map((_, i) => {
          return `hsl(${((i / 10) * 360) | 0}, 60%, 60%, 80%)`
        })

        let { width, height, ticker, dispose } = stdStage(this.stage, {
          onResize: (ev, w, h) => {
            width = w
            height = h
            this.panelGrp.set(
              getBackgroundData(800, 640, width, height, {
                paddingTop: 50,
                paddingBottom: 50,
              })
            )
            ticker.needsUpdate = true
          },
        })

        this.ticker = ticker
        this.dispose = dispose

        this.stage.enableMouseOver()

        this.panelGrp.set(
          getBackgroundData(800, 640, width, height, {
            paddingTop: 50,
            paddingBottom: 50,
          })
        )

        ticker.on('frame', () => this.stage.update())
        ticker.needsUpdate = true

        this.initBaseData()
        this.start()
        this.addEvent()

        this.stacks.forEach((item, index) => {
          const { areaShape, lineShape, circleShape } = item
          ;(areaShape.mask as Mask).x =
            (lineShape.mask as Mask).x =
            (circleShape.mask as Mask).x =
              -this.contentWidth
          this.animateInShow(areaShape.mask as Mask)
          this.animateInShow(lineShape.mask as Mask)
          this.animateInShow(circleShape.mask as Mask)
        })
      }

      initBaseData() {
        let { left = 30, right = 30, bottom = 30, top = 30 } = this.grid
        left = +left + 30 // 30为纵坐标刻度预留的空间
        top = +top + 60 // 60为标题预留的空间

        const { width, height } = this.size
        this.contentWidth = width - left - right - gap * 2
        this.contentHeight = height - top - bottom

        this.contentGrp.x = left
        this.contentGrp.y = top

        const bgShape = new Shape()
        bgShape.addAttr('area')
        bgShape.graphics
          .rect(0, 0, this.contentWidth + gap * 2, this.contentHeight)
          .setFillStyle('#fefefefe')
          .fill()
        this.contentGrp.addChild(bgShape)
        this.contentGrp.setChildIndex(bgShape, 0)

        const { xAxis = { list: [] } } = this.data
        this.xUnit = this.contentWidth / (xAxis.list.length - 1 ?? 1)
        this.setData()
      }

      private setData() {
        let seriesData: number[] = []
        const { yAxis = {}, series = [] } = this.data

        series.forEach(({ name, list }, i: number) => {
          const visible = this.customSeries[i]?.visible ?? true
          const idx = this.customSeries[i]?.idx ?? Math.random() + ''
          const color = this.customSeries[i]?.color ?? this.common.color[i]

          this.customSeries[i] = {
            idx,
            name,
            list,
            visible,
            color,
            accumulator: [],
          }
          if (!visible) return
          list.reduce(
            (accumulator: number[], currentValue: number, index: number) => {
              this.customSeries[i].accumulator[index] = accumulator[index] =
                currentValue + (seriesData[index] || 0)
              return accumulator
            },
            seriesData
          )
        })
        let maxValue = Math.max(...seriesData)
        const { step } = yAxis as { step: number }
        this.yCount = Math.ceil(maxValue / step)
      }

      start() {
        this.setAxis()
        this.setAreaData()
        this.setArea()
        this.setLegend()
      }

      setDash(x: number, y: number) {
        this.dashGrp.ignoreEvent = true
        this.dashGrp.removeAllChildren()
        const xDashShape = new Shape()
        const yDashShape = new Shape()

        this.dashGrp.addChild(xDashShape, yDashShape)

        xDashShape.graphics
          .moveTo(0, y)
          .lineTo(this.contentWidth + gap, y)
          .setStrokeDash([2, 5])
          .setStrokeStyle({ color: dashColor })
          .stroke()

        const xIndex = Math.round(x / this.xUnit)
        const d = xIndex * this.xUnit + gap
        yDashShape.graphics
          .moveTo(d, 0)
          .lineTo(d, this.contentHeight + gap)
          .setStrokeDash([2, 5])
          .setStrokeStyle({ color: dashColor })
          .stroke()

        const box1 = new Group()
        box1.x = -40
        box1.y = y - 3 * gap
        const tagShape1 = new Shape()
        tagShape1.graphics
          .rect(-gap * 5, 0, gap * 15, gap * 5)
          .setFillStyle('#fff')
          .setShadow({
            shadowColor: '#0005',
            shadowOffsetX: 0,
            shadowOffsetY: 2,
            shadowBlur: 6,
          })
          .fill()

        const { step } = this.data.yAxis
        const num =
          (1 - y / this.contentHeight) * step * (this.yCount as number)
        const text1 = new Shape()
        text1.graphics.setFillStyle(textColor).fillText(num.toFixed(2)).fill()
        text1.x = -gap * 2
        text1.y = gap * 3.5

        box1.addChild(tagShape1, text1)

        const box2 = new Group()
        box2.x = d
        box2.y = this.contentHeight + gap * 2
        const tagShape2 = new Shape()
        tagShape2.graphics
          .rect(-gap * 5, 0, gap * 10, gap * 5)
          .setFillStyle('#fff')
          .setShadow({
            shadowColor: '#0005',
            shadowOffsetX: 0,
            shadowOffsetY: 2,
            shadowBlur: 6,
          })
          .fill()

        const { list } = this.data.xAxis
        const text2 = new Shape()
        text2.graphics.setFillStyle(textColor).fillText(list[xIndex]).fill()
        text2.x = -gap * 2
        text2.y = gap * 3.5

        box2.addChild(tagShape2, text2)
        this.dashGrp.addChild(box1, box2)
      }

      removeDash() {
        this.dashGrp.removeAllChildren()
      }

      setLegend() {
        this.legendGrp.removeAllChildren()

        let { left = 30 } = this.grid
        this.legendGrp.x = left
        let text = new Shape()
        text.graphics
          .setTextStyle({ font: '18px Arial' })
          .setFillStyle(textColor)
          .fillText(this.title.text)
        this.legendGrp.addChild(text)

        this.customSeries.forEach((item: ICustomSeriesItem, i: number) => {
          const { name, visible, idx, color: originColor } = item
          const x = i * 120 + 180
          const ww = 20
          const h = -5
          const radius = 4
          let color = visible ? originColor : '#eee'
          let shape = new Shape()
          let g = shape.graphics
          g.beginPath()
            .setStrokeStyle({ lineWidth: 2, color })
            .moveTo(x, h)
            .lineTo(x + ww, h)
            .stroke()
            .beginPath()
            .setFillStyle('#fff')
            .arc(x + ww / 2, h, radius, 0, Math.PI * 2)
            .fill()
            .stroke()

          let text = new Shape()
          text.graphics
            .setTextStyle({ font: '12px Arial' })
            .setFillStyle(color)
            .fillText(name)
          text.x = x + 27
          text.y = 0

          let eventShape = new Shape()
          eventShape.setEventRect(x - 10, h * 2.7, 100, 20)

          let box = new Group()
          box.cursor = 'pointer'
          box.idx = idx
          box.addAttr('legend')
          box.addChild(eventShape, shape, text)
          this.legendGrp.addChild(box)
        })
      }

      setAxis() {
        const { xAxis = { list: [] }, yAxis = {} } = this.data
        const { step } = yAxis as any

        this.axisGrp.x = gap
        this.axisGrp.removeAllChildren()

        // x轴
        const xLine = new Shape()
        xLine.graphics
          .moveTo(0, this.contentHeight)
          .lineTo(this.contentWidth, this.contentHeight)
          .setStrokeStyle({ color: textColor })
          .stroke()
        this.axisGrp.addChild(xLine)
        xAxis.list.forEach((item: any, i: number) => {
          let text = new Shape()
          text.graphics
            .setTextStyle({ font: '12px Arial' })
            .setFillStyle(textColor)
            .fillText(item)
            .beginPath()
            .moveTo(12, -14)
            .lineTo(12, -20)
            .setStrokeStyle({ color: textColor })
            .stroke()
          text.x = i * this.xUnit - 12
          text.y = this.contentHeight + 20
          this.axisGrp.addChild(text)
        })

        // y轴
        const yCount = this.yCount as number
        const yUnit = this.contentHeight / yCount

        for (let i = 0; i <= yCount; i++) {
          let count = yCount - i
          let y = count * yUnit
          let text = new Shape()

          text.graphics
            .setTextStyle({ font: '12px Arial', textAlign: 'right' })
            .setFillStyle(textColor)
            .fillText(step * i + '')
          text.x = -10
          text.y = y + gap
          this.axisGrp.addChild(text)

          let lineShape = new Shape()
          lineShape.graphics
            .setStrokeStyle({ color: '#ddd' })
            .moveTo(0, y)
            .lineTo(this.contentWidth, y)
            .stroke()
          this.axisGrp.addChild(lineShape)
        }
      }

      setAreaData() {
        const { step } = this.data.yAxis
        const yTotal = (this.yCount as number) * step
        const renderSeries = this.customSeries.filter(item => item.visible)
        renderSeries.forEach((obj, i) => {
          const { accumulator, idx, color } = obj
          const knots = [] as { x: number; y: number }[]
          const data = { idx, color, list: knots }
          accumulator.forEach((v, j) => {
            knots.push({
              x: j * this.xUnit,
              y: this.contentHeight - (v / yTotal) * this.contentHeight,
            })
          })

          if (i === 0) {
            Array(accumulator.length)
              .fill(1)
              .forEach((_, j) => {
                knots.push({
                  x: (accumulator.length - 1 - j) * this.xUnit,
                  y: this.contentHeight,
                })
              })
          } else {
            const lastList = renderSeries[i - 1].accumulator
            let k = lastList.length
            while (k--) {
              knots.push({
                x: k * this.xUnit,
                y:
                  this.contentHeight -
                  (lastList[k] / yTotal) * this.contentHeight,
              })
            }
          }

          const stack = this.stacks.find(item => idx === item.idx) as IStack
          if (!stack) {
            const areaShape = new Shape()
            const lineShape = new Shape()
            const circleShape = new Shape()
            areaShape.addAttr('area')
            areaShape.idx = idx

            const mask = new Mask()
            mask.rect(0, 0, this.contentWidth + gap * 2, this.contentHeight)
            areaShape.mask = lineShape.mask = circleShape.mask = mask

            this.graphGrp.addChild(areaShape)
            this.lineGrp.addChild(lineShape)
            this.circleGrp.addChild(circleShape)
            this.stacks[i] = {
              idx,
              visible: true,
              color,
              data,
              areaShape,
              lineShape,
              circleShape,
            }
          } else {
            stack.data = data
          }
        })
        if (this.isInit) {
          this.graphGrp.cursor = 'pointer'
          this.graphGrp.addChild(this.lineGrp, this.circleGrp)
          this.isInit = false
        }
      }

      setArea(data?: IStack[]) {
        const { xAxis } = this.data
        const xl = xAxis.list.length
        const drawData = data || this.stacks.filter(item => item.visible)
        drawData.forEach(obj => {
          const { data: d, color, areaShape, lineShape, circleShape } = obj
          const knots = d.list

          areaShape.x = lineShape.x = circleShape.x = gap
          areaShape.alpha = 0.5

          const ag = areaShape.graphics
          const lg = lineShape.graphics
          const cg = circleShape.graphics
          ag.clear()
          lg.clear()
          cg.clear()

          knots.forEach((pt, j) => {
            if (j === 0) {
              ag.moveTo(pt.x, pt.y)
              lg.moveTo(pt.x, pt.y)
              cg.arc(pt.x, pt.y, 2, 0, Math.PI * 2)
                .setStrokeStyle({
                  color,
                  lineWidth: 2,
                })
                .setFillStyle('#fff')
                .fill()
                .stroke()
            } else {
              ag.lineTo(pt.x, pt.y)

              if (j >= xl) return
              lg.lineTo(pt.x, pt.y)
              cg.beginPath()
                .arc(pt.x, pt.y, 2, 0, Math.PI * 2)
                .setStrokeStyle({
                  color,
                  lineWidth: 2,
                })
                .setFillStyle('#fff')
                .fill()
                .stroke()
            }
          })

          ag.closePath().setFillStyle(color).fill()

          lg.setStrokeStyle({
            color,
            lineWidth: 2,
          }).stroke()
        })
      }

      animateInShow(mask: Mask) {
        ease(mask, {
          x: 0,
          duration: 800,
          onUpdate: (src, key, val, p) => {
            ;(mask as Mask).x = val
            this.ticker.needsUpdate = true
          },
        })
      }

      animateInMovement(
        src: IKnotsItem[],
        dst: IKnotsItem[],
        idx: string,
        visible: boolean
      ) {
        dst.forEach((item, i) => {
          const { list, idx } = item
          const srcObj = {} as Record<string, number>
          const dstObj = {} as Record<string, number | Function>
          dstObj.duration = 500
          for (let j = 0; j < list.length; j++) {
            const de = list[j]
            const se = (src.find(item => item.idx === idx) as IKnotsItem).list[
              j
            ]
            dstObj['y' + j] = de.y
            srcObj['y' + j] = se.y
          }
          dstObj.onUpdate = (
            src: Record<string, number>,
            key: string,
            val: number,
            p: number
          ) => {
            const index = +key.split('y')[1]
            list[index].y = val
            if (index === list.length - 1) {
              const stack = this.stacks.filter(item => item.idx === idx)

              stack[0].visible && this.setArea(stack)
              this.ticker.needsUpdate = true
            }
          }
          let data = this.animationData.find(item => item.idx === idx) as any
          if (data) {
            Object.assign(data, srcObj)
          } else {
            data = srcObj
            data.idx = idx
            this.animationData.push(data)
          }
          ease(data, dstObj)
        })

        if (visible) {
          const stack = this.stacks.filter(item => item.idx === idx)
          const {
            areaShape,
            lineShape,
            circleShape,
            data: knots,
            color,
          } = stack[0]
          this.setArea(stack)
          ;(areaShape.mask as Mask).x =
            (lineShape.mask as Mask).x =
            (circleShape.mask as Mask).x =
              -this.contentWidth
          this.animateInShow(areaShape.mask as Mask)
          this.animateInShow(lineShape.mask as Mask)
          this.animateInShow(circleShape.mask as Mask)

          const arr = knots.list.slice(0, this.data.xAxis.list.length)

          const cg = circleShape.graphics
          cg.clear()

          arr.forEach(() => {
            ease(
              { radius: 0 },
              {
                radius: 2,
                duration: 800,
                onUpdate: (src, key, val, p) => {
                  circleShape.graphics.clear()
                  arr.forEach(pt => {
                    cg.beginPath()
                      .moveTo(pt.x, pt.y)
                      .arc(pt.x, pt.y, val, 0, Math.PI * 2)
                      .setStrokeStyle({
                        color,
                        lineWidth: 2,
                      })
                      .setFillStyle('#fff')
                      .fill()
                      .stroke()
                  })
                  this.ticker.needsUpdate = true
                },
              }
            )
          })
        }
      }

      addEvent() {
        this.canvas.addEventListener('mousemove', ev => {
          if (!this.target) return
          const { x, y } = this.stage.getMouseCoordinateOnCanvas(ev)
          const tp = this.dashGrp.global2local(x, y)

          if (y < this.contentGrp.y) return
          this.setDash(tp.x, tp.y)

          this.ticker.needsUpdate = true
        })

        this.contentGrp.delegate('mouseover', 'area', ev => {
          const target = ev.target as Shape
          if (this.target) this.target.alpha = 0.5
          this.target = target
          target.alpha = 0.8

          const tp = this.dashGrp.global2local(ev.x, ev.y)
          this.setDash(tp.x, tp.y)

          this.ticker.needsUpdate = true
        })

        this.contentGrp.delegate('mouseout', 'area', ev => {
          if (this.target) this.target.alpha = 0.5
          this.target = null

          this.removeDash()

          this.ticker.needsUpdate = true
        })

        this.legendGrp.delegate('click', 'legend', ev => {
          const { idx = '' } = ev.currentTarget as Group
          const { visible: currentVisible } = this.stacks.find(
            item => item.idx === idx
          ) as IStack

          const src = this.stacks.map(item => item.data)
          this.setVisible(idx, !currentVisible)
          this.setData()
          this.setAreaData()
          this.setLegend()
          this.setAxis()

          const movementList = this.stacks.map(it => it.data)
          movementList.length > 0 &&
            this.animateInMovement(src, movementList, idx, !currentVisible)
        })
      }

      private setVisible(idx: string, visible: boolean) {
        const stack = this.stacks.find(item => item.idx === idx) as IStack
        const { areaShape, lineShape, circleShape } = stack
        const target = this.customSeries.find(
          item => item.idx === idx
        ) as ICustomSeriesItem
        target.visible =
          stack.visible =
          areaShape.visible =
          lineShape.visible =
          circleShape.visible =
            visible
      }

      destroy() {
        this.dispose()
      }
    }
    const table = new Table(canvasRef.current as HTMLCanvasElement, opt)
    return () => {
      table.destroy()
    }
  }, [canvasRef])
  return (
    <layout.CanvasBox>
      <canvas ref={canvasRef}></canvas>
    </layout.CanvasBox>
  )
}
