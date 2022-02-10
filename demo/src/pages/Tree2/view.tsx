import {
  Stage,
  Group,
  Shape as BaseShape,
  Element,
  CrkSyntheticEvent,
} from '@mikixing/crk'
import { ease } from '@mikixing/transition'
import { initCanvas, setAnchor, setRoundRect } from '../../util'
import data from './data'

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

const MARGIN_X = 20 // 子节点之间的水平衡距离
const MARGIN_Y = 400 // 父子节点的垂直距离

let needsUpdate = true
let id: number

let dataMap = {} as Record<
  number,
  {
    src: Record<string, number> | Element
    dst: Record<string, number | Function>
  }
>
let canvas: HTMLCanvasElement
let stage: Stage
let nodeTree: Group | Shape
const centerConfig = [0, 0, 0, 0]

export default function setView(canvasDom: HTMLCanvasElement) {
  canvas = canvasDom
  initCanvas(canvas, canvas.offsetWidth, canvas.offsetHeight)
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  ;(window as any).stage = stage = new Stage(canvas)
  stage.mouseMoveOutside = true
  // @ts-ignore
  // window.stage = stage
  start(stage)

  function start(stage: Stage) {
    const { el: rootNode } = initTree(stage, data, 0)
    ;(window as any).root = nodeTree = rootNode
    ;(stage as Stage).addChild(rootNode)
    ;(stage as Stage).enableMouseOver(10)
    layout(rootNode)
    adjustPosition({ padding: centerConfig })

    window.onresize = ev => {
      initCanvas(canvas, canvas.offsetWidth, canvas.offsetHeight)
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      layout(rootNode)
      adjustPosition({ padding: centerConfig })
      needsUpdate = true
    }
    ;(stage as Stage).on('pressdown', (ev: CrkSyntheticEvent) => {
      needsUpdate = true
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
      ;(stage as Stage).on(
        'pressmove',
        (pressmove = (ev: CrkSyntheticEvent) => {
          needsUpdate = true
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
                const points = lineShape.points as {
                  x: number
                  y: number
                }[]
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
      ;(stage as Stage).on(
        'pressup',
        (pressup = (ev: CrkSyntheticEvent) => {
          needsUpdate = true
          ;(stage as Stage).removeListener('pressmove', pressmove)
          ;(stage as Stage).removeListener('pressup', pressup)
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
          needsUpdate = true
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
    update(stage as Stage)

    function getTextMarics(stage: Stage, text: string) {
      return stage.ctx.measureText(text)
    }

    function initTree(stage: Stage, node: Node, level: number) {
      const color = `hsl(${((level / 5) * 360) | 0}, 60%, 50%)`

      let shape = new Shape()
      let g = shape.graphics
      let textMetrics = getTextMarics(stage, node.name)
      let shapeWidth = textMetrics.width * 2 + 20
      let fixedHeight = 40
      const fontSize = 20
      shape.cursor = 'pointer'
      shape.width = shapeWidth
      shape.height = fixedHeight
      setRoundRect(g, 0, 0, shapeWidth, fixedHeight, 10)
      g.setStrokeStyle({ color: '#555', lineWidth: 1 })
        .setFillStyle(color)
        .fill()
        .setFillStyle('#fff')
        .setTextStyle({ font: `${fontSize}px arial`, textAlign: 'center' })
        .fillText(node.name, shapeWidth / 2, 25)
        .stroke()
      shape.text = node.name
      const pts = [] as IPoint[]
      if (node.children?.length) {
        let grp = new Group()

        node.children.forEach((e, i) => {
          const { el } = initTree(stage, e, level + 1)
          pts.push({ uuid: el.uuid })
          grp.addChild(el)
        })
        grp.addChild(shape)
        shape.type = 'root'
        shape.cursor = 'move'

        let lineShape = new Shape()
        lineShape.ignoreEvent = true
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
    canvas.addEventListener('wheel', ev => {
      console.log('wheel', ev.deltaX, ev.deltaY)
      if (ev.deltaMode === ev.DOM_DELTA_PIXEL) {
        if (ev.ctrlKey || ev.metaKey) {
          // zoom
          let { x, y } = stage.global2local(ev.clientX - 200, ev.clientY)
          setAnchor(stage, x, y)

          const ss = stage.scale * Math.pow(0.98, ev.deltaY)
          // const maxScale = Infinity
          // const minScale = Infinity
          // ss = Math.max(Math.min(ss, maxScale), minScale)
          stage.scale = ss
          console.log(ss, ev.clientX, ev.clientY, x, y)
        } else {
          stage.x += -ev.deltaX
          stage.y += -ev.deltaY
        }
        needsUpdate = true
        ev.preventDefault()
      }
    })
  }
  return () => {
    cancelAnimationFrame(id)
  }
}

function walk(el: Element, fn: (el: Element) => void) {
  fn(el)
  ;(el as Group).children?.forEach(e => walk(e, fn))
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
        setPosition(data, rootShape.parent || rootShape)
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
        // const coorX = rootShape.parent.local2global(rootShape.x, rootShape.y).x
        const coorX = rootShape.parent.local2local(
          stage,
          rootShape.x,
          rootShape.y
        ).x
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

function getBoundingBox(el: Element) {
  // @ts-ignore
  // window.aaa = getBoundingBox
  const result = { left: 0, right: 0, top: 0, bottom: 0 }
  doGetBoundingBox(el)
  return result

  function doGetBoundingBox(el: Element) {
    if (el instanceof Group) {
      ;(el as Group).children.forEach(child => {
        doGetBoundingBox(child)
      })
    } else {
      // const coor1 = el.parent?.local2global(el.x, el.y) as {
      //   x: number
      //   y: number
      // }
      // const coor2 = el.parent?.local2global(
      //   el.x + ((el as Shape)?.width ?? 0),
      //   el.y + ((el as Shape)?.height ?? 0)
      // ) as { x: number; y: number }

      const coor1 = el.parent?.local2local(nodeTree, el.x, el.y) as {
        x: number
        y: number
      }
      const coor2 = el.parent?.local2local(
        nodeTree,
        el.x + ((el as Shape)?.width ?? 0),
        el.y + ((el as Shape)?.height ?? 0)
      ) as { x: number; y: number }
      Object.assign(
        result,
        addBoundingBox(result, {
          left: coor1.x,
          right: coor2.x,
          top: coor1.y,
          bottom: coor2.y,
        })
      )
    }
  }
  function addBoundingBox(
    a: { left: number; right: number; top: number; bottom: number },
    b: { left: number; right: number; top: number; bottom: number }
  ) {
    return {
      left: Math.min(a.left, b.left),
      right: Math.max(a.right, b.right),
      top: Math.min(a.top, b.top),
      bottom: Math.max(a.bottom, b.bottom),
    }
  }
}
function getBackgroundData(
  sw: number,
  sh: number,
  dw: number,
  dh: number,
  isContain = true
) {
  const sr = sw / sh
  const dr = dw / dh

  let scale
  if (isContain) {
    scale = sr > dr ? dw / sw : dh / sh
  } else {
    scale = sr > dr ? dh / sh : dw / sw
  }

  return {
    scale,
    x: (dw - sw * scale) / 2,
    y: (dh - sh * scale) / 2,
  }
}
var boxShape = new Shape()
function adjustPosition(
  opt = {} as {
    padding?: number[] | number
    paddingLeft?: number
    paddingTop?: number
    paddingRight?: number
    paddingBottom?: number
  }
) {
  // const src = { x: nodeTree.x, y: nodeTree.y }
  // stage.scale = 1
  // stage.x = 0
  // stage.y = 0

  // nodeTree.scale = 1
  const boundingBox = getBoundingBox(nodeTree)
  // @ts-ignore
  window.boundingBox = boundingBox
  boxShape.graphics
    .clear()
    .setStrokeStyle({ lineWidth: 1, color: 'red' })
    .moveTo(boundingBox.left, boundingBox.top)
    .lineTo(boundingBox.right, boundingBox.top)
    .lineTo(boundingBox.right, boundingBox.bottom)
    .lineTo(boundingBox.left, boundingBox.bottom)
    .closePath()
    .stroke()
  ;(nodeTree as Group).addChild(boxShape)

  let { padding, paddingLeft, paddingTop, paddingRight, paddingBottom } = opt

  if (!Array.isArray(padding)) {
    padding = Array(4).fill(typeof padding === 'number' ? padding : 0)
  }

  paddingTop = paddingTop ?? padding[0] ?? 0
  paddingRight = paddingRight ?? padding[1] ?? 0
  paddingBottom = paddingBottom ?? padding[2] ?? 0
  paddingLeft = paddingLeft ?? padding[3] ?? 0

  const sw = boundingBox.right - boundingBox.left // source width
  const sh = boundingBox.bottom - boundingBox.top // source height
  const dw = canvas.offsetWidth - paddingLeft - paddingRight // destination width
  const dh = canvas.offsetHeight - paddingTop - paddingBottom // destination height

  const { scale, x, y } = getBackgroundData(sw, sh, dw, dh)

  console.log(sw, sh, dw, dh, scale, x, y, '--------')

  // nodeTree.scale = scale > 1 ? 1 : scale
  // nodeTree.x = x * scale
  // nodeTree.y = y * scale
  // const dst = {
  //   x: x + paddingLeft,
  //   y: y + paddingTop,
  //   onUpdate: (obj: Record<string, number>) => {
  //     needsUpdate = true
  //     nodeTree.x = obj.x
  //     nodeTree.y = obj.y
  //   },
  // }
  // ease(src, dst)

  if ((window as any).abc) {
    debugger
  }

  ease(nodeTree, {
    x: x + paddingLeft,
    y: y + paddingTop,

    scale,
    onUpdate: () => (needsUpdate = true),
  })

  ease(stage, {
    x: 0,
    y: 0,
    scale: 1,
    regX: 0,
    regY: 0,
    onUpdate: () => (needsUpdate = true),
  })
}
function update(stage: Stage) {
  if (needsUpdate) {
    stage.update()
    needsUpdate = false
  }
  id = requestAnimationFrame(() => update(stage))
}

export function doResort() {
  let srcMap = {} as Record<string, { x: number; y: number }>
  walk(nodeTree, (item: Element) => {
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
  doResort(nodeTree)
  walk(nodeTree, (item: Element) => {
    item.x = 0
    item.y = 0
  })
  layout(nodeTree)
  adjustPosition({ padding: centerConfig })
  needsUpdate = true
  let dstMap = {} as Record<string, Shape | Group>
  walk(nodeTree, (item: Element) => {
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
        needsUpdate = true
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
        needsUpdate = true
      }
    }
    ease(src, dst)
  })

  function doResort(tree: Group | Shape) {
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
      // return Math.random() - 0.5
      return -1
    })
    list.splice(0)
    list.push(...arr1, ...arr2)
  }
}

export function doReset() {
  needsUpdate = true
  Object.keys(dataMap).forEach(id => {
    const { src, dst } = dataMap[id as any]
    ease(src, dst)
  })
  adjustPosition({ padding: centerConfig })
}
