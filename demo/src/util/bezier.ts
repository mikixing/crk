const Bezier = (_ => {
  const lut = [
    [1],
    [1, 1],
    [1, 2, 1],
    [1, 3, 3, 1],
    [1, 4, 6, 4, 1],
    [1, 5, 10, 10, 5, 1],
    [1, 6, 15, 20, 15, 6, 1],
    [1, 7, 21, 35, 35, 21, 7, 1],
    [1, 8, 28, 56, 70, 56, 28, 8, 1],
    [1, 9, 36, 84, 126, 126, 84, 36, 9, 1],
    [1, 10, 45, 120, 210, 252, 210, 120, 45, 10, 1],
  ]

  class Bezier {
    public params: number[] = []
    constructor(...args: number[]) {
      args.length && this.setParam(...args)
    }

    setParam(...args: number[]) {
      this.params = args
    }

    get(t: number) {
      const { params = [] } = this

      if (!params || !params.length || typeof t !== 'number') {
        return 0
      }

      const n = params.length - 1
      const binomials = lut[n]

      let i = 0,
        val = 0,
        ke

      for (; i <= n; i++) {
        ke = binomials[i] * (1 - t) ** (n - i) * t ** i
        val += ke * params[i]
      }

      return val
    }
  }

  return Bezier
})()

// 贝塞尔曲线分段
export function getLUT(list: number[], interval = 0.01) {
  const segments = Math.ceil(1 / interval)
  const lut = Array(segments + 1)
  const be = new Bezier(...list)

  for (let i = 0, t = 0; ; i++) {
    lut[i] = be.get(t)

    if (t === 1) {
      break
    }

    t = Math.min(1, t + interval)
  }

  return lut
}

export default Bezier
