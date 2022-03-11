import React, { useEffect, useRef, useState } from 'react'
import { Spin } from 'antd'
import Deformer from './deformer'
import {
  Stage,
  Group as RawGroup,
  Bitmap,
  Shape as RawShape,
  Ticker,
} from '@mikixing/crk'
import {
  loadImage,
  getFileDataURL,
  setWheel,
  getBackgroundData,
} from '../../util'
import { stdStage, layout } from '../../common'

class Shape extends RawShape {
  deformer?: Deformer
}

class Group extends RawGroup {
  deformer?: Deformer
}

export default function DeformerComponent() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement
    canvas.getContext('2d') as CanvasRenderingContext2D

    const deformerList = [] as Deformer[]

    const stage = new Stage(canvas)
    stage.enableMouseOver()

    let { ticker, dispose, width, height } = stdStage(stage, {
      onResize: (ev, w, h) => {
        width = w
        height = h
        ticker.needsUpdate = true
      },
    })

    let viewGrp = new Group()
    let bmGrp = new Group()
    let deformerGrp = new Group()
    let bgShape = new Shape()

    viewGrp.addChild(bmGrp, deformerGrp)
    stage.addChild(bgShape, viewGrp)

    const removeWheel = setWheel(bmGrp, () => {
      deformerList.forEach(d => d.update())
      ticker.needsUpdate = true
    })

    bgShape.setEventRect(0, 0, width, height)
    bmGrp.set(getBackgroundData(800, 600, width, height, { padding: 100 }))

    bgShape.on('pressdown', () => {
      deformerList.forEach(df => df.toggleActive(false))
      ticker.needsUpdate = true
    })

    // 创建变形器,填充页面
    init(canvas, width, height, ticker)

    ticker.needsUpdate = true
    ticker.on('frame', () => {
      stage.update()
    })

    return () => {
      dispose()
      removeWheel()
    }

    function addToDeformer(
      el: Shape | Group,
      width: number,
      height: number,
      canvas?: HTMLCanvasElement
    ) {
      bmGrp.addChild(el)

      let deformer = (el.deformer = new Deformer(
        el,
        width,
        height,
        deformerGrp
      ))
      deformer.openHover()
      deformerList.push(deformer)

      deformer.on('active', () => {
        deformerList.forEach(d => d !== deformer && d.toggleActive(false))
      })

      return deformer
    }

    async function init(
      canvas: HTMLCanvasElement,
      width: number,
      height: number,
      ticker: Ticker
    ) {
      const images = [
        '/images/2.png',
        '/images/1.png',
        '/images/5.png',
        '/images/4.png',
        '/images/3.png',
      ].map(p => `${process.env.PUBLIC_URL ?? ''}${p}`)

      const tf = [
        { x: 410.756, y: 262.673, scale: 0.390244 },
        { x: 1, y: 93.6792, scale: 0.664276 },
        { x: 181.524, y: 29.2517, scale: 0.518989 },
        { x: 235.858, y: 422.153, scale: 0.311792 },
        { x: 322.691, y: 121.848, scale: 0.222414 },
      ]

      const arr = await loadImage(images)
      setLoading(false)

      arr.forEach((img: HTMLImageElement, i) => {
        const bmImg = new Bitmap(img)

        bmImg.set(tf[i])

        const deformer = addToDeformer(
          bmImg,
          bmImg.source.width,
          bmImg.source.height,
          canvas
        )
        deformer.bindTickerUpdate(() => (ticker.needsUpdate = true))
      })

      ticker.needsUpdate = true

      canvas.addEventListener('drop', async (ev: any) => {
        const { dataTransfer: dt } = ev
        const list = [...dt.files]
        const file = list[0]

        switch (file.type) {
          case 'image/png':
          case 'image/gif':
          case 'image/jpeg': {
            uploadToDeformer(file, canvas).then(deformer => {
              ;(deformer as Deformer).bindTickerUpdate(
                () => (ticker.needsUpdate = true)
              )
            })
            break
          }
        }
      })
      ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        canvas.addEventListener(eventName, ev => {
          ev.preventDefault()
          ev.stopPropagation()
        })
      })
    }

    async function uploadToDeformer(file: File, canvas?: HTMLCanvasElement) {
      return new Promise(async (r, j) => {
        const dataURL = await getFileDataURL(file)
        const image = new Image() as any
        image.src = dataURL
        image.onload = function () {
          const bmImg = new Bitmap(image)
          r(
            addToDeformer(
              bmImg,
              bmImg.source.width,
              bmImg.source.height,
              canvas
            )
          )
        }
      })
    }
  }, [canvasRef])

  return (
    <layout.CanvasBox>
      {loading && (
        <Spin style={{ position: 'absolute', width: '100%', height: '100%' }} />
      )}
      <canvas ref={canvasRef}></canvas>
    </layout.CanvasBox>
  )
}
