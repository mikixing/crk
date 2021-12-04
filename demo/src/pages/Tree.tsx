import React, { useEffect, useRef } from 'react'
import { Stage, Group, Shape } from '@mikixing/crk'
import { initCanvas, setRoundRect } from '../util'

interface Node {
  name: string
  children?: Node[]
}

const data: Node = {
  name: 'aaa',
  children: [
    {
      name: 'bbb',
      children: [
        { name: 'ccc', children: [] },
        { name: 'ddd', children: [] },
        { name: 'eee', children: [] },
      ],
    },

    { name: 'fff', children: [] },
    {
      name: 'iii',
      children: [
        { name: 'jjj', children: [] },
        { name: 'kkk', children: [] },
        { name: 'lll', children: [] },
      ],
    },
  ],
}

const RADIUS = 20 // shape的半径
const DIAMETER = RADIUS * 2 // shape的直径
const MARGIN_X = 100 // 子节点之间的水平衡距离
const MARGIN_Y = 150 // 父子节点的垂直距离
const DISTANCE = 50 // 子树之间的距离

export default function Tree() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement
    initCanvas(canvas)

    const stage = new Stage(canvas)
    stage.x = 200
    stage.y = 50

    const { el } = render(data)
    stage.addChild(el)

    update()

    function update() {
      stage.update()
      // requestAnimationFrame(update)
    }

    function getTextMarics(text: string) {
      return stage.ctx.measureText(text)
    }

    function render(node: Node, level = 0) {
      const color = `hsl(${((level / 5) * 360) | 0}, 60%, 50%)`

      let shape = new Shape()
      let g = shape.graphics
      let textMetrics = getTextMarics(node.name)
      let shapeWidth = textMetrics.width * 2 + 20
      let fixedHeight = 40
      setRoundRect(g, 0, 0, shapeWidth, fixedHeight, 10)
      g.setStrokeStyle({ color: '#555', lineWidth: 1 })
        .setFillStyle(color)
        .fill()
        .setFillStyle('#fff')
        .setTextStyle({ font: '20px arial' })
        .fillText(node.name, 10, 25)
        .stroke()
      const pts = [] as [number, number][]
      if (node.children?.length) {
        let grp = new Group()
        let totalWidth = 0
        let maxHeight = -Infinity

        node.children.forEach((e, i) => {
          const { el, width: elWidth, height: elHeight } = render(e, level + 1)

          maxHeight = Math.max(maxHeight, elHeight)

          if (i) {
            totalWidth += MARGIN_X
          }
          el.x = totalWidth
          el.y = MARGIN_Y
          pts.push([totalWidth + elWidth / 2, MARGIN_Y])
          totalWidth += elWidth
          grp.addChild(el)
        })
        const totalHeight = maxHeight + MARGIN_Y
        grp.addChild(shape)
        shape.x = (totalWidth - shapeWidth) / 2
        shape.y = 0

        let p3x = totalWidth / 2
        let p3y = fixedHeight
        let joinLineShape = new Shape()
        let jlsg = joinLineShape.graphics
        grp.addChild(joinLineShape)
        pts.forEach(p => {
          jlsg
            .setStrokeStyle({ color: '#aaa5', lineWidth: 10 })
            .moveTo(...p)
            .bezierCurveTo(
              p[0],
              p[1] - MARGIN_Y / 3,
              p3x,
              p3y + MARGIN_Y / 3,
              p3x,
              p3y
            )
            .stroke()
        })

        return { el: grp, width: totalWidth, height: totalHeight }
      }

      return { el: shape, width: shapeWidth, height: fixedHeight }
    }
  }, [])

  return <canvas ref={canvasRef}></canvas>
}
