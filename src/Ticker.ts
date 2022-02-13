import { EventEmitter } from 'events'

interface IOpt {
  starting?: boolean
}

export default class Ticker extends EventEmitter {
  public needsUpdate = true

  private rafId: number

  constructor(opt = {} as IOpt) {
    super()

    const { starting = true } = opt
    starting && this.start()
  }

  public start() {
    this.rafId = requestAnimationFrame(() => {
      if (this.needsUpdate) {
        this.emit('frame')
        this.needsUpdate = false
      }

      this.start()
    })
  }

  public dispose() {
    cancelAnimationFrame(this.rafId)
  }
}
