import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Stage,
  Group,
  Shape as BaseShape,
  CrkSyntheticEvent,
  Element,
} from '@mikixing/crk'
import { initCanvas, setRoundRect } from '../util'
import { useContentRef } from '../App'
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
}

type TDisplayType = 'normal' | 'compact'

enum DisplayType {
  normal,
  compact,
}

const data: Node = {
  name: '1',
  children: [
    {
      name: '2',
      children: [
        { name: 'ccc', children: [] },
        { name: 'ddd', children: [] },
        // {
        // name: 'eee',
        // children: [
        //   { name: 'xxx', children: [] },
        //   { name: 'www', children: [] },
        //   { name: 'yyy', children: [] },
        // ],
        // },
      ],
    },
    // { name: 'fff', children: [] },
    {
      name: '10',
      children: [
        // { name: 'jjj', children: [] },
        // { name: 'kkk', children: [] },
        // { name: 'lll', children: [] },
      ],
    },
  ],
}

let mode: 'normal' | 'closed' = 'normal'
let dimensionTree = {} as Record<string, { x: number; y: number }>
let level = 0

const RADIUS = 20 // shape的半径
const MARGIN_X = 60 // 子节点之间的水平衡距离
const MARGIN_Y = 120 // 父子节点的垂直距离

let isNeedUpdate = true
let stage: Stage
let id: number

let displayMap = {} as Record<
  number | string,
  Record<'el' | 'width' | 'height', any>
>

class Shape extends BaseShape {
  public type?: string
  public text?: string
  public width?: number
  public height?: number
  public points?: IPoint[]
  public level?: number
}

function update(stage: Stage) {
  if (isNeedUpdate) {
    stage.update()
    isNeedUpdate = false
  }
  id = requestAnimationFrame(() => update(stage))
}

