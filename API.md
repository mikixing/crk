# API

- [图形类](#图形类)
- [事件系统](#事件系统)
- [矩阵](#矩阵)
- [向量](#向量)

### 图形类

`crk` 对 canvas 图形绘制抽象成了几种类以构建复杂图形树结构. 包含以下几种类:

- [Element - 基类](#element)
- [Stage - 舞台类](#stage)
- [Group - 分组类](#Group)
- [Shape - 舞台类](#Stage)
- [Bitmap - 舞台类](#Stage)

#### Element

图形基类, 继承于 [events.EventEmitter](https://nodejs.org/api/events.html#class-eventemitter) 事件类, `const el = new Element()`

- `el` 实例 属性/方法:
  - `x: number = 0` - 在父坐标系中的横坐标值
  - `y: number = 0` - 在父坐标系中的纵坐标值
  - `regX: number = 0` - 横坐标位移
  - `regY: number = 0` - 纵坐标位移
  - `scaleX: number = 1` - 横坐标缩放倍数
  - `scaleY: number = 1` - 纵坐标缩放倍数
  - `scale: number = 1` - 同时设置横坐标缩放和纵坐标缩放
  - `rotation: number = 0` - 旋转角度
  - `skewX: number = 0` - 横坐标倾斜角度
  - `skewY: number = 0` - 纵坐标倾斜角度
  - `alpha: number = 1` - 不透明度
  - `visible: boolean= true ` - 元素可见与否
  - `transformMatrix: any = null` - 设置元素的变换矩阵, 优先级高于设置 x, y, regX, regY, scaleX, scaleY, scale, skewX, skewY
  - `parent: Element | null` - 父元素
  - `ignoreEvent: boolean = false` - 是否忽略事件
  - `cursor: TCursor | string = 'default'` , TCursor 类型具体参见代码
  - `root: Stage | null` , 根节点
  - `stage: Stage | null` , stage 节点
  - `attrMap: Record<string, boolean>` , 用于业务开发存放特殊标记属性
  - `set(opt?: Partial<Transform & { alpha: number; visible: boolean }>)` - 设置旋转, 位移, 缩放, 倾斜, 透明度, 显示隐藏与否等
  - `setEventRect(x: number, y: number, width: number, height: number)` - 设置元素接受事件面积
  - `cache(x: number, y: number, width: number, height: number, dpr = 1)` - 缓存元素
  - `updateCache` - 更新缓存元素
  - `getMatrix() ` - 获取元素的变幻矩阵
  - `getWorldMatrix()` - 元素转成世界坐标的变幻矩阵
  - `local2global(x: number, y: number)` - 当前坐标转成世界坐标
  - `global2local(x: number, y: number)` - 世界坐标转成本地坐标
  - `local2local(el: Element, x: number, y: number)` - 本地坐标互转
  - `addAttr(...names: string[])` - 设置特殊属性
  - `removeAttr(...names: string[])` - 移除特殊属性
  - `hasAttr(name: string): boolean` - 判断特殊属性是否存在
  - `delegate(type: string, attr: string, fn: (ev: SyntheticEvent) => void): removeDelegateFunction` - 事件委托
    - `type`: 事件类型
    - `attr`: 特殊属性 , 用于筛选事件发生对象
    - `fn`: 回调函数
    - `removeDelegateFunction`: 卸载事件委托函数

##### Stage

舞台类, 继承于 `Group` 类

- `const stage = Stage(canvas: HTMLCanvasElement, opt?)`
  - `opt?` - 对象
    - `bindEvent?: boolean = true` - 是否绑定事件
    - `mouseMoveOutside?: boolean = true` - 是否监听 body 的 mousemove 事件
- `stage` 实例
  - `canvas` - canvas 元素
  - `mouseMoveOutside: boolean = true` - 是否监听 body 的 mousemove 事件
  - `enableMouseOver(ms: number)` - 是否监听 canvas 内部图形的 mouseover 事件, 默认 10 毫秒, 设置 0 毫秒将不开启 ( 若已开启监听 , 将卸载监听 )
  - `setCanvas(canvas:HTMLCanvasElement, opt?)` - 设置画布
    - `opt?` - 对象
      - `bindEvent?: boolean = true` - 是否绑定事件
      - `mouseMoveOutside?: boolean = true` - 是否监听 body 的 mousemove 事件
  - `clearCanvas()` - 清除 canvas 画布
  - `update()` - 在画布上重新绘图

**Group - 分组类** ( 容器类 )

继承于 `Element` 类

- `group` 实例
  - `addChild(...args: (Group | Shape)[])` - 向分组中添加子元素
  - `removeChild(child: Group | Shape)` - 移除子元素
  - `removeChildAt(index: number)` - 移除第 index 个子元素
  - `removeAllChildren()` - 移除所有子元素
  - `hasChild(child: Shape | Group): boolean` - 判断是否存在某个元素
  - `getChildAt(index): Group | Shape | undefined` - 取位置在 index 的子元素
  - `swapChildren(child1: Group | Shape, child2: Group | Shape)` - 交换子元素位置
  - `swapChildrenAt(index1: number, index2: number)` - 通过位置编号交换子元素
  - `sortChildren(fn: (child1: Group | Shape, child2: Group | Shape) => number)`
  - `setChildIndex(child: Group | Shape, index: number)` - 设置子元素层级
  - `getChildIndex(child: Group | Shape)` - 获得子元素层级

**Shape - 基础图形类**

继承于 `Element` 类, 实例的 `garphics` 属性用于绘制路径、 图形

`const shape = new Shape(graphics?: Graphics)`

- `shape实例`
  - `graphics: Graphics`
  - `parent: null | Group | Stage`

**Bitmap - 位图类**

继承 `Shape` 类, 用于将图片绘制到画布上

```javascript
const bitmap = new Bitmap(
  image: HTMLImageElement | HTMLCanvasElement,
  sx?:number,
  sy?: number,
  sw?: number,
  sh?: number,
  dx?: number,
  dy?: number,
  dw?: number,
  dh?: number
)
```

**Graphics - 绘制类**

`const graphics = new Graphics()`

`graphics` 是 `crk` 库唯一具备绘制能力的对象, 作为`shape` 的 `graphics` 属性使用, 单独使用不生效. 具有一套完整覆盖 `CanvasRenderingContext2D` 绘图 api 的方法, 属性. 熟悉 `CanvasRenderingContext2D` 的朋友使用起来简单易上手.

- `beginPath()` - 新建路径

- `moveTo(x: number, y: number)` - 移动到 (x, y) 位置

- `lineTo(x: number, y: number)` - 与 (x, y) 位置的点相连接

- `bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number)` - 绘制三阶贝塞尔曲线
  - x1: 第一个控制点横坐标
  - y1: 第一个控制点纵坐标
  - x2: 第二个控制点横坐标
  - y2: 第二个控制点纵坐标
  - x3: 终点横坐标
  - y3: 终点纵坐标
- `quadraticCurveTo(x1: number, y1: number, x2: number, y2: number)` - 绘制二阶贝塞尔曲线

  - x1: 第一个控制点横坐标
  - y1: 第一个控制点纵坐标
  - x2: 终点横坐标
  - y2: 终点纵坐标

- `arc(x: number, y: number, radius: number, startAngle: number, endAngle:number,anticlockwise = false )` - 绘制圆

  - x: 圆心横坐标
  - y: 圆心纵坐标
  - radius: 半径
  - startAngle: 起始角度
  - endAngle: 结束角度
  - anticlockwise: 是否是逆时针, 默认否

- `arcTo(x1: number, y1: number, x2: number, y2: number, radius: number)`
- `rect(x: number, y: number, width: number, height: number)` - 绘制矩形
  - x: 矩形左上角横坐标
  - y: 矩形左上角纵坐标
  - width: 矩形长度
  - height: 矩形高度
- `closePath()` - 闭合路径
- `setStrokeStyle({color?: string, lineWidth?: number, cap?: 'butt' | 'round' | 'square', join?: 'bevel' | 'round' | 'miter', miterLimit?: number})` - 设置描边样式

  - color: 描边颜色
  - lineWidth: 描边宽度, 默认 1 像素
  - cap: 端点样式, 默认 butt
  - join: 定点样式, 默认 miter
  - miterLimit: 斜接限制, 默认 10

- `setStrokeDash(segments: [number, number], offset: number = 0)` - 设置虚线

  - segments[0]: 实线长度
  - segments[1]: 虚线长度
  - offset: 偏移量

- `setFillStyle(color: string)` - 设置填充颜色

- `stroke()` - 绘制描边

- `fill(windingRule?: 'nonzero' | 'evenodd')` - 填充

- `drawImage()`

  - `drawImage(image: HTMLImageElement | HTMLCanvasElement, dx: number, dy: number)`

    - image: 原始图像
    - dx: 目标位置横坐标
    - dy: 目标位置纵坐标

  - `drawImage( image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number)`

    - image: 原始图像

    - dx: 目标位置横坐标

    - dy: 目标位置纵坐标

    - dw: 目标长度

    - dh: 目标高度

  - `drawImage(image: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number)`

    - image: 原始图像
    - sx: 原始图像横坐标
    - sy: 原始图像纵坐标
    - sw: 原始图像长度
    - sh: 原始图像高度
    - dx: 目标位置横坐标
    - dy: 目标位置纵坐标
    - dw: 目标长度
    - dh: 目标高度

  - `clear()` - 清除绘制
  - `setTextStyle( {font?: string, baseline?: 'top' | 'hanging'| 'middle' | 'alphabetic' | 'ideographic' | 'bottom', textAlign?: 'left' | 'right' | 'center' | 'start' | 'end'})` - 设置字体样式

    - font: 字体, 宽度
    - baseline: 垂直对齐
    - textAlign: 水平对齐

  - `strokeText(text: string, x: number, y: number, maxWidth?: number)` - 文字描边
  - text: 文字内容
  - x: 起始横坐标
  - y: 起始纵坐标
  - maxWidth: 最大宽度
  - `fillText(text: string, x = 0, y = 0, maxWidth?: number)` - 文字填充

    - text: 文字内容

    - x: 起始横坐标

    - y: 起始纵坐标

    - maxWidth: 最大宽度

  - `createLinearGradientStroke(colors: string[],ratios:number[],x0: number,y0: number,x1: number,y1: number)` - 创建线性渐变描边

    - colors: 颜色数组
    - ratios: 百分比数组, 和颜色数组一一对应, 若两者长度不相等, 以较小值为基准
    - x0: 起始点横坐标
    - y0: 起始点纵坐标
    - x1: 结束点横坐标
    - y1: 结束点纵坐标

  - `createLinearGradientFill(colors: string[], ratios: number[], x0: number, y0: number, x1: number, y1: number)` - 创建线性渐变填充
    - colors: 颜色数组
    - ratios: 百分比数组, 和颜色数组一一对应, 若两者长度不相等, 以较小值为基准
    - x0: 起始点横坐标
    - y0: 起始点纵坐标
    - x1: 结束点横坐标
    - y1: 结束点纵坐标
  - `createRadialGradientStroke(colors: string[],ratios: number[],x0: number,y0: number,r0: number,x1: number,y1: number,r1: number)` - 创建径向描边

    - colors: 颜色数组

    - ratios: 百分比数组, 和颜色数组一一对应, 若两者长度不相等, 以较小值为基准

    - x0: 内圆横坐标

    - y0: 内圆纵坐标

    - r0: 内圆半径

    - x1: 外圆横坐标

    - y1: 外圆纵坐标

    - r1: 外圆半径

  - `createRadialGradientFill(colors: string[],ratios: number[],x0: number,y0: number,r0: number,x1: number,y1: number,r1: number)` - 创建径向填充

    - colors: 颜色数组
    - ratios: 百分比数组, 和颜色数组一一对应, 若两者长度不相等, 以较小值为基准
    - x0: 内圆横坐标
    - y0: 内圆纵坐标
    - r0: 内圆半径
    - x1: 外圆横坐标
    - y1: 外圆纵坐标
    - r1: 外圆半径

  - `setShadow(shadowColor: string, shadowOffsetX?: number, shadowOffsetY?: number, shadowBlur?: number)` - 设置阴影

    - shadowColor: 阴影颜色
    - shadowOffsetX: 横坐标偏移量
    - shadowOffsetY: 纵坐标偏移量
    - shadowBlur: 发散

  - `save()` - 保存状态
  - `restore()` - 状态重置

### 事件系统

`crk` 包含功能完备的事件系统, 可实现完全类似于 `DOM` 一样的交互功能

#### 事件种类

- `click` - 鼠标点击事件
- `dblclick` - 双击事件
- 移入/移出 事件, 需开启 `stage.enableMouseOver()`, 为保证性能, 如非必要, 请勿开启
  - `mouseover` - 鼠标移入事件,
  - `mouseout` - 鼠标移出事件
  - `rollover` - 鼠标移入事件
    - 和 `mouseover` 不同点在于(rollout 同理):
      - 在 一个 `group` 上绑定 `mouseover` 和 `rollover`, 其子节点 `shape1` 和 `shape2` 存在重叠, 现鼠标从 `shape1` 沿 **重叠区域** 移向 `shape2`, 此时 `group` 上只会触发 `mouseover` 事件. 当鼠标从空白处移入 `shape1`, 则会触发 `mouseover` 和 `rollover`
  - `rollout` - 鼠标移出事件
- `pressdown` - 鼠标按下事件
- `pressmove` - 鼠标按下并移动事件, 为保证性能, 不直接提供 `mousemove` 事件, 若确实需要, 绑定 `canvas` 的 `mousemove` 事件, 结合 `stage.hit()` 做碰撞检测
- `pressup` - 鼠标松开事件

#### 事件冒泡

当某个 `shape` 的事件被触发时, 会生成相应的合成事件对象, 并传入触发的回调函数中, 然后逐层网上冒泡, 直至 `stage` 根节点

此事件对象中通常包含以下属性:

- `x: number` - 事件发生在 canvas 中坐标
- `y: number`
- `target` - 事件发生节点
- `currentTarget` - 事件注册节点
- `stopPropagation()` - 阻止向上冒泡
- `nativeEvent` - `DOM` 事件对象

> Shape 和 Bitmap 实例支持通过 setEventRect() 设置事件矩形, 若事件矩形被设置, 将优先使用其作为碰撞检测依据

### 矩阵

...

### 向量

...
