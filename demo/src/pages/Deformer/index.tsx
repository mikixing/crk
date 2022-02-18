import React, { useEffect, useRef, useState } from 'react'
import Deformer from './deformer'
import {
  Stage,
  Group as RawGroup,
  Bitmap as RawBitmap,
  Shape as RawShape,
  Ticker,
  Bitmap,
} from '@mikixing/crk'
import { loadImage, getFileDataURL, setWheel } from '../../util'
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

    let bmGrp = new Group()
    let deformerGrp = new Group()

    const stage = new Stage(canvas)
    stage.enableMouseOver()
    stage.addChild(bmGrp, deformerGrp)

    const deformerList = [] as Deformer[]

    const removeWheel = setWheel(bmGrp, () => {
      deformerList.forEach(d => d.create())
      ticker.needsUpdate = true
    })

    let { ticker, dispose, width, height } = stdStage(stage, {
      onResize: (ev, w, h) => {
        width = w
        height = h
        bmShape.graphics
          .clear()
          .rect(0, 0, width, height)
          .setFillStyle('#aaa')
          .fill()
        ticker.needsUpdate = true
      },
    })

    // 灰色背景层
    const bmShape = new Shape()
    bmShape.on('pressdown', ev => {
      ticker.needsUpdate = true
      deformerList.forEach(deformer => {
        deformer.toggleActive(false)
      })
    })
    bmGrp.addChild(bmShape)
    bmShape.graphics
      .clear()
      .rect(0, 0, width, height)
      .setFillStyle('#aaa')
      .fill()

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

      return deformer
    }

    async function init(
      canvas: HTMLCanvasElement,
      width: number,
      height: number,
      ticker: Ticker
    ) {
      const images = [
        'http://localhost:3000/images/f.jpeg',
        'http://localhost:3000/images/fb.png',
      ]
      const arr = await loadImage(images)
      arr.forEach((img: HTMLImageElement, i) => {
        const bmImg = new Bitmap(img)

        const deformer = addToDeformer(
          bmImg,
          bmImg.source.width,
          bmImg.source.height,
          canvas
        )
        deformer.bindTickerUpdate(() => (ticker.needsUpdate = true))
      })

      ticker.needsUpdate = true

      {
        const grp = new Group()
        const tmp = new Shape()
        tmp.graphics.rect(0, 0, 100, 100).setFillStyle('#f70').fill()
        const tmp2 = new Shape()
        tmp2.graphics.rect(200, 100, 100, 100).setFillStyle('#6cf').fill()
        bmGrp.addChild(grp)
        grp.addChild(tmp, tmp2)
        const deformer = addToDeformer(grp, 300, 300, canvas)
        deformer.bindTickerUpdate(() => (ticker.needsUpdate = true))
      }

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
