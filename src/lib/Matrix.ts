export const deg2rad = Math.PI / 180
export const rad2deg = 180 / Math.PI

export default class Matrix {
  static deg2rad = deg2rad
  static rad2deg = rad2deg

  public a: number = 1
  public b: number = 0
  public c: number = 0
  public d: number = 1
  public e: number = 0
  public f: number = 0

  constructor(a = 1, b = 0, c = 0, d = 1, e = 0, f = 0) {
    this.a = a
    this.b = b
    this.c = c
    this.d = d
    this.e = e
    this.f = f
  }

  // 右乘
  appendMatrix(m: Matrix) {
    if (!(m instanceof Matrix)) {
      throw new TypeError('m 必须是 Matrix 的实例')
    }
    const { a, b, c, d, e, f } = m
    return this.append(a, b, c, d, e, f)
  }

  append(a: number, b: number, c: number, d: number, e: number, f: number) {
    const { a: aa, b: bb, c: cc, d: dd, e: ee, f: ff } = this
    this.a = aa * a + cc * b
    this.b = bb * a + dd * b
    this.c = aa * c + cc * d
    this.d = bb * c + dd * d
    this.e = aa * e + cc * f + ee
    this.f = bb * e + dd * f + ff

    return this
  }

  // 左乘
  prepend(a: number, b: number, c: number, d: number, e: number, f: number) {
    const { a: aa, b: bb, c: cc, d: dd, e: ee, f: ff } = this
    this.a = a * aa + c * bb
    this.b = b * aa + d * bb
    this.c = a * cc + c * dd
    this.d = b * cc + d * dd
    this.e = a * ee + c * ff + e
    this.f = b * ee + d * ff + f

    return this
  }

  prependMatrix(m: Matrix) {
    if (!(m instanceof Matrix)) {
      throw new TypeError('m 必须是 Matrix 的实例')
    }
    const { a, b, c, d, e, f } = m
    return this.prepend(a, b, c, d, e, f)
  }

  translate(x: number, y: number) {
    return this.append(1, 0, 0, 1, x, y)
  }

  rotate(rad: number) {
    const sin = Math.sin(rad)
    const cos = Math.cos(rad)
    return this.append(cos, sin, -sin, cos, 0, 0)
  }

  scale(sx: number, sy: number) {
    return this.append(sx, 0, 0, sy, 0, 0)
  }

  skew(skewX: number, skewY: number) {
    const sx = skewX
    const sy = skewY

    const cosx = Math.cos(sx)
    const sinx = Math.sin(sx)
    const cosy = Math.cos(sy)
    const siny = Math.sin(sy)

    return this.append(cosy, siny, -sinx, cosx, 0, 0)
  }

  transformPoint(x: number, y: number) {
    const { a, b, c, d, e, f } = this
    return { x: a * x + c * y + e, y: b * x + d * y + f }
  }

  clone() {
    const { a, b, c, d, e, f } = this
    return new Matrix(a, b, c, d, e, f)
  }

  // 求逆矩阵
  invert() {
    const { a, b, c, d, e, f } = this
    const n = a * d - b * c

    this.a = d / n
    this.b = -b / n
    this.c = -c / n
    this.d = a / n
    this.e = (c * f - d * e) / n
    this.f = -(a * f - b * e) / n

    return this
  }

  // 分解
  decompose() {
    const ret = {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      skewX: 0,
      skewY: 0,
    }

    ret.x = this.e
    ret.y = this.f
    ret.scaleX = Math.sqrt(this.a * this.a + this.b * this.b)
    ret.scaleY = Math.sqrt(this.c * this.c + this.d * this.d)

    var skewX = Math.atan2(-this.c, this.d)
    var skewY = Math.atan2(this.b, this.a)

    var delta = Math.abs(1 - skewX / skewY)
    if (delta < 0.00001) {
      // effectively identical, can use rotation:
      ret.rotation = skewY / deg2rad
      if (this.a < 0 && this.d >= 0) {
        ret.rotation += ret.rotation <= 0 ? 180 : -180
      }
      ret.skewX = ret.skewY = 0
    } else {
      ret.skewX = skewX / deg2rad
      ret.skewY = skewY / deg2rad
    }

    return ret
  }
}
