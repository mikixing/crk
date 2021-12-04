import { deg2rad, rad2deg, Graphics } from '@mikixing/crk'

interface RoundCircle {
  x?: number
  y?: number
  startAngle: number
  endAngle: number
  thickness: number
  radius?: number
  roundRadius?: number
  startInnerRadius?: number
  startOuterRadius?: number
  endInnerRadius?: number
  endOuterRadius?: number
  anticlockwise?: boolean
}

export default function getRoundCircle(g: Graphics, opt: RoundCircle) {
  // 参数标准化
  const {
    x = 0,
    y = 0,
    startAngle = 0,
    endAngle = 0,
    thickness = 0,
    radius = 0,
    roundRadius = 0,
    anticlockwise = false,
  } = opt

  const sir = opt.startInnerRadius ?? roundRadius
  const sor = opt.startOuterRadius ?? roundRadius
  const eir = opt.endInnerRadius ?? roundRadius
  const eor = opt.endOuterRadius ?? roundRadius

  let stdsor
  let stdsir
  let stdeor
  let stdeir

  const obj = {} as any

  const sign = anticlockwise ? -1 : 1
  const halfPI = Math.PI / 2
  const PI = Math.PI
  const twoPI = Math.PI * 2
  const R = radius + thickness
  const startRad = (startAngle * deg2rad) % twoPI
  const endRad = (endAngle * deg2rad) % twoPI

  let range
  if (sign === 1 && endAngle >= startAngle) {
    range = ((endAngle - startAngle) * deg2rad) % twoPI
  } else if (sign === 1 && endAngle < startAngle) {
    range = twoPI - (((startAngle - endAngle) * deg2rad) % twoPI)
  } else if (sign === -1 && endAngle >= startAngle) {
    range = twoPI - (((endAngle - startAngle) * deg2rad) % twoPI)
  } else {
    range = ((startAngle - endAngle) * deg2rad) % twoPI
  }

  let lastRad
  // sir
  {
    const [stdRadius, rad] = setStdInnerData(thickness, radius, sir, range)
    stdsir = stdRadius
    const h = stdRadius + radius // 斜边
    const start = -sign * (PI - rad) + startRad
    const end = -sign * halfPI + startRad
    const ox = Math.cos(rad * sign + startRad) * h + x
    const oy = Math.sin(rad * sign + startRad) * h + y

    g.arc(ox, oy, stdRadius, start, end, anticlockwise)
    lastRad = end

    obj.sir = {
      x: ox,
      y: oy,
      r: stdRadius,
    }
  }

  // sor
  {
    const [stdRadius, rad] = setStdOuterData(thickness, radius, sor, range)
    stdsor = stdRadius
    const h = R - stdRadius // 斜边
    const ox = Math.cos(rad * sign + startRad) * h + x
    const oy = Math.sin(rad * sign + startRad) * h + y
    const end = sign * rad + startRad

    g.arc(ox, oy, stdRadius, lastRad, end, anticlockwise)
    lastRad = end

    obj.sor = {
      x: ox,
      y: oy,
      r: stdRadius,
    }
  }

  // R
  {
    const [stdRadius, rad] = setStdOuterData(thickness, radius, eor, range)
    stdeor = stdRadius
    const h = R - stdRadius // 斜边
    const end = endRad - rad * sign

    obj.bigStart = lastRad
    obj.bigEnd = end

    let drawableR = true
    if (
      anticlockwise &&
      Math.abs(end - lastRad) % (Math.PI * 2) <= 0.2 &&
      Math.abs(stdsor - stdeor) <= 3
    ) {
      drawableR = false
    }
    if (
      !anticlockwise &&
      Math.abs(end - lastRad) % (Math.PI * 2) <= 0.2 &&
      Math.abs(stdsor - stdeor) <= 3
    ) {
      drawableR = false
    }

    // 大圆
    drawableR && g.arc(x, y, R, lastRad, end, anticlockwise)
    lastRad = end
  }

  // eor
  {
    const [stdRadius, rad] = setStdOuterData(thickness, radius, eor, range)
    stdeor = stdRadius
    const h = R - stdRadius // 斜边
    const ox = Math.cos(lastRad) * h + x
    const oy = Math.sin(lastRad) * h + y
    const end = sign * halfPI + endRad

    obj.x3 = ox
    obj.y3 = oy

    g.arc(ox, oy, stdRadius, lastRad, end, anticlockwise)
    lastRad = end

    obj.eor = {
      x: ox,
      y: oy,
      r: stdRadius,
    }
  }

  // eir
  {
    const [stdRadius, rad] = setStdInnerData(thickness, radius, eir, range)
    stdeir = stdRadius
    const h = stdRadius + radius // 斜边
    const ox = Math.cos(endRad - sign * rad) * h + x
    const oy = Math.sin(endRad - sign * rad) * h + y
    obj.x4 = ox
    obj.y4 = oy
    const end = lastRad + sign * (halfPI - rad)
    g.arc(ox, oy, stdRadius, lastRad, end, anticlockwise)

    lastRad = end

    obj.eir = {
      x: ox,
      y: oy,
      r: stdRadius,
    }
  }

  // radius
  {
    const [, rad] = setStdInnerData(thickness, radius, eir, range)
    const start = endRad - sign * rad
    const [, rad2] = setStdInnerData(thickness, radius, sir, range)
    const end = startRad + sign * rad2

    let drawableR = true
    if (
      anticlockwise &&
      Math.abs(end - start) % (Math.PI * 2) <= 0.2 &&
      Math.abs(stdeir - stdsir) <= 3
    ) {
      drawableR = false
    }
    if (
      !anticlockwise &&
      Math.abs(end - start) % (Math.PI * 2) <= 0.2 &&
      Math.abs(stdeir - stdsir) <= 3
    ) {
      drawableR = false
    }

    // 小圆
    drawableR && g.arc(x, y, radius, start, end, !anticlockwise)
  }

  g.closePath()

  return obj
}

function setStdInnerData(
  thickness: number,
  radius: number,
  roundRadius: number,
  range: number
) {
  // 圆角半径不能超过圆环厚度 1/2
  const rr = Math.min(thickness / 2, roundRadius)

  // 通过圆角求出夹角
  const a = Math.asin(rr / (radius + rr))

  // 夹角不能超过圆环弧度的 1/2
  const stdRad = Math.min(range / 2 + 0.01, a)

  // 根据标准夹角反求出标准圆角
  const stdRadius = (Math.sin(stdRad) * radius) / (1 - Math.sin(stdRad))

  return [stdRadius > 0 ? stdRadius : 0.01, stdRad]
}
function setStdOuterData(
  thickness: number,
  radius: number,
  roundRadius: number,
  range: number
) {
  const maxRadius = thickness / 2
  const rr = Math.min(maxRadius, roundRadius)
  const a = Math.asin(rr / (thickness + radius - rr))

  const stdRad = Math.min(range / 2 + 0.01, a)
  const stdRadius =
    ((thickness + radius) * Math.sin(stdRad)) / (1 + Math.sin(stdRad))

  return [stdRadius > 0 ? stdRadius : 0.01, stdRad]
}
