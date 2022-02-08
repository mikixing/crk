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
  uuid: number
  el?: Shape
}

type TDisplayMap = any

class Shape extends BaseShape {
  public type?: string
  public text?: string
  public width?: number
  public height?: number
  public points?: { x: number; y: number; uuid: number | string }[]
}

const data: Node = {
  name: 'root',
  children: [
    {
      name: '111',
      children: [
        { name: 'ccc', children: [] },
        {
          name: '2221',
          children: [
            {
              name: '333',
              children: [
                { name: 'jjj', children: [] },
                { name: 'kkk', children: [] },
                {
                  name: 'lll',
                  children: [
                    { name: 'xxx', children: [] },
                    { name: 'www', children: [] },
                    { name: 'yyy', children: [] },
                    { name: 'xxx', children: [] },
                  ],
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
                // { name: 'xxx', children: [] },
              ],
            },
            {
              name: 'yyy',
              children: [
                {
                  name: '333',
                  children: [
                    { name: 'jjj', children: [] },
                    { name: 'kkk', children: [] },
                    {
                      name: 'lll',
                      children: [
                        { name: 'xxx', children: [] },
                        { name: 'www', children: [] },
                        { name: 'yyy', children: [] },
                        { name: 'xxx', children: [] },
                      ],
                    },
                  ],
                },
              ],
            },
            { name: 'xxx', children: [] },
            { name: 'www', children: [] },
            {
              name: 'yyy',
              children: [
                {
                  name: '333',
                  children: [
                    { name: 'jjj', children: [] },
                    { name: 'kkk', children: [] },
                    { name: 'lll', children: [] },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: '222222',
      children: [
        {
          name: 'jjjjjjj-1',
          // children: [
          //   {
          //     name: 'jjjjj1',
          //     // children: [{ name: 'jjjjjfjhajdhajdfha2', children: [] }],
          //   },
          //   // { name: 'jjjjj2', children: [] },
          // ],
        },
        // {
        //   name: 'jjjjjjj-2',
        //   // children: [{ name: 'jjjjj1', children: [] }],
        // },
      ],
    },
    {
      name: '333',
      children: [
        {
          name: 'mmm',
          children: [
            {
              name: 'mm',
              children: [
                { name: 'mmm2', children: [{ name: 'mmm2', children: [] }] },
              ],
            },
            // { name: 'mmm2', children: [] },
            // { name: 'mmm3', children: [] },
            // { name: 'mmm4', children: [] },
            // { name: 'mmm5', children: [] },
          ],
        },
        {
          name: 'kkk',
          children: [
            { name: 'lll', children: [] },
            {
              name: 'llllllllll-2',
              children: [
                { name: 'lll-1', children: [] },
                { name: 'lllllllll-2', children: [] },
              ],
            },
          ],
        },
      ],
    },
    {
      name: '444',
      children: [
        {
          name: 'xxx',
          children: [
            {
              name: 'xxx1',
              children: [
                {
                  name: 'xxx2',
                  children: [
                    { name: 'xxx2-1', children: [] },
                    { name: 'xxx2-2', children: [] },
                  ],
                },
                { name: 'xxx3', children: [] },
              ],
            },
          ],
        },
        {
          name: 'yyy',
          children: [
            { name: 'yyy1', children: [] },
            { name: 'yyy2', children: [] },
            // { name: 'yyy3', children: [] },
          ],
        },
        // { name: 'zzz', children: [] },
        // { name: 'xxx', children: [] },
        // { name: 'yyy', children: [] },
        // { name: 'zzz', children: [] },
      ],
    },
  ],
}

const MARGIN_X = 20 // 子节点之间的水平衡距离
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
    let srcMap = {} as Record<string, { x: number; y: number }>
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
    walk(tree, (item: Element) => {
      item.x = 0
      item.y = 0
    })
    layout(tree)
    isNeedUpdate = true
    let dstMap = {} as Record<string, Shape | Group>
    walk(tree, (item: Element) => {
      let dst: Record<string, any>
      dstMap[item.uuid] = dst = item as Shape | Group
      if ((item as Shape).type === 'line') {
        const { points = [] } = item as Shape
        points.forEach((p, index) => {
          dst['x' + index] = p.x
          dst['y' + index] = p.y
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
          const pts = (dst as Shape).points as { x: number; y: number }[]
          Object.keys(obj).forEach(k => {
            const key = k.slice(0, 1) as 'x' | 'y'
            const index = +k.slice(1)

            if (pts[index]) {
              pts[index][key] = obj[k] as number
            } else {
              pts[index] = {} as { x: number; y: number }
              pts[index][key] = obj[k] as number
            }
          })
          drawLine(dst as Shape)
        }
      } else {
        // @ts-ignore
        dst.onUpdate = (obj: { x: number; y: number }) => {
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
    stage.addChild(rootNode)
    stage.enableMouseOver(10)

    window.onresize = ev => {
      initCanvas(canvas, canvas.offsetWidth, canvas.offsetHeight)
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      layout(rootNode)
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

              const points = lineShape.points as { x: number; y: number }[]
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
                const points = lineShape.points as { x: number; y: number }[]
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
          const pts = (el as Shape).points as { x: number; y: number }[]
          Object.keys(obj).forEach(k => {
            const key = k.slice(0, 1) as 'x' | 'y'
            const index = +k.slice(1)
            if (pts[index]) {
              pts[index][key] = obj[k] as number
            } else {
              pts[index] = {} as { x: number; y: number }
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
        style={{ width: '100%', height: '100%' }}
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
      const { el } = initTree(e, level + 1, stage)
      pts.push({ uuid: el.uuid })
      grp.addChild(el)
    })
    grp.addChild(shape)
    shape.type = 'root'

    let lineShape = new Shape()
    lineShape.type = 'line'
    grp.addChild(lineShape)
    lineShape.points = [
      { uuid: shape.uuid, x: 0, y: 0 },
      ...pts.map(item => {
        return { x: 0, y: 0, ...item }
      }),
    ]

    return { el: grp }
  }
  return { el: shape, width: shapeWidth, height: fixedHeight }
}
function layout(node: Group | Shape) {
  let level = 0
  // let totalWidth = 0
  let totalHeight = 0
  let displayMap: any[] = []
  _layout(node, totalHeight, level, displayMap)

  function _layout(
    node: Group | Shape,
    totalHeight: number,
    level: number,
    displayMap?: TDisplayMap
  ) {
    if (node instanceof Shape) {
      const lastNode = (displayMap as TDisplayMap)[level] as {
        left: Shape | Group
        right: Shape | Group
      }
      if (!lastNode) {
        node.y = totalHeight
        ;(displayMap as TDisplayMap)[level] = { left: node, right: node }
      } else {
        const { right: rightNode } = lastNode as {
          left: Shape & { width: number }
          right: Shape & { width: number }
        }
        const tp = rightNode.parent.local2local(
          node.parent,
          rightNode.x + rightNode.width + MARGIN_X,
          rightNode.y
        )
        node.x = tp.x
        node.y = totalHeight
        ;(displayMap as TDisplayMap)[level].right = node
      }
    } else {
      let lineShape!: Shape
      let rootShape!: Shape
      let pts: (IPoint & { width: number })[] = []
      let data: Record<string, any>[] = []

      ;(node as Group).children.forEach((child: Group | Shape, i) => {
        const { type } = child as Shape
        if (type === 'root') {
          rootShape = child as Shape
          return
        }
        if (type === 'line') {
          lineShape = child as Shape
          return
        }
        let layer = level + 1
        let currentIndex =
          rootShape && lineShape ? i - 2 : rootShape || lineShape ? i - 1 : i
        let container = (data[currentIndex] = [])
        _layout(child, totalHeight + MARGIN_Y, layer, container)
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
          width: targetShape.width ?? 0,
          uuid: child.uuid,
          el: targetShape,
        })
      })
      if (data.length) {
        setPosition(data, rootShape.parent)
      }
      if (rootShape) {
        const { width = 0 } = rootShape
        const lastIndex = pts.length - 1
        // firstChildPoint
        let firstChild = pts[0] as { el: Shape; width: number } & IPoint
        let fp = firstChild.el.parent.local2local(
          rootShape.parent,
          firstChild.el.x,
          firstChild.el.y
        )
        // lastChildPoint
        let lastChild = pts[lastIndex] as { el: Shape; width: number } & IPoint
        let lp = lastChild.el.parent.local2local(
          rootShape.parent,
          lastChild.el.x + lastChild.width,
          lastChild.el.y
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
        displayMap[level] = { left: rootShape, right: rootShape, data }

        // 当子元素宽度不足时,子树根节点可能超出边界,需要重新适配位置
        const coorX = rootShape.parent.local2global(rootShape.x, rootShape.y).x
        if (coorX < 0) {
          rootShape.parent.x += Math.abs(coorX)
        }
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
            const { el } = target as { el: Shape }
            const center = { x: el.x + (el?.width ?? 0) / 2, y: el.y }
            // transform point
            let tp = el.parent.local2local(lineShape.parent, center.x, center.y)
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

// type: 0=常规摆放,1=从subroot开始向子节点遍历调整摆放
function setPosition(list: any, subroot: Group, type = 0) {
  const len = list.length
  for (let i = 1; i < len; i++) {
    let currentItem = list[i]
    _setCompare(currentItem, list.slice(0, i), subroot)
  }

  function _setCompare(data: any, compareData: any, subroot: Group, type = 0) {
    data.forEach((item: any, i: number) => {
      let compareItem
      let len = compareData.length
      while (--len > -1) {
        if (compareData[len] && compareData[len][i]) {
          compareItem = compareData[len][i]
          break
        }
      }
      if (!item || !compareItem) return
      // compareItem right
      const { right: cir } = compareItem
      // current item left
      const { left: cil, data: newData = [] } = item
      if (!cil || !cir) return
      const cirp = cir.parent.local2local(cil.parent, cir.x + cir.width, cir.y)
      const dx = cil.x - cirp.x
      const difference = MARGIN_X - dx
      if (cil instanceof Shape) {
        if (cil.type === 'root') {
          if (cil.text === '444') debugger
          const { parent } = cil
          if (difference > 0) {
            if (type) {
              subroot.x += difference
            } else {
              parent.x += difference
            }
          }
          const newCompareData: any[] = []
          for (let l = 0; l < compareData.length; l++) {
            const item = compareData[l]
            if (item && item[i] && item[i].data) {
              let d = item[i].data
              for (let k = 0; k < d.length; k++) {
                newCompareData.push(d[k])
              }
            }
          }
          newData.forEach((childData: any, i: number) => {
            _setCompare(childData, newCompareData, type ? subroot : parent, 1)
          })
        } else {
          if (difference > 0) {
            if (type) {
              subroot.x += difference
            } else {
              cil.x += difference
            }
          }
        }
      }
    })
  }
}
