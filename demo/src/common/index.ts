import { debounce, initCanvas } from '../util'
import { Stage, Ticker } from '@mikixing/crk'

export * as layout from './layout'

interface IStdOpt {
  onResize?: (ev: UIEvent, width: number, height: number) => void
}
// 1. resize
// 2. canvas dpr处理
// 3. 监听帧率
export function stdStage(stage: Stage, opt = {} as IStdOpt) {
  const { onResize } = opt
  const canvas = stage.canvas
  const ticker = new Ticker()

  let resizeFn: (ev: UIEvent) => void

  let [width, height] = initCanvas(canvas)

  window.addEventListener(
    'resize',
    (resizeFn = debounce(ev => {
      ;[width, height] = initCanvas(canvas)
      onResize?.(ev, width, height)
    }))
  )

  return {
    ticker,
    width,
    height,
    dispose() {
      ticker.dispose()
      window.removeEventListener('resize', resizeFn)
    },
  }
}
