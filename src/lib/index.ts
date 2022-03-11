import Matrix, { deg2rad } from './Matrix'

interface IEl {
  x: number
  y: number
  rotation: number
  transformMatrix?: Matrix
  scaleX: number
  scaleY: number
  regX: number
  regY: number
  skewX: number
  skewY: number
}

export function getMatrix(el: IEl) {
  const {
    x = 0,
    y = 0,
    rotation = 0,
    transformMatrix,
    scaleX,
    scaleY,
    regX = 0,
    regY = 0,
    skewX = 0,
    skewY = 0,
  } = el

  return (
    transformMatrix ||
    new Matrix()
      .translate(x, y)
      .skew(skewX * deg2rad, skewY * deg2rad)
      .rotate(rotation * deg2rad)
      .scale(scaleX, scaleY)
      .translate(-regX, -regY)
  )
}
