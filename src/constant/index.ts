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
  createLinearGradientFill,
  createLinearGradientStroke,
  createRadialGradientFill,
  createRadialGradientStroke,
  setShadow,
  save,
  restore,
}

export type ActionKeys = keyof typeof ActionTypes
export type NativeMethodTypes = Exclude<
  ActionKeys,
  | 'setStrokeStyle'
  | 'setStrokeDash'
  | 'setFillStyle'
  | 'setTextStyle'
  | 'createLinearGradientFill'
  | 'createLinearGradientStroke'
  | 'createRadialGradientFill'
  | 'createRadialGradientStroke'
  | 'setShadow'
>

export const ActionKeyMap = Object.keys(ActionTypes).reduce(
  (map, k: ActionKeys) => {
    const key = ActionTypes[k]
    map[key] = k
    return map
  },
  {} as { [x: number]: ActionKeys }
)

export type TCursor =
  | 'auto'
  | 'default'
  | 'none'
  | 'context-menu'
  | 'help'
  | 'pointer'
  | 'progress'
  | 'wait'
  | 'cell'
  | 'crosshair'
  | 'text'
  | 'vertical-text'
  | 'alias'
  | 'copy'
  | 'move'
  | 'no-drop'
  | 'not-allowed'
  | 'grab'
  | 'grabbing'
  | 'all-scroll'
  | 'col-resize'
  | 'row-resize'
  | 'n-resize'
  | 'e-resize'
  | 's-resize'
  | 'w-resize'
  | 'ne-resize'
  | 'nw-resize'
  | 'se-resize'
  | 'sw-resize'
  | 'ew-resize'
  | 'ns-resize'
  | 'nesw-resize'
  | 'nwse-resize'
  | 'zoom-in'
  | 'zoom-out'
