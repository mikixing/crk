import React, { useEffect, useRef } from 'react'
import { Stage, Bitmap, Group, Matrix, deg2rad } from '@mikixing/crk'
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

      const images = [
        'http://localhost:3000/images/f.jpeg',
        'http://localhost:3000/images/haha.webp',
        'http://localhost:3000/images/f.jpeg',
        'http://localhost:3000/images/haha.webp',
      ]

      await loadImage(images).then(arr => {
        arr.forEach(img => {
          const cx = img.width / 2
          const cy = img.height / 2
          const x = cx + rand(0, width)
          const y = cy + rand(0, height)
          const scale = rand(0, 0.5)
          const rotation = rand(0, 360)

          const bm = new Bitmap(img)
          bm.x = x
          bm.y = y
          bm.rotation = rotation
          bm.scale = scale
          bm.regX = cx
          bm.regY = cy

          // bm.addListener('mouseover', ev => {
          //   console.log('mouseover')
          //   bm.transformMatrix = new Matrix()
          //     .translate(x, y)
          //     .rotate(rotation * deg2rad)
          //     .scale(scale * 2, scale * 2)
          //     .translate(-cx, -cy)
          // })
          // bm.addListener('mouseout', ev => {
          //   console.log('mouseout')
          //   bm.transformMatrix = new Matrix()
          //     .translate(x, y)
          //     .rotate(rotation * deg2rad)
          //     .scale(scale, scale)
          //     .translate(-cx, -cy)
          // })

          bm.addListener('rollover', ev => {
            console.log('rollover')
            bm.alpha = 0.5
          })
          bm.addListener('rollout', ev => {
            console.log('rollout')
            bm.alpha = 1
          })

          grp.addChild(bm)

          // const center = new Shape()
          // center.graphics
          //   .setFillStyle('green')
          //   .arc(x, y, 10, 0, Math.PI * 2)
          //   .fill()
          // grp.addChild(center)
        })
      })

      grp.addListener('pressdown', e => {
        const { x: startX, y: startY } = e
        const { x: ox, y: oy } = grp

        let pressmoveFn: (e: any) => void
        grp.addListener(
          'pressmove',
          (pressmoveFn = e => {
            const dx = e.x - startX
            const dy = e.y - startY
            grp.x = ox + dx
            grp.y = oy + dy
          })
        )

        let pressupFn: (e: any) => void
        grp.addListener(
          'pressup',
          (pressupFn = e => {
            grp.removeListener('pressmove', pressmoveFn)
            grp.removeListener('pressup', pressupFn)
          })
        )
      })

      stage.enableMouseOver(10)
      // stage.addListener('pressmove', ev => {
      //   console.log(`子节点冒泡`)
      // })
      grp.addListener('rollover', e => {
        // console.log(e.target)
      })
      grp.addListener('rollout', e => {
        // console.log(e.target)
      })

      update()
      return stage

      function update() {
        stage.update()
        requestAnimationFrame(update)
      }
    }
  }, [])
  return (
    <div>
      {/* <div
        style={{
          padding: '30px',
          marginTop: '30px',
          width: '500px',
          height: '500px',
        }}
      ></div> */}
      {/* <img
        src="http://localhost:3000/images/fb.png"
        alt=""
        style={{
          padding: '30px',
          marginTop: '30px',
          width: '500px',
          height: '500px',
        }}
      /> */}
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
