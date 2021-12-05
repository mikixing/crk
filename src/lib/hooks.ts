import Group from '../group'
import Shape from '../shape'

type Item = Group | Shape
type EventType = 'added' | 'removed'
class Hook {
  public type: string
  public target: Item
  public currentTarget: Item

  constructor(target: Item, currentTarget: Item) {
    this.target = target
    this.currentTarget = currentTarget
  }
}

export class Added extends Hook {
  public readonly type: EventType = 'added'
}
export class Removed extends Hook {
  public readonly type: EventType = 'removed'
}
