import React, { useEffect, useRef, useState } from 'react'
import Deformer from './deformer'
import { Stage, Group, Bitmap as RawBitmap } from '@mikixing/crk'
import { initCanvas, loadImage } from '../../util'

// import style from './module.less'

class Bitmap extends RawBitmap {
  rect?: { x: number; y: number; width: number; height: number }
  deformer?: Deformer
}

const deformerList = [] as Deformer[]
let bmGrp: Group
let deformerGrp: Group

function addImage(img: HTMLImageElement) {
  const bm = new Bitmap(img)
  const x = Math.random() * 100
  const y = Math.random() * 100
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
    })
}

async function init(canvas: HTMLCanvasElement) {
  canvas.getContext('2d') as CanvasRenderingContext2D
  initCanvas(canvas, 600, 500)
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
    addImage(img)
  })

  stage.enableMouseOver(16)

  update()

  function update() {
    stage.update()
    requestAnimationFrame(update)
  }
}

// function useRequest (data) {
//   const [res, setRes] = useState(null)
//   const [loading, setLoading] = useState(false)

//   const exec = () => {
//     setLoading(true)
//     data.axios.then(res => {
//       setLoading(false)
//       setRes(res)
//     })
//     .catch() {

//     }
//   }

//   return {
//     res,
//     loading,
//     exec
//   }
// }

export default function DeformerComponent() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement
    init(canvas)
  }, [])

  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const input = inputRef.current as HTMLInputElement
    input.onchange = function (e) {
      const file = input?.files?.[0] as File
      const fileReader = new FileReader()
      fileReader.readAsDataURL(file) //读取图片
      fileReader.addEventListener('load', function () {
        // 读取完成
        let res = fileReader.result as ArrayBuffer
        // res是base64格式的图片
        const image = new Image()
        image.onload = function () {
          addImage(image)
        }
        image.src = `${res}`
      })
    }
  }, [])

  return (
    <>
      <canvas
        style={{ width: '600px', height: '500px', backgroundColor: '#edf9ed' }}
        ref={canvasRef}
        onMouseOver={function () {
          console.log('mouseover')
        }}
      ></canvas>
      <input ref={inputRef} type="file" accept="image/*" />
    </>
  )
}
