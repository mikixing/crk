export enum ActionTypes {
  beginPath,
  closePath,
  moveTo,
  lineTo,
  quadraticCurveTo,
  bezierCurveTo,
  arc,
  arcTo,
  setStrokeStyle,
  setStrokeDash,
  setFillStyle,
  stroke,
  fill,
  setTextStyle,
  strokeText,
  fillText,
  drawImage,
  rect,
  save,
  restore,
}

export type ActionKeys = keyof typeof ActionTypes
export type NativeMethodTypes = Exclude<
  ActionKeys,
  'setStrokeStyle' | 'setStrokeDash' | 'setFillStyle' | 'setTextStyle'
>

export const ActionKeyMap = Object.keys(ActionTypes).reduce(
  (map, k: ActionKeys) => {
    const key = ActionTypes[k]
    map[key] = k
    return map
  },
  {} as { [x: number]: ActionKeys }
)
