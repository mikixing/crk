import Element from './element'
import Shape from './shape'
import Stage from './stage'
import Bitmap from './bitmap'

export type Item = Group | Shape | Bitmap

export default class Group extends Element {
  public children: Item[] = []
  public parent: Group | Stage = null

  addChild(...args: Item[]) {
    if (args.length === 0) return

    args.forEach((item, i) => {
      if (
        !(item instanceof Shape) &&
        !(item instanceof Group) &&
        !(item instanceof Bitmap)
      )
        throw TypeError(
          `args[${i}] must be an instance of Shape / Group / Bitmap!`
        )
    })

    args.forEach(child => {
      child.parent = this
      this.children.push(child)
    })
  }

  removeChild(child: Item) {
    let index = this.children.findIndex((e: Item) => child === e)
    if (~index) {
      this.children.splice(index, 1)
    }
  }

  removeAllChildren() {
    this.children = []
  }

  public doUpdate(ctx: CanvasRenderingContext2D) {
    ctx.save()
    this.setTransform(ctx)
    this.setAlpha(ctx)
    this.children.forEach(child => {
      child.doUpdate(ctx)
    })
    ctx.restore()
  }
}
