import Tree from './pages/Tree/index'
import Deformer from './pages/Deformer'
import DeCasteljau from './pages/DeCasteljau'
import HighOrderBezier from './pages/HighOrderBezier'
import Chord from './pages/Chord'
// import RoundCircle from './pages/RoundCircle'
import RadialBar from './pages/RadialBar'
import RadialGrid from './pages/RadialGrid'
// import TransitionTest from './pages/transition-test'
import Triangle from './pages/triangle'
import HkMap from './pages/HkMap'
import StackFigure from './pages/StackFigure'
import Trangent from './pages/Tangent'
import BoundingBox from './pages/BoundingBox'

export const menuList = [
  {
    text: '堆叠图',
    path: '/stack-figure',
    component: <StackFigure />,
  },
  {
    text: '图片变形器',
    path: '/deformer',
    component: <Deformer />,
  },
  {
    text: 'chord - 弦图',
    path: '/chord',
    component: <Chord />,
  },
  {
    text: 'decasteljau 算法',
    path: '/decasteljau',
    component: <DeCasteljau />,
  },
  {
    text: 'Bézier 切线/法线',
    path: '/tangent',
    component: <Trangent />,
  },
  {
    text: 'Bézier 边界盒子',
    path: '/bounding-box',
    component: <BoundingBox />,
  },
  {
    text: '高阶 Bézier 曲线',
    path: '/high-order-bezier',
    component: <HighOrderBezier />,
  },
  {
    text: '环形统计图',
    path: '/radial-bar',
    component: <RadialBar />,
  },
  {
    text: '雷达图',
    path: '/radial-grid',
    component: <RadialGrid />,
  },
  {
    text: '三角形',
    path: '/triangle',
    component: <Triangle />,
  },
  {
    text: '香港地图',
    path: '/hk-map',
    component: <HkMap />,
  },
  {
    text: 'tree - 树形图',
    path: '/tree',
    component: <Tree />,
  },
]
