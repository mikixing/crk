import Element from '../element'
import Shape from '../Shape'

interface Config {
  x: number
  y: number
  target?: Element | null
  currentTarget?: Element | null
}
type OptionalConfig = Partial<Config>

type EventType =
  | 'click'
  | 'dblclick'
  | 'mouseover'
  | 'mouseout'
  | 'pressdown'
  | 'pressmove'
  | 'pressup'
  | 'mouseenter'
  | 'mouseleave'
  | 'rollover'
  | 'rollout'

export abstract class SyntheticEvent {
  public abstract readonly type: EventType
  public x = 0
  public y = 0
  public target: Element | null
  public currentTarget: Element | null
  public readonly nativeEvent

  private _bubble = true

  constructor(ev: MouseEvent, config: OptionalConfig) {
    this.nativeEvent = ev

    this.x = config.x ?? 0
    this.y = config.y ?? 0
    this.target = config.target ?? null
    this.currentTarget = config.currentTarget ?? null
  }

  public stopPropagation() {
    this._bubble = false
  }

  public get bubble() {
    return this._bubble
  }
}

export class ClickEvent extends SyntheticEvent {
  public readonly type: EventType = 'click'
}

export class DblClickEvent extends SyntheticEvent {
  public readonly type: EventType = 'dblclick'
}

export class PressdownEvent extends SyntheticEvent {
  public readonly type: EventType = 'pressdown'
}
export class PressMoveEvent extends SyntheticEvent {
  public readonly type: EventType = 'pressmove'
}

export class PressUpEvent extends SyntheticEvent {
  public readonly type: EventType = 'pressup'
}
export class MouseOverEvent extends SyntheticEvent {
  public readonly type: EventType = 'mouseover'
}

export class MouseOutEvent extends SyntheticEvent {
  public readonly type: EventType = 'mouseout'
}

export class MouseEnterEvent extends SyntheticEvent {
  public readonly type: EventType = 'mouseenter'
}

export class MouseLeaveEvent extends SyntheticEvent {
  public readonly type: EventType = 'mouseleave'
}

export class RolloverEvent extends SyntheticEvent {
  public readonly type: EventType = 'rollover'
}

export class RolloutEvent extends SyntheticEvent {
  public readonly type: EventType = 'rollout'
}
