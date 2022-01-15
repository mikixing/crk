import React, { useEffect, useRef, useState } from 'react'
import Deformer from './deformer'
import { Stage, Group, Bitmap as RawBitmap } from '@mikixing/crk'
import { initCanvas, loadImage, getFileDataURL, getFileText } from '../../util'
import { Upload, message, Button } from 'antd'
import { UploadOutlined } from '@ant-design/icons'

class Bitmap extends RawBitmap {
  rect?: { x: number; y: number; width: number; height: number }
  deformer?: Deformer
}

const deformerList = [] as Deformer[]
let bmGrp: Group
let deformerGrp: Group

function addImage(img: HTMLImageElement, canvas?: HTMLCanvasElement) {
  const bm = new Bitmap(img)
  const x = Math.random() * Math.max(80, canvas?.offsetWidth ?? 100)
  const y = Math.random() * Math.max(80, canvas?.offsetHeight ?? 100)
  bm.rect = {
    x,
    y,
    width: bm.source.width,
    height: bm.source.height,
  }

  bm.x = x
  bm.y = y
  bm.rotation = 45
  bm.scale = 0.2
  bmGrp.addChild(bm)
  // panelGrp.rotation = 30
  let { deformer } = bm as { deformer: Deformer }
  bm.on('mouseover', (ev: any) => {
    if (!deformer) {
      deformer = bm.deformer = new Deformer([bm], deformerGrp)
      deformerList.push(deformer)
    }
    deformer.toggleHover()
  })
    .on('mouseout', (ev: any) => {
      if (deformer.status === 'active') return
      deformer.toggleHover(false)
    })
    .on('pressdown', ev => {
      deformerList.forEach(d => {
        d.toggleActive(false)
        d.toggleHover(false)
      })
      deformer?.toggleActive?.()

      let ox = bm.x,
        oy = bm.y // target origin x, y
      let p1: { x: number; y: number } = bm.parent.global2local(ev.x, ev.y)
      let pressmoveFn: (ev: any) => void
      let pressupFn: (ev: any) => void
      bm.on(
        'pressmove',
        (pressmoveFn = ev => {
          const p2 = bm.parent.global2local(ev.x, ev.y) // 鼠标位置在bmGrp中对应的坐标
          bm.x = ox + p2.x - p1.x
          bm.y = oy + p2.y - p1.y
          deformer.update()
          deformer?.toggleActive?.()
        })
      )
      bm.on(
        'pressup',
        (pressupFn = ev => {
          bm.removeListener('pressmove', pressmoveFn)
          bm.removeListener('pressup', pressupFn)
        })
      )
    })
}

async function init(canvas: HTMLCanvasElement) {
  canvas.getContext('2d') as CanvasRenderingContext2D
  const stage = new Stage(canvas)
  bmGrp = new Group()
  deformerGrp = new Group()

  stage.addChild(bmGrp, deformerGrp)

  stage.mouseMoveOutside = true

  const images = [
    'http://localhost:3000/images/f.jpeg',
    'http://localhost:3000/images/fb.png',
  ]
  const arr = await loadImage(images)
  arr.forEach((img, i) => {
    addImage(img, canvas)
  })

  stage.enableMouseOver(16)

  update()

  function update() {
    stage.update()
    requestAnimationFrame(update)
  }

  canvas.addEventListener('drop', async (ev: any) => {
    const list = ev.files
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
}

async function getImage(file: File, canvas?: HTMLCanvasElement) {
  const dataURL = await getFileDataURL(file)
  const image = new Image() as any
  image.src = dataURL
  image.onload = function () {
    addImage(image, canvas)
  }
}

export default function DeformerComponent() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement
    initCanvas(canvas, canvas.offsetWidth, canvas.offsetHeight)
    init(canvas)
  }, [])

  const props = {
    name: 'file',
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    headers: {
      authorization: 'authorization-text',
    },
    onChange(info: any) {
      if (info.file.status === 'done' || info.file.status === 'error') {
        const file = info?.fileList?.[0].originFileObj as File
        getImage(file, canvasRef.current as HTMLCanvasElement)
      }
    },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <canvas
        style={{ backgroundColor: '#edf9ed', height: '80%' }}
        ref={canvasRef}
      ></canvas>
      <Upload {...props} style={{ height: '60px' }}>
        <Button icon={<UploadOutlined />}>上传图片</Button>
      </Upload>
    </div>
  )
}
