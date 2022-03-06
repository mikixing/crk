import React, { useEffect, useRef, useState } from 'react'
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
import { message } from 'antd'
import { stdStage, layout } from '../../common'

class Shape extends RawShape {
  deformer?: Deformer
}

class Group extends RawGroup {
  deformer?: Deformer
}

export default function DeformerComponent() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [props, setProps] = useState<any>(null)

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

    setProps({
      name: 'file',
      action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
      headers: {
        authorization: 'authorization-text',
      },
      showUploadList: false,
      progress: { strokeWidth: 2, showInfo: true },
      onChange(info: any) {
        if (info.file.status === 'done' || info.file.status === 'error') {
          const file = info?.fileList?.[0].originFileObj as File
          uploadToDeformer(file, canvasRef.current as HTMLCanvasElement).then(
            deformer =>
              ((deformer as Deformer).bindTickerUpdate = () => {
                ticker.needsUpdate = true
              })
          )
          message.success(`${info.file.name} 上传成功`)
        }
      },
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
      ]

      const tf = [
        { x: 410.756, y: 262.673, scale: 0.390244 },
        { x: 1, y: 93.6792, scale: 0.664276 },
        { x: 181.524, y: 29.2517, scale: 0.518989 },
        { x: 235.858, y: 422.153, scale: 0.311792 },
        { x: 322.691, y: 121.848, scale: 0.222414 },
      ]

      const arr = await loadImage(images)
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

      // {
      //   const grp = new Group()
      //   const tmp = new Shape()
      //   tmp.graphics.rect(0, 0, 100, 100).setFillStyle('#f70').fill()
      //   const tmp2 = new Shape()
      //   tmp2.graphics.rect(200, 100, 100, 100).setFillStyle('#6cf').fill()
      //   bmGrp.addChild(grp)
      //   grp.addChild(tmp, tmp2)
      //   const deformer = addToDeformer(grp, 300, 300, canvas)
      //   deformer.bindTickerUpdate(() => (ticker.needsUpdate = true))
      // }

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
      <canvas ref={canvasRef}></canvas>
      {/* <Upload {...props} style={{ height: '60px' }}>
          <Button icon={<UploadOutlined />}>上传图片</Button>
        </Upload> */}
    </layout.CanvasBox>
  )
}
