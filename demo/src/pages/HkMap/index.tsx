import React, { useEffect, useRef } from 'react'
import { Stage, Group, Shape } from '@mikixing/crk'
import { getBackgroundData, setWheel } from '../../util'
import { layout, stdStage } from '../../common'
import hkRegions from './hk'

const colors = [
  '#c89c33',
  '#87c53c',
  '#c46762',
  '#46c399',
  '#cb9ec9',
  '#ba5da3',
  '#f36621',
  '#cadb2b',
  '#999',
  '#4db748',
  '#eee669',
  '#67a3a1',
  '#ca9338',
]

export default function HkMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement

    const opt = {
      title: {
        top: 30,
        left: 100,
        text: 'Desktop Browser Market Share in 2016',
      },
      radius: 100,
      baseRadian: Math.PI / 8,
      data: [
        { y: 51.08, label: 'Chrome' },
        { y: 27.34, label: 'Internet Explorer' },
        { y: 10.62, label: 'Firefox' },
        { y: 5.02, label: 'Microsoft Edge' },
        { y: 4.07, label: 'Safari' },
        { y: 1.22, label: 'Opera' },
        { y: 0.44, label: 'Others' },
      ],
    }

    class Table {
      public canvas: HTMLCanvasElement
      public size: { width: number; height: number }
      public data: typeof hkRegions
      public labelPosition: any
      public stage: Stage
      public mapGrp: Group
      public noScaleGrp: Group
      public panelGrp: Group
      public mapShapes: Shape[]
      public textShapes: Shape[]
      public strokeShape: Shape
      public cps: { x: number; y: number }[] = []

      constructor(canvas: HTMLCanvasElement, opt: any) {
        this.canvas = canvas
        this.size = opt.size || { width: 800, height: 600 }
        this.data = hkRegions
        this.labelPosition = {}

        this.stage = new Stage(this.canvas)
        this.mapGrp = new Group()
        this.noScaleGrp = new Group()
        this.panelGrp = new Group()
        this.panelGrp.addChild(this.mapGrp)
        this.stage.addChild(this.panelGrp, this.noScaleGrp)

        this.stage.enableMouseOver()

        const len = hkRegions.length

        this.textShapes = Array(len)
        this.mapShapes = Array(len)

        Array(len)
          .fill(1)
          .forEach((v, i) => {
            this.mapGrp.addChild(
              (this.mapShapes[i] = new Shape()
                .set({ alpha: 0.7 })
                .addAttr('region'))
            )
            this.noScaleGrp.addChild((this.textShapes[i] = new Shape()))
          })

        this.noScaleGrp.addChild((this.strokeShape = new Shape()))
      }
      init() {
        let { width, height, ticker, dispose } = stdStage(this.stage, {
          onResize: () => {
            this.panelGrp.set(
              getBackgroundData(2500, 1500, width, height, {
                paddingTop: 30,
                paddingBottom: 30,
              })
            )
            this.setLabel()
          },
        })

        this.panelGrp.set(
          getBackgroundData(2500, 1500, width, height, {
            paddingTop: 30,
            paddingBottom: 30,
          })
        )

        ticker.on('frame', () => {
          this.stage.update()
        })
        ticker.needsUpdate = true

        this.setMap()
        this.setLabel()
        this.setStroke()

        const removeWheel = setWheel(this.panelGrp, () => {
          this.setLabel()
          this.setStroke()
          ticker.needsUpdate = true
        })

        this.mapGrp.delegate('mouseover', 'region', ev => {
          ;(ev.currentTarget as any).alpha = 1
          ticker.needsUpdate = true
        })

        this.mapGrp.delegate('mouseout', 'region', ev => {
          this.mapShapes.forEach(el => (el.alpha = 0.7))
          ticker.needsUpdate = true
        })

        return dispose
      }

      setMap() {
        const { data } = this

        data.forEach((region, idx) => {
          const g = this.mapShapes[idx].graphics

          g.beginPath()

          let minX = Infinity
          let minY = Infinity
          let maxX = -Infinity
          let maxY = -Infinity

          region.paths.forEach(verts => {
            verts.forEach((vert, i) => {
              if (i === 0) {
                g.moveTo(vert.x, vert.y)
              } else {
                g.lineTo(vert.x, vert.y)
              }

              minX = Math.min(minX, vert.x)
              minY = Math.min(minY, vert.y)

              maxX = Math.max(maxX, vert.x)
              maxY = Math.max(maxY, vert.y)
            })

            g.closePath()
          })

          g.setFillStyle(colors[idx % colors.length])
          g.fill()

          this.cps.push({
            x: (minX + maxX) / 2,
            y: (minY + maxY) / 2,
          })

          const textShape = this.textShapes[idx]
          const ox = (-region.name.length * 13) / 2

          textShape.ignoreEvent = true
          textShape.graphics
            .setTextStyle({ font: '12px Arial' })
            .setStrokeStyle({ color: '#eee', lineWidth: 1 })
            .setFillStyle('#333')
            .strokeText(region.name, ox)
            .fillText(region.name, ox)
        })
      }

      setLabel() {
        this.cps.forEach((cp, i) => {
          const pt = this.mapGrp.local2local(this.noScaleGrp, cp.x, cp.y)
          const textShape = this.textShapes[i]

          textShape.set(pt)
        })
      }

      setStroke() {
        const { data, strokeShape } = this
        const { graphics: g } = strokeShape

        g.clear()

        data.forEach((region, idx) => {
          g.beginPath()

          region.paths.forEach(verts => {
            verts.forEach((vert, i) => {
              const pt = this.mapGrp.local2local(
                this.noScaleGrp,
                vert.x,
                vert.y
              )

              if (i === 0) {
                g.moveTo(pt.x, pt.y)
              } else {
                g.lineTo(pt.x, pt.y)
              }
            })

            g.closePath()
          })

          g.setStrokeStyle({ color: '#666' }).stroke()
        })
      }
    }
    const table = new Table(canvas, opt)

    return table.init()
  }, [canvasRef])

  return (
    <layout.CanvasBox>
      <canvas ref={canvasRef}></canvas>
    </layout.CanvasBox>
  )
}
