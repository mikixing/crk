import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Stage,
  Group,
  Shape as BaseShape,
  CrkSyntheticEvent,
  Element,
} from '@mikixing/crk'
import { initCanvas, setRoundRect } from '../util'
import { Button } from 'antd'
import { ease } from '@mikixing/transition'

interface Node {
  name: string
  children?: Node[]
  mouseover?: (ev?: any) => void
}

interface IPoint {
  x: number
  y: number
  uuid?: number
  el?: Shape
}

class Shape extends BaseShape {
  public type?: string
  public text?: string
  public width?: number
  public height?: number
  public points?: IPoint[]
}

const data: Node = {
  name: '1',
  children: [
    {
      name: '111',
      children: [
        { name: 'ccc', children: [] },
        {
          name: 'ddd',
          children: [
            {
              name: '333',
              children: [
                { name: 'jjj', children: [] },
                { name: 'kkk', children: [] },
                {
                  name: 'lll',
                  // children: [
                  //   { name: 'xxx', children: [] },
                  //   { name: 'www', children: [] },
                  //   { name: 'yyy', children: [] },
                  //   { name: 'xxx', children: [] },
                  // ],
                },
              ],
            },
          ],
        },
        {
          name: 'eee',
          children: [
            { name: 'xxx', children: [] },
            {
              name: 'www',
              children: [
                { name: 'xxx', children: [] },
                { name: 'www', children: [] },
                { name: 'yyy', children: [] },
                { name: 'xxx', children: [] },
              ],
            },
            {
              name: 'yyy',
              children: [
                {
                  name: '333',
                  // children: [
                  //   { name: 'jjj', children: [] },
                  //   { name: 'kkk', children: [] },
                  //   {
                  //     name: 'lll',
                  //     // children: [
                  //     //   { name: 'xxx', children: [] },
                  //     //   { name: 'www', children: [] },
                  //     //   { name: 'yyy', children: [] },
                  //     //   { name: 'xxx', children: [] },
                  //     // ],
                  //   },
                  // ],
                },
              ],
            },
            // { name: 'xxx', children: [] },
            // { name: 'www', children: [] },
            // { name: 'yyy', children: [] },
            // { name: 'xxx', children: [] },
            // { name: 'www', children: [] },
            {
              name: 'yyy',
              children: [
                {
                  name: '333',
                  // children: [
                  //   { name: 'jjj', children: [] },
                  //   { name: 'kkk', children: [] },
                  //   { name: 'lll', children: [] },
                  // ],
                },
              ],
            },
          ],
        },
      ],
    },
    // { name: '222', children: [] },
    // {
    //   name: '333',
    //   children: [
    //     { name: 'jjj', children: [] },
    //     { name: 'kkk', children: [] },
    //     { name: 'lll', children: [] },
    //   ],
    // },
  ],
}

const MARGIN_X = 60 // 子节点之间的水平衡距离
const MARGIN_Y = 120 // 父子节点的垂直距离

let isNeedUpdate = true
let stage: Stage
let id: number

function update(stage: Stage) {
  if (isNeedUpdate) {
    stage.update()
    isNeedUpdate = false
  }
  id = requestAnimationFrame(() => update(stage))
}

export default function Tree() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    return () => {
      cancelAnimationFrame(id)
    }
  }, [])

  useEffect(() => {
    isNeedUpdate = true

    const canvas = canvasRef.current as HTMLCanvasElement
    initCanvas(canvas, canvas.offsetWidth, canvas.offsetHeight)
    canvas.style.width = '100%'
    canvas.style.height = '100%'

    stage = new Stage(canvas)
    // stage.x = 100
    // stage.y = 50

    const { el: rootNode } = initTree(data, 0, stage)
    layout(rootNode)
    stage.addChild(rootNode)
    stage.enableMouseOver(10)

    update(stage)
  }, [])

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', border: '1px solid red' }}
      ></canvas>
    </>
  )
}

function getTextMarics(text: string, stage: Stage) {
  return stage.ctx.measureText(text)
}