export default function Tree() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dataMap] = useState<Record<string, any>>({})

  const reset = useCallback(() => {
    isNeedUpdate = true
    Object.keys(dataMap).forEach(id => {
      const { src, dst } = dataMap[id]
      ease(src, dst)
    })
  }, [dataMap])

  const doResort = useCallback(function doResort(tree: Group | Shape) {
    if (tree instanceof Shape) return

    let list = (tree as Group).children
    const arr1 = list.filter(
      item =>
        (item as Shape)?.type === 'line' || (item as Shape)?.type === 'root'
    )
    const arr2 = list.filter(
      item =>
        (item as Shape)?.type !== 'line' && (item as Shape)?.type !== 'root'
    )
    let arr = arr2
    if (arr2.length === 1 && arr2[0] instanceof Group) {
      arr = arr2[0].children
    }

    arr.sort((a: Group | Shape, b: Group | Shape) => {
      doResort(a)
      doResort(b)
      return Math.random() - 0.5
    })
    list.splice(0)
    list.push(...arr1, ...arr2)
  }, [])

  const resort = useCallback((tree: Group) => {
    let srcMap = {} as Record<string, IPoint>
    walk(tree, (item: Element) => {
      let src: Record<string, number>
      srcMap[item.uuid] = src = { x: item.x, y: item.y }
      if ((item as Shape).type === 'line') {
        const { points = [] } = item as Shape
        points.forEach((p, i) => {
          src['x' + i] = p.x
          src['y' + i] = p.y
        })
      }
    })
    doResort(tree)
    layout(tree, 0)
    let dstMap = {} as Record<string, Shape | Group>
    walk(tree, (item: Element) => {
      let dst: Record<string, any>
      dstMap[item.uuid] = dst = item as Shape | Group
      if ((item as Shape).type === 'line') {
        const { points = [] } = item as Shape
        points.forEach((p, i) => {
          dst['x' + i] = p.x
          dst['y' + i] = p.y
        })
      }
    })

    Object.keys(srcMap).forEach(key => {
      const src = srcMap[key]
      const dst = dstMap[key]
      if ((dst as Shape)?.type === 'line') {
        // @ts-ignore
        dst.onUpdate = (obj: Record<string, number>) => {
          isNeedUpdate = true
          const pts = (dst as Shape).points as IPoint[]
          Object.keys(obj).forEach(k => {
            const key = k.slice(0, 1) as 'x' | 'y'
            const index = +k.slice(1)
            if (pts[index]) {
              pts[index][key] = obj[k] as number
            } else {
              pts[index] = {} as IPoint
              pts[index][key] = obj[k] as number
            }
          })
          drawLine(dst as Shape)
        }
      } else {
        // @ts-ignore
        dst.onUpdate = (obj: IPoint) => {
          dst.x = obj.x
          dst.y = obj.y
          isNeedUpdate = true
        }
      }
      ease(src, dst)
    })
  }, [])

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
    console.log('------', displayMap)
    stage.addChild(rootNode)
    stage.enableMouseOver(10)

    window.onresize = ev => {
      initCanvas(canvas, canvas.offsetWidth, canvas.offsetHeight)
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      layout(rootNode, 0)
      isNeedUpdate = true
    }

    stage.on('pressdown', (ev: CrkSyntheticEvent) => {
      isNeedUpdate = true
      const { x, y } = ev
      const target = ev.target as Shape
      const { parent } = target
      const mat = target.parent?.getWorldMatrix().invert()
      const tmp = mat.transformPoint(x, y)
      const bx = tmp.x
      const by = tmp.y
      const { x: ox, y: oy } = target as Shape
      const { x: pox, y: poy } = parent ?? {}
      let pressmove: (ev: CrkSyntheticEvent) => void,
        pressup: (ev: CrkSyntheticEvent) => void
      const isLeaf = target.type !== 'root'
      stage.on(
        'pressmove',
        (pressmove = (ev: CrkSyntheticEvent) => {
          isNeedUpdate = true
          const { x, y } = ev
          const tmp = mat.transformPoint(x, y)
          const dx = tmp.x - bx
          const dy = tmp.y - by
          if (isLeaf) {
            const root = parent.children.find(
              child => (child as Shape).type === 'root'
            ) as Shape
            const lineShape = parent.children.find(
              child => (child as Shape).type === 'line'
            ) as Shape
            target.x = ox + dx
            target.y = oy + dy
            // 向上查找字数根节点
            if (root) {
              const p1 = root.local2local(
                lineShape,
                (root.width ?? 0) / 2,
                root.height ?? 0
              )

              const points = lineShape.points as IPoint[]
              points[0].x = p1.x
              points[0].y = p1.y

              let counter = 0
              parent.children.forEach((child, idx) => {
                if (child === lineShape || child === root) {
                  counter++
                  return
                }
                let p0
                if (child === target) {
                  p0 = target.local2local(lineShape, (target.width ?? 0) / 2, 0)
                } else {
                  if (child instanceof Group) {
                    const tmp = (child as Group).children.find(
                      item => (item as Shape).type === 'root'
                    ) as Shape
                    p0 = tmp.local2local(lineShape, (tmp.width ?? 0) / 2, 0)
                  } else {
                    p0 = child.local2local(
                      lineShape,
                      ((child as Shape).width ?? 0) / 2,
                      0
                    )
                  }
                }
                // 第0个位置留给root节点
                let location = idx + 1 - counter
                points[location].x = p0.x
                points[location].y = p0.y
              })

              drawLine(lineShape)
            }
          } else {
            if (!parent) {
              target.x = ox + dx
              target.y = oy + dy
            } else {
              parent.x = pox + dx
              parent.y = poy + dy
              const pp = parent.parent
              const root = pp.children.find(
                child => (child as Shape).type === 'root'
              ) as Shape
              const lineShape = pp.children.find(
                child => (child as Shape).type === 'line'
              ) as Shape
              if (root) {
                const p1 = root.local2local(
                  lineShape,
                  (root.width ?? 0) / 2,
                  root.height ?? 0
                )
                const points = lineShape.points as IPoint[]
                points[0].x = p1.x
                points[0].y = p1.y
                let counter = 0
                pp.children.forEach((child, idx) => {
                  let tmp = child as Shape | Group
                  if (tmp === lineShape || tmp === root) {
                    counter++
                    return
                  }
                  if (tmp instanceof Group) {
                    tmp = (tmp as Group).children.find(
                      item => (item as Shape).type === 'root'
                    ) as Shape
                  }
                  const p0 = tmp.local2local(lineShape, (tmp.width ?? 0) / 2, 0)
                  // 第0个位置留给root节点
                  let location = idx + 1 - counter
                  points[location].x = p0.x
                  points[location].y = p0.y
                })
                drawLine(lineShape)
              }
            }
          }
        })
      )
      stage.on(
        'pressup',
        (pressup = (ev: CrkSyntheticEvent) => {
          isNeedUpdate = true
          stage.removeListener('pressmove', pressmove)
          stage.removeListener('pressup', pressup)
        })
      )
    })

    walk(stage, el => {
      if ((el as Shape)?.type === 'line') {
        const dst: Record<string, number | Function> = {}
        const src: Record<string, number> = {}
        const { points = [] } = el as Shape
        points.forEach((p, i) => {
          dst['x' + i] = p.x
          dst['y' + i] = p.y
          src['x' + i] = p.x
          src['y' + i] = p.y

          let x = p.x
          let y = p.y
          Object.defineProperties(p, {
            x: {
              set: (v: number) => {
                src['x' + i] = x = v
              },
              get: () => x,
            },
            y: {
              set: (v: number) => {
                src['y' + i] = y = v
              },
              get: () => y,
            },
          })
        })

        dst.onUpdate = (obj: Record<string, number>) => {
          isNeedUpdate = true
          const pts = (el as Shape).points as IPoint[]
          Object.keys(obj).forEach(k => {
            const key = k.slice(0, 1) as 'x' | 'y'
            const index = +k.slice(1)
            if (pts[index]) {
              pts[index][key] = obj[k] as number
            } else {
              pts[index] = {} as IPoint
              pts[index][key] = obj[k] as number
            }
          })
          drawLine(el as Shape)
        }

        dataMap[el.uuid] = {
          src,
          dst,
        }
      } else {
        dataMap[el.uuid] = {
          src: el,
          dst: {
            x: el.x,
            y: el.y,
          },
        }
      }
    })
    update(stage)
  }, [])

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', border: '1px solid red' }}
      ></canvas>
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          padding: 10,
          background: '#fff',
          // border: '1px solid #999',
        }}
      >
        <Button size="small" onClick={() => reset()}>
          reset
        </Button>
        <br />
        <br />
        <Button
          size="small"
          onClick={() => resort((stage as Group).children[0] as Group)}
        >
          resort
        </Button>
        <br />
        <br />
        <Button
          size="small"
          onClick={() => {
            layout(stage.children[0], DisplayType.normal)
            isNeedUpdate = true
          }}
        >
          普通
        </Button>
        <Button
          size="small"
          onClick={() => {
            layoutForCompact(stage.children[0])
            isNeedUpdate = true
            console.log('******', displayMap)
          }}
        >
          紧凑
        </Button>
      </div>
    </>
  )
}

