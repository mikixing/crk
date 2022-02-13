import { Stage, Ticker } from '../../../types'
import { initCanvas, setAnchor } from '../util'

interface IStdOpt {
  stage: Stage
  width?: number
  height?: number
  onResize?: (ev: UIEvent) => void
}
// 1. resize
// 2. canvas dpr处理
// 4. 平移 缩放
// 5. 监听帧率
export function stdStage(opt = {} as IStdOpt) {
  const { stage, width, height, onResize } = opt
  const canvas = stage.canvas
  const ticker = new Ticker()

  let bb = canvas.getBoundingClientRect()

  initCanvas(canvas, width ?? canvas.offsetWidth, height ?? canvas.offsetHeight)

  // 设置canvas画布平移,缩放
  setWheelEvent()

  let resizeFn: (ev: UIEvent) => void
  window.addEventListener(
    'resize',
    (resizeFn = ev => {
      initCanvas(canvas)
      bb = canvas.getBoundingClientRect()
      onResize?.(ev)
    })
  )

  return {
    ticker,
    dispose() {
      window.removeEventListener('resize', resizeFn)
    },
  }

  function setWheelEvent() {
    canvas.addEventListener('wheel', ev => {
      if (ev.deltaMode === ev.DOM_DELTA_PIXEL) {
        if (ev.ctrlKey || ev.metaKey) {
          // zoom
          let { x, y } = stage.global2local(
            ev.clientX - bb.x,
            ev.clientY - bb.y
          )
          setAnchor(stage, x, y)

          const ss = stage.scale * Math.pow(0.98, ev.deltaY)
          stage.scale = ss
        } else {
          stage.x += -ev.deltaX
          stage.y += -ev.deltaY
        }

        ticker.needsUpdate = true
        ev.preventDefault()
      }
    })
  }
}
