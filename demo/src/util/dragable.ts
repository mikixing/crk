import { Element, CrkSyntheticEvent, Group } from '@mikixing/crk'

export default function dragable(
  el: Element,
  opt = {} as {
    onPressdown?: (ev: CrkSyntheticEvent) => void
    onPressmove?: (
      ev: CrkSyntheticEvent,
      ox: number,
      oy: number,
      dx: number,
      dy: number
    ) => number[]
    onPressup?: (ev: CrkSyntheticEvent) => void
    target?: Element
  },
  isDelegated: boolean = false
) {
  let { target } = opt as { target: Element }

  if (target) {
    if (!isWrap(target, el)) {
      throw new Error('opt?.target must be the ancestor of el')
    }
  } else {
    target = el
  }
  if (isDelegated) target = el

  let pressdownFn: (ev: CrkSyntheticEvent) => void
  let pressmoveFn: (ev: CrkSyntheticEvent) => void
  let pressupFn: (ev: CrkSyntheticEvent) => void
  el.addListener(
    'pressdown',
    (pressdownFn = (ev: CrkSyntheticEvent) => {
      // 考虑target可能是stage
      const parent = target.parent || target
      // start x, start y
      const { x: sx, y: sy } = ev
      const { x: ox, y: oy } = el
      const parentMat = parent.getMatrix()
      const sp = parentMat.transformPoint(sx, sy) // start point
      opt?.onPressdown?.(ev)
      target.addListener(
        'pressmove',
        (pressmoveFn = (ev: CrkSyntheticEvent) => {
          const { x: cx, y: cy } = ev // current x, current y
          const cp = parentMat.transformPoint(cx, cy) // curent point
          const dx = cp.x - sp.x
          const dy = cp.y - sp.y

          let x, y
          if (opt?.onPressmove) {
            const [l, t] = opt?.onPressmove?.(ev, ox, oy, dx, dy)
            x = l
            y = t
          } else {
            x = ox + dx
            y = oy + dy
          }

          target.x = x
          target.y = y
        })
      )
      target.addListener(
        'pressup',
        (pressupFn = (ev: CrkSyntheticEvent) => {
          target.removeListener('pressmove', pressmoveFn)
          target.removeListener('pressup', pressupFn)
          opt?.onPressup?.(ev)
        })
      )
    })
  )
  return () => el.removeListener('pressdown', pressdownFn)
}

// 判断a是否是b的父元素
function isWrap<T extends { parent?: T | null }>(a: T, b: T) {
  if (!a || !b) return false

  do {
    if (a === b) return true
  } while ((b = b.parent as T))

  return false
}
