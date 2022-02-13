import React, { useEffect, useRef } from 'react'
import Deformer from './deformer'
import { Stage, Group, Bitmap as RawBitmap, Shape } from '@mikixing/crk'
import { initCanvas, loadImage, getFileDataURL } from '../../util'
import { Upload, message, Button } from 'antd'
import { UploadOutlined } from '@ant-design/icons'

class Bitmap extends RawBitmap {
  rect?: { x: number; y: number; width: number; height: number }
  deformer?: Deformer
}

const deformerList = [] as Deformer[]
let bmGrp: Group
let deformerGrp: Group

function addImageToDeformer(img: HTMLImageElement, canvas?: HTMLCanvasElement) {
  const bmImg = new Bitmap(img)
  const x = Math.random() * Math.max(80, canvas?.offsetWidth ?? 100)
  const y = Math.random() * Math.max(80, canvas?.offsetHeight ?? 100)
  bmImg.rect = {
    x,
    y,
    width: bmImg.source.width,
    height: bmImg.source.height,
  }

  bmImg.x = x
  bmImg.y = y
  bmImg.rotation = 45
  bmImg.scale = 0.2
  bmGrp.addChild(bmImg)
  // panelGrp.rotation = 30
  let { deformer } = bmImg as { deformer: Deformer }
  bmImg
    .on('mouseover', (ev: any) => {
      if (!deformer) {
        deformer = bmImg.deformer = new Deformer([bmImg], deformerGrp)
        deformerList.push(deformer)
      }
      deformer.toggleHover()
    })
    .on('mouseout', (ev: any) => {
      if (deformer.status === 'active') return
      deformer.toggleHover(false)
    })
    .on('pressdown', ev => {
      ev.stopPropagation()
      deformerList.forEach(d => {
        d.toggleActive(false)
        d.toggleHover(false)
      })
      deformer?.toggleActive?.()

      let ox = bmImg.x,
        oy = bmImg.y // target origin x, y
      let p1: { x: number; y: number } = bmImg.parent.global2local(ev.x, ev.y)
      let pressmoveFn: (ev: any) => void
      let pressupFn: (ev: any) => void
      bmImg.on(
        'pressmove',
        (pressmoveFn = ev => {
          const p2 = bmImg.parent.global2local(ev.x, ev.y) // 鼠标位置在bmGrp中对应的坐标
          bmImg.x = ox + p2.x - p1.x
          bmImg.y = oy + p2.y - p1.y
          deformer.update()
          deformer?.toggleActive?.()
        })
      )
      bmImg.on(
        'pressup',
        (pressupFn = ev => {
          bmImg.removeListener('pressmove', pressmoveFn)
          bmImg.removeListener('pressup', pressupFn)
        })
      )
    })
}

async function init(canvas: HTMLCanvasElement, width: number, height: number) {
  canvas.getContext('2d') as CanvasRenderingContext2D
  const stage = new Stage(canvas)
  bmGrp = new Group()
  deformerGrp = new Group()

  // 灰色背景层
  const bmShape = new Shape()
  bmShape.graphics.rect(0, 0, width, height).setFillStyle('#aaa').fill()
  bmShape.on('pressdown', ev => {
    deformerList.forEach(deformer => {
      deformer.toggleHover(false)
    })
  })
  bmGrp.addChild(bmShape)
  stage.addChild(bmGrp, deformerGrp)

  stage.mouseMoveOutside = true

  const images = [
    'http://localhost:3000/images/f.jpeg',
    'http://localhost:3000/images/fb.png',
  ]
  const arr = await loadImage(images)
  arr.forEach((img, i) => {
    addImageToDeformer(img, canvas)
  })

  stage.enableMouseOver(16)

  update()

  function update() {
    stage.update()
    requestAnimationFrame(update)
  }

  canvas.addEventListener('drop', async (ev: any) => {
    const { dataTransfer: dt } = ev
    const list = [...dt.files]
    const file = list[0]

    switch (file.type) {
      case 'image/png':
      case 'image/gif':
      case 'image/jpeg': {
        getImage(file, canvas)
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

async function getImage(file: File, canvas?: HTMLCanvasElement) {
  const dataURL = await getFileDataURL(file)
  const image = new Image() as any
  image.src = dataURL
  image.onload = function () {
    addImageToDeformer(image, canvas)
  }
}

export default function DeformerComponent() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement
    const [width, height] = initCanvas(
      canvas,
      canvas.offsetWidth,
      canvas.offsetHeight
    )
    init(canvas, width, height)
  }, [])

  const props = {
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
        getImage(file, canvasRef.current as HTMLCanvasElement)
        message.success(`${info.file.name} 上传成功`)
      }
    },
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}
    >
      <canvas ref={canvasRef}></canvas>
      <Upload {...props} style={{ height: '60px' }}>
        <Button icon={<UploadOutlined />}>上传图片</Button>
      </Upload>
    </div>
  )
}