function initTree(node: Node, level = 0, stage: Stage) {
  const color = `hsl(${((level / 5) * 360) | 0}, 60%, 50%)`

  let shape = new Shape()
  let g = shape.graphics
  let textMetrics = getTextMarics(node.name, stage)
  let shapeWidth = textMetrics.width * 2 + 20
  let fixedHeight = 40
  shape.width = shapeWidth
  shape.height = fixedHeight
  setRoundRect(g, 0, 0, shapeWidth, fixedHeight, 10)
  g.setStrokeStyle({ color: '#555', lineWidth: 1 })
    .setFillStyle(color)
    .fill()
    .setFillStyle('#fff')
    .setTextStyle({ font: '20px arial' })
    .fillText(node.name, 10, 25)
    .stroke()
  shape.text = node.name
  const pts = [] as IPoint[]
  if (node.children?.length) {
    let grp = new Group()

    node.children.forEach((e, i) => {
      const { el } = initTree(e, level + 1, stage)
      pts.push({ x: 0, y: 0, uuid: el.uuid })
      grp.addChild(el)
    })
    grp.addChild(shape)
    shape.type = 'root'

    let lineShape = new Shape()
    lineShape.type = 'line'
    grp.addChild(lineShape)
    lineShape.points = [{ x: 0, y: 0, uuid: shape.uuid }, ...pts]

    return { el: grp }
  }
  return { el: shape, width: shapeWidth, height: fixedHeight }
}
function layout(node: Group | Shape) {
  let displayMap: Record<number | string, Shape | Group> = {}
  let level = 0
  let totalWidth = 0
  let totalHeight = 0
  _layout(node, level, totalHeight)

  function _layout(node: Group | Shape, level: number, totalHeight: number) {
    if (node instanceof Shape) {
      const lastNode = displayMap[level] as Shape & { width: number; x: number }
      if (!lastNode) {
        node.y = totalHeight
        displayMap[level] = node
      } else {
        const tp = lastNode.parent.local2local(
          node.parent,
          lastNode.x + lastNode.width + MARGIN_X,
          lastNode.y
        )
        node.x = tp.x
        node.y = totalHeight
        displayMap[level] = node
      }
    } else {
      let lineShape!: Shape
      let rootShape!: Shape
      let pts: (IPoint & { width: number })[] = []
      let layer = level + 1
      ;(node as Group).children.forEach((child: Group | Shape) => {
        const { type } = child as Shape
        if (type === 'root') {
          rootShape = child as Shape
          return
        }
        if (type === 'line') {
          lineShape = child as Shape
          return
        }
        _layout(child, layer, totalHeight + MARGIN_Y)
        let targetShape: Shape
        if (child instanceof Shape) {
          targetShape = child
        } else {
          let rootNode = child.children.find(
            item => (item as Shape).type === 'root'
          ) as Shape
          targetShape = rootNode
        }
        // pts放局部坐标
        pts.push({
          x: targetShape.x,
          y: targetShape.y,
          width: targetShape.width ?? 0,
          uuid: child.uuid,
          el: targetShape,
        })
      })
      if (rootShape) {
        const { width = 0 } = rootShape
        const lastIndex = pts.length - 1
        // firstChildPoint
        let fp = pts[0]
        let lastChild = pts[lastIndex] as { el: Shape; width: number } & IPoint
        // lastChildPoint
        let lp = lastChild.el.parent.local2local(
          rootShape.parent,
          lastChild.x + lastChild.width,
          lastChild.y
        )
        const x = (lp.x - fp.x) / 2 + fp.x - width / 2
        const lastNode = displayMap[level] as Shape & {
          width: number
          x: number
        }
        if (!lastNode) {
          rootShape.x = x
        } else {
          const lx = lastNode.x + lastNode.width + MARGIN_X
          if (lx > x) {
            rootShape.parent.x += lx - x
          }
        }
        rootShape.x = x
        rootShape.y = totalHeight
        displayMap[level] = rootShape
      }
      if (lineShape) {
        const { points = [] } = lineShape
        // 保留points引用
        points.forEach((p, i) => {
          if (i === 0) {
            const { width = 0, height = 0 } = rootShape
            // transform point
            const center = {
              x: rootShape.x + width / 2,
              y: rootShape.y + height,
            }
            const tp = rootShape.parent.local2local(
              lineShape.parent,
              center.x,
              center.y
            )
            p.x = tp.x
            p.y = tp.y
          } else {
            const { uuid } = p
            const target = pts.find(item => item.uuid === uuid) as {
              el: Shape
              width: number
            } & IPoint
            const center = { x: target.x + target.width / 2, y: target.y }
            // transform point
            let tp = target.el.parent.local2local(
              lineShape.parent,
              center.x,
              center.y
            )
            p.x = tp.x
            p.y = tp.y
          }
        })
        drawLine(lineShape)
      }
    }
  }
}

function drawLine(shape: Shape, clear = true) {
  const { points = [] } = shape
  if (points.length < 2) return
  const { x, y } = points[0]
  const g = shape.graphics

  clear && g.clear()

  g.setStrokeStyle({ color: '#aaa', lineWidth: 2 })
  points.slice(1).forEach(p => {
    g.moveTo(p.x, p.y).bezierCurveTo(
      p.x,
      p.y - MARGIN_Y / 3,
      x,
      y + MARGIN_Y / 3,
      x,
      y
    )
  })
  g.stroke()
}