function walk(el: Element, fn: (el: Element) => void) {
  fn(el)
  ;(el as Group).children?.forEach(e => walk(e, fn))
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
      pts.push({ x: 0, y: 0 })
      const { el } = initTree(e, level + 1, stage)
      grp.addChild(el)
    })
    grp.addChild(shape)
    shape.type = 'root'

    let lineShape = new Shape()
    lineShape.type = 'line'
    grp.addChild(lineShape)
    lineShape.points = [{ x: 0, y: 0 }, ...pts]

    return { el: grp }
  }
  shape.level = level
  return { el: shape, width: shapeWidth, height: fixedHeight }
}
function layout(node: Group | Shape, displayType = DisplayType.normal) {
  let totalWidth = 0
  let fixedHeight = 40
  let lineShape!: Shape
  let rootShape!: Shape
  let maxHeight = -Infinity
  const pts = [] as IPoint[]

  if ((node as Group)?.children?.length) {
    ;(node as Group)?.children.forEach((e: Shape | Group, i: number) => {
      let count = i
      const { width: elWidth, height: elHeight } = layout(e)
      if (e instanceof Shape) {
        if (e.type === 'line') {
          lineShape = e as Shape
          return
        } else if (e.type === 'root') {
          rootShape = e as Shape
          return
        }
      }

      maxHeight = Math.max(maxHeight, elHeight)

      if (count) {
        if (lineShape) count--
        if (rootShape) count--
        count && (totalWidth += MARGIN_X)
      }
      e.x = totalWidth
      e.y = MARGIN_Y
      totalWidth += elWidth
      pts.push({ x: totalWidth - elWidth / 2, y: MARGIN_Y })
    })
    if (rootShape) {
      const { width = 0 } = rootShape
      rootShape.x = (totalWidth - width) / 2
    }
    if (lineShape) {
      const { points = [] } = lineShape
      // 保留points引用
      points.forEach((p, i) => {
        if (i === 0) {
          p.x = totalWidth / 2
          p.y = fixedHeight
        } else {
          p.x = pts[i - 1].x
          p.y = pts[i - 1].y
        }
      })
      drawLine(lineShape)
    }
    const totalHeight = maxHeight + MARGIN_Y

    return { width: totalWidth, height: totalHeight }
  }
  node.x = 0
  node.y = 0
  return { width: (node as Shape).width ?? 0, height: fixedHeight }
}

