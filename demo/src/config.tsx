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

export const menuList = [
  {
    text: 'tree - 树形图',
    path: '/tree',
    component: <Tree />,
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
  // {
  //   text: '过渡动画测试',
  //   path: '/transition-test',
  //   component: <TransitionTest />,
  // },
  {
    text: '三角形',
    path: '/triangle',
    component: <Triangle />,
  },
]
