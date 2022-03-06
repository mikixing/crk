import { GUI } from 'dat.gui'
import {
  Stage,
  Group,
  Shape as BaseShape,
  Element,
  CrkSyntheticEvent,
} from '@mikixing/crk'
import { ease } from '@mikixing/transition'

import {
  BoundingBox,
  getBackgroundData,
  setRoundRect,
  setWheel,
} from '../../util'
import data from './data3'
import { stdStage } from '../../common'

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
const MARGIN_Y = 300 // 父子节点的垂直距离

export default function setTree(canvasDom: HTMLCanvasElement) {
  let dataMap = ((window as any).map = {} as Record<
    number,
    {
      src: Record<string, number> | Element
      dst: Record<string, number | Function>
    }
  >)
  let canvas: HTMLCanvasElement
  let stage: Stage
  let root: Group

  let isCompact = true

  const gui = new GUI()
  gui.width = 100
  const d = {
    reset,
    compact: true,
    resort() {
      ticker.needsUpdate = true
      layoutAndAnimate({
        layout: root => {
          resort(root)
          if (isCompact) {
            layoutForCompact(root)
          } else {
            layoutForLoose(root)
          }
        },
      })
    },
  }

  gui.add(d, 'resort').name('随机排列')
  gui.add(d, 'reset').name('还原')
  gui
    .add(d, 'compact')
    .name('紧凑型')
    .onChange(v => {
      ticker.needsUpdate = true
      layoutAndAnimate({
        layout: root => {
          if (v) {
            layoutForCompact(root)
          } else {
            layoutForLoose(root)
          }
        },
      })
    })

  canvas = canvasDom
  ;(window as any).stage = stage = new Stage(canvas)
  stage.mouseMoveOutside = true
  // @ts-ignore
  // window.stage = stage
  const { el: rootNode } = initTree(stage, data, 0)
  ;(window as any).root = root = rootNode as Group
  ;(stage as Stage).addChild(rootNode)
  ;(stage as Stage).enableMouseOver(10)

  const bbShape = new Shape()
  root.addChild(bbShape)

  let { width, height, ticker, dispose } = stdStage(stage, {
    onResize: (ev, w, h) => {
      width = w
      height = h

      setContain(root, {
        width,
        height,
      })

      // 更新root节点目标值
      dataMap[root.uuid].dst = {
        x: root.x,
        y: root.y,
        scale: root.scale,
      }

      ticker.needsUpdate = true
    },
  })

  const removeWheel = setWheel(stage, () => (ticker.needsUpdate = true))

  ticker.on('frame', () => {
    stage.update()
  })

  layoutForCompact(root)
  setContain(root, {
    width,
    height,
  })

  collectResetData(root as Group)

  function reset() {
    ticker.needsUpdate = true
    Object.keys(dataMap).forEach(id => {
      const { src, dst } = dataMap[id as any]
      ease(src, dst)
    })

    ease(stage, {
      x: 0,
      y: 0,
      scale: 1,
      regX: 0,
      regY: 0,
      onUpdate: () => (ticker.needsUpdate = true),
    })
  }

  function collectResetData(root: Group) {
    walk(root, el => {
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
          ticker.needsUpdate = true
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
            scale: el.scale,
            onUpdate: (obj: Record<string, number>) => {
              Object.assign(el, obj)
            },
          },
        }
      }
    })
  }

  function setContain(
    node: Group,
    opt = {} as {
      width: number
      height: number
      padding?: number
    }
  ) {
    const { width: dw, height: dh, padding = 20 } = opt

    const bb = new BoundingBox(node)
    const { width: sw, height: sh } = bb
    const { x, y, scale } = getBackgroundData(sw, sh, dw, dh, {
      padding,
    })

    // bbShape.x = x
    // bbShape.y = y
    // bbShape.scale = scale
    // bbShape.graphics
    //   .clear()
    //   .rect(x, y, sw, sh)
    //   .setStrokeStyle({ color: '#f70', lineWidth: 2 })
    //   .stroke()

    node.x = x
    node.y = y
    node.scale = scale
  }

  function layoutAndAnimate(
    opt = {} as {
      layout?: (node: Group | Shape) => void
      afterLayout?: (node: Group | Shape) => void
    }
  ) {
    const { layout, afterLayout } = opt

    if (typeof layout !== 'function') return

    let srcMap = {} as Record<string, { x: number; y: number }>
    let dstMap = {} as Record<any, any>

    walk(root, (item: Element) => {
      let src: Record<string, number>
      srcMap[item.uuid] = src = { x: item.x, y: item.y, scale: item.scale }
      if ((item as Shape).type === 'line') {
        const { points = [] } = item as Shape
        points.forEach((p, i) => {
          src['x' + i] = p.x
          src['y' + i] = p.y
        })
      }

      item.x = item.y = 0
      item.scale = 1
    })

    layout(root)
    setContain(root, {
      width,
      height,
    })

    // 收集初始化后数据
    afterLayout?.(root)

    walk(root, (item: Element) => {
      if (!(item.uuid in srcMap)) return

      let dst = {} as Record<string, any>
      if ((item as Shape).type === 'line') {
        const { points = [] } = item as Shape
        points.forEach((p, index) => {
          dst['x' + index] = p.x
          dst['y' + index] = p.y
        })

        // @ts-ignore
        dst.onUpdate = (obj: Record<string, number>) => {
          ticker.needsUpdate = true
          Object.keys(obj).forEach(k => {
            const key = k.slice(0, 1) as 'x' | 'y'
            const index = +k.slice(1)

            if (points[index]) {
              points[index][key] = obj[k] as number
            } else {
              points[index] = {} as { x: number; y: number; uuid: string }
              points[index][key] = obj[k] as number
            }
          })
          drawLine(item as Shape)
        }
      } else {
        dst = {
          x: item.x,
          y: item.y,
          scale: item.scale,
          onUpdate: (obj: Record<string, number>) => {
            Object.assign(item, obj)
            ticker.needsUpdate = true
          },
        }
      }
      dstMap[item.uuid] = dst
      ease(srcMap[item.uuid], dst)
    })

    console.log(srcMap, dstMap)
  }

  stage.delegate('pressdown', 'canDrag', (ev: CrkSyntheticEvent) => {
    ev.stopPropagation()
    ticker.needsUpdate = true
    const { x, y } = ev
    const target = ev.target as Shape
    const isLeaf = target.type !== 'root'
    const { parent } = target
    const mat = isLeaf
      ? target.parent?.getWorldMatrix().invert()
      : target.parent?.parent?.getWorldMatrix().invert()
    const tmp = mat.transformPoint(x, y)
    const bx = tmp.x // begin x
    const by = tmp.y // begin y
    const { x: ox, y: oy } = target as Shape
    const { x: pox, y: poy } = parent ?? {}
    let pressmove: (ev: CrkSyntheticEvent) => void,
      pressup: (ev: CrkSyntheticEvent) => void
    ;(stage as Stage).on(
      'pressmove',
      (pressmove = (ev: CrkSyntheticEvent) => {
        ticker.needsUpdate = true
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
              if (points[location]) {
                points[location].x = p0.x
                points[location].y = p0.y
              }
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
            const rootShape = pp.children.find(
              child => (child as Shape).type === 'root'
            ) as Shape
            const lineShape = pp.children.find(
              child => (child as Shape).type === 'line'
            ) as Shape
            if (rootShape) {
              const p1 = rootShape.local2local(
                lineShape,
                (rootShape.width ?? 0) / 2,
                rootShape.height ?? 0
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
                if (tmp === lineShape || tmp === rootShape) {
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
                if (points[location]) {
                  points[location].x = p0.x
                  points[location].y = p0.y
                }
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
        ticker.needsUpdate = true
        ;(stage as Stage).removeListener('pressmove', pressmove)
        ;(stage as Stage).removeListener('pressup', pressup)
      })
    )
  })

  function getTextMarics(stage: Stage, text: string) {
    return stage.ctx.measureText(text)
  }

  function initTree(stage: Stage, node: Node, level: number) {
    const color = `hsl(${((level / 5) * 270) | 0}, 60%, 50%)`

    let shape = new Shape()
    let g = shape.graphics
    let textMetrics = getTextMarics(stage, node.name)
    let shapeWidth = textMetrics.width * 2 + 20
    let fixedHeight = 40
    const fontSize = 20
    shape.cursor = 'pointer'
    shape.width = shapeWidth
    shape.height = fixedHeight
    shape.addAttr('canDrag')
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
      shape.cursor = 'pointer'

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

  return () => {
    gui.destroy()
    dispose()
    removeWheel()
  }
}

function walk(el: Element, fn: (el: Element) => void) {
  fn(el)
  ;(el as Group).children?.forEach(e => walk(e, fn))
}

function layoutForCompact(node: Group | Shape) {
  let level = 0
  // let totalWidth = 0
  let totalHeight = 0
  let displayMap: any[] = []
  const root = node
  doLayout(node, totalHeight, level, displayMap)

  function doLayout(
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
        doLayout(child, totalHeight + MARGIN_Y, layer, container)
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
        const { x: coorX } = rootShape.parent.local2local(
          root,
          rootShape.x,
          rootShape.y
        )

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

function layoutForLoose(node: Group | Shape) {
  let totalWidth = 0
  let fixedHeight = 40
  let lineShape!: Shape
  let rootShape!: Shape
  let maxHeight = -Infinity
  const pts = [] as { uuid: number; el?: Shape }[]

  if ((node as Group)?.children?.length) {
    ;(node as Group)?.children.forEach((e: Shape | Group, i: number) => {
      let count = i
      const { width: elWidth, height: elHeight } = layoutForLoose(e)
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
        if (count) {
          totalWidth += MARGIN_X
        }
      }
      e.x = totalWidth
      totalWidth += elWidth
      e.y = MARGIN_Y
      // pts存局部坐标
      if (e instanceof Group) {
        const childRootShape = e.children.find(
          item => (item as Shape).type === 'root'
        ) as Shape
        pts.push({
          uuid: e.uuid,
          el: childRootShape,
        })
      } else {
        pts.push({ uuid: e.uuid, el: e })
      }
    })
    if (rootShape) {
      const { width = 0 } = rootShape
      if (lineShape) {
        // firstChildPoint
        const fs = pts[0].el as Shape
        let fp = fs.parent.local2local(rootShape.parent, fs.x, fs.y)
        // lastChildPoint
        const ls = pts[pts.length - 1].el as Shape
        const { width: lsWidth = 0 } = ls
        let lp = ls.parent.local2local(rootShape.parent, ls.x + lsWidth, ls.y)
        rootShape.x = (lp.x - fp.x) / 2 + fp.x - width / 2
        rootShape.y = 0
      } else {
      }
    }
    if (lineShape) {
      const { points = [] } = lineShape
      // 保留points引用
      points.forEach((p, i) => {
        if (i === 0) {
          const { width = 0, height = 0 } = rootShape
          // transform point
          const center = { x: rootShape.x + width / 2, y: height }
          const tp = rootShape.parent.local2local(
            lineShape.parent,
            center.x,
            center.y
          )
          p.x = tp.x
          p.y = tp.y
        } else {
          const { uuid } = p
          const target = pts.find(item => item.uuid === uuid) as IPoint & {
            el: Shape
          }
          const targetShape = target.el
          const { width = 0 } = targetShape
          const center = {
            x: targetShape.x + width / 2,
            y: targetShape.y,
          }
          // transform point
          let tp = targetShape.parent.local2local(
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
    const totalHeight = maxHeight + MARGIN_Y

    return { width: totalWidth, height: totalHeight }
  }
  node.x = 0
  node.y = 0
  return { width: (node as Shape).width ?? 0, height: fixedHeight }
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
    doSetCompare(currentItem, list.slice(0, i), subroot)
  }

  function doSetCompare(data: any, compareData: any, subroot: Group, type = 0) {
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
            doSetCompare(childData, newCompareData, type ? subroot : parent, 1)
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

function resort(tree: Group | Shape) {
  if (tree instanceof Shape) return

  let list = (tree as Group).children
  const arr1 = list.filter(
    item => (item as Shape)?.type === 'line' || (item as Shape)?.type === 'root'
  )
  const arr2 = list.filter(
    item => (item as Shape)?.type !== 'line' && (item as Shape)?.type !== 'root'
  )
  let arr = arr2
  if (arr2.length === 1 && arr2[0] instanceof Group) {
    arr = arr2[0].children
  }

  arr.sort((a: Group | Shape, b: Group | Shape) => {
    resort(a)
    resort(b)
    return Math.random() - 0.5
  })
  list.splice(0)
  list.push(...arr1, ...arr2)
}
