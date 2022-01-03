import { useEffect, useRef } from 'react'
import { Stage, Bitmap, Group, Shape } from '@mikixing/crk'
import { initCanvas, loadImage, rand } from '../util'

export default function DetectCollision() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const [width, height] = initCanvas(canvasRef.current as HTMLCanvasElement)
    initStage(canvasRef.current as HTMLCanvasElement)

    async function initStage(canvas: HTMLCanvasElement) {
      const stage = new Stage(canvas)
      const grp = new Group()
      stage.addChild(grp)

      // const images = [
      //   'http://localhost:3000/images/f.jpeg',
      //   'http://localhost:3000/images/haha.webp',
      //   'http://localhost:3000/images/f.jpeg',
      //   'http://localhost:3000/images/haha.webp',
      // ]

      // await loadImage(images).then(arr => {
      //   arr.forEach(img => {
      //     const cx = img.width / 2
      //     const cy = img.height / 2
      //     const x = cx + rand(0, width)
      //     const y = cy + rand(0, height)
      //     const scale = rand(0, 0.5)
      //     const rotation = rand(0, 360)

      //     const bm = new Bitmap(img)
      //     bm.x = x
      //     bm.y = y
      //     bm.rotation = rotation
      //     bm.scale = scale
      //     bm.regX = cx
      //     bm.regY = cy

      //     bm.addListener('rollover', ev => {
      //       console.log('rollover')
      //       bm.alpha = 0.5
      //     })
      //     bm.addListener('rollout', ev => {
      //       console.log('rollout')
      //       bm.alpha = 1
      //     })

      //     grp.addChild(bm)
      //   })
      // })
      grp.rotation = 30
      grp.x = 200
      grp.y = 0
      // grp.scale = 2
      {
        const shape = new Shape()
        grp.addChild(shape)
        shape.graphics.setFillStyle('#f70').rect(100, 100, 100, 100).fill()

        shape.setEventRect(100, 100, 10, 10)
        shape.on('click', ev => {
          console.log(ev)
        })
      }
      {
        const shape = new Shape()
        grp.addChild(shape)
        shape.graphics.setFillStyle('#0087').rect(100, 100, 10, 10).fill()

        shape.cache(100, 100, 10, 10, 10)

        shape.ignoreEvent = true
        shape.on('click', ev => {
          console.log(222)
        })
      }

      update()
      return stage

      function update() {
        stage.update()
        // requestAnimationFrame(update)
      }
    }
  }, [])
  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{
          padding: '30px',
          marginTop: '30px',
          width: '500px',
          height: '800px',
        }}
      ></canvas>
    </div>
  )
}
