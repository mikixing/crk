import Element from './element'
import Shape from './shape'
import Stage from './stage'
import Bitmap from './bitmap'
import { Added, Removed } from './lib/hooks'

export type Item = Group | Shape | Bitmap

export default class Group extends Element {
  public children: Item[] = []
  public parent: Group | Stage = null

  public addChild(...args: Item[]) {
    if (args.length === 0) return

    args.forEach((item, i) => {
      if (!(item instanceof Shape) && !(item instanceof Group))
        throw TypeError(
          `args[${i}] must be an instance of Shape / Group / Bitmap!`
        )
    })

    args.forEach(child => {
      child.parent = this
      this.children.push(child)

      // 抛出added事件
      const e = new Added(child, child)
      child.emit(e.type, e)
    })
  }

  public removeChild(child: Item) {
    let index = this.children.findIndex((e: Item) => child === e)
    if (~index) {
      this.children.splice(index, 1)

      // 抛出removed事件
      const e = new Removed(child, child)
      child.emit(e.type, e)
    }
  }

  public removeChildAt(index: number) {
    this.children.splice(index, 1)
  }

  public hasChild(child: Item) {
    let flag = !!this.children.find(item => item === child)
    return flag
  }

  public removeAllChildren() {
    this.children = []
  }

  public getChildAt(index: number) {
    return this.children[index]
  }

  public swapChildren(child1: Item, child2: Item) {
    let index1 = this.getChildIndex(child1)
    let index2 = this.getChildIndex(child2)
    this.children[index1] = child2
    this.children[index2] = child1
  }
  public swapChildrenAt(index1: number, index2: number) {
    let child1 = this.children[index1]
    let child2 = this.children[index2]
    if (!child1 || !child2) return
    this.swapChildren(child1, child2)
  }

  public sortChildren(fn: (child1: Item, child2: Item) => number) {
    this.children.sort((a, b) => fn(a, b))
  }

  // 层级操作
  public setChildIndex(child: Item, index: number) {
    if (index < 0 || index > this.children.length) return
    const currentIndex = this.children.indexOf(child)
    this.children.splice(currentIndex, 1)
    if (index > currentIndex) {
      this.children.splice(index + 1, 0, child)
    } else {
      this.children.splice(index, 0, child)
    }
  }

  public getChildIndex(child: Item) {
    return this.children.findIndex(item => item === child)
  }

  public doUpdate(ctx: CanvasRenderingContext2D) {
    const { alpha, visible, mask } = this

    if (alpha === 0 || !visible) return

    ctx.save()
    if (mask) {
      const mat = mask.setTransform(ctx)
      mask.use(ctx)
      ctx.clip()

      const { a, b, c, d, e, f } = mat.invert()
      ctx.transform(a, b, c, d, e, f) // reset transform to the last state
    }
    this.setTransform(ctx)
    this.children.forEach(child => {
      child.doUpdate(ctx)
    })
    ctx.restore()
  }
}