function layoutForCompact(node: Group | Shape) {
  let totalWidth = 0
  let fixedHeight = 40
  let lineShape!: Shape
  let rootShape!: Shape
  let maxHeight = -Infinity
  let maxX = 0
  const pts = [] as IPoint[]

  if ((node as Group)?.children?.length) {
    let maxWidth = 0
    ;(node as Group)?.children.forEach((e: Shape | Group, i: number) => {
      let count = i
      const { width: elWidth, height: elHeight, maxX = 0 } = layoutForCompact(e)
      maxWidth = Math.max(maxX as number, maxWidth)
      if (e instanceof Shape) {
        if (e.type === 'line') {
          lineShape = e as Shape
          return
        } else if (e.type === 'root') {
          rootShape = e as Shape
          return
        }
      }

      maxHeight = Math.max(maxHeight, elHeight)

      if (count) {
        if (lineShape) count--
        if (rootShape) count--
        count && (totalWidth += MARGIN_X)
      }
      e.x = totalWidth
      e.y = MARGIN_Y
      totalWidth += elWidth
      pts.push({ x: totalWidth - elWidth / 2, y: MARGIN_Y })
    })
    dimensionTree[newLevel] = { x: totalWidth, y: maxHeight }
    if (rootShape) {
      debugger
      const { width = 0 } = rootShape
      rootShape.x = (totalWidth - width) / 2
      dimensionTree[level] = { x: rootShape.x + width, y: 0 }
    }
    if (lineShape) {
      const { points = [] } = lineShape
      // 保留points引用
      points.forEach((p, i) => {
        if (i === 0) {
          p.x = totalWidth / 2
          p.y = fixedHeight
        } else {
          p.x = pts[i - 1].x
          p.y = pts[i - 1].y
        }
      })
      drawLine(lineShape)
    }
    const totalHeight = maxHeight + MARGIN_Y

    node.x = maxWidth
    maxWidth = 0

    return { width: totalWidth, height: totalHeight, maxX }
  }
  node.x = 0
  node.y = 0

  if (node instanceof Shape && node.type !== 'line' && node.type !== 'root') {
    const { level = 0 } = node
    const compareEl = displayMap[level]
    let lastWidth, lastHeight

    if (compareEl) {
      const { el } = compareEl
      const p = el.local2global(el.x, el.y)
      lastWidth = p.x + el.width + MARGIN_X
      lastHeight = p.y
    } else {
      lastWidth = 0
      lastHeight = 0
    }
    maxX = Math.max(maxX, lastWidth)
    displayMap[level] = {
      el: node,
      width: node.width,
      height: node.height,
    }
  }
  return { width: (node as Shape).width ?? 0, height: fixedHeight, maxX }
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
