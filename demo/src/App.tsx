import React, { useRef, createContext, useContext, useEffect } from 'react'
import Tree from './pages/Tree/index'
import Deformer from './pages/Deformer/index'
import DeCasteljau from './pages/DeCasteljau'
import HighOrderBezier from './pages/HighOrderBezier'
import Chord from './pages/Chord'
import RoundCircle from './pages/RoundCircle'
import RadialBar from './pages/RadialBar'
import RadialGrid from './pages/RadialGrid'
import Api from './pages/Api'
import DetectCollision from './pages/DetectCollision'
import EventTest from './pages/EventTest'
import EventRect from './pages/EventRect'
import { Menu } from 'antd'

import { HashRouter, Navigate, Routes, Route, Link } from 'react-router-dom'

const ContentCtx = createContext<React.RefObject<HTMLDivElement> | null>(null)

const menuList = [
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
]

export default function App() {
  useEffect(() => {
    window.addEventListener('resize', ev => {})

    window.addEventListener('gesturestart', e => e.preventDefault())
    window.addEventListener('gesturechange', e => e.preventDefault())
    window.addEventListener('gestureend', e => e.preventDefault())
  })

  return (
    <>
      <HashRouter>
        <nav className="nav" style={{ width: 200, height: '100%' }}>
          <Menu
            defaultSelectedKeys={['0']}
            mode="inline"
            theme="light"
            style={{ height: '100%' }}
            className="noSelect"
          >
            {menuList.map(({ text, path }, i) => {
              return (
                <Menu.Item key={i}>
                  <Link to={path}>{text}</Link>
                </Menu.Item>
              )
            })}
            {/* <Menu.Item key="1">
              <Link to="/">Home</Link>
            </Menu.Item>
            <Menu.Item key="2">
              <Link to="/tree">Tree</Link>
            </Menu.Item>
            <Menu.Item key="3">
              <Link to="/deformer">deformer</Link>
            </Menu.Item>
            <Menu.Item key="4">
              <Link to="/de-casteljau">de casteljau算法</Link>
            </Menu.Item>
            <Menu.Item key="5">
              <Link to="/high-order-bezier">高阶贝塞尔曲线</Link>
            </Menu.Item>
            <Menu.Item key="6">
              <Link to="/chord">chord</Link>
            </Menu.Item>
            <Menu.Item key="7">
              <Link to="/round-circle">round circle</Link>
            </Menu.Item>
            <Menu.Item key="8">
              <Link to="/radial-bar">radial bar</Link>
            </Menu.Item> */}
            {/* <Menu.Item key="6">
              <Link to="/detect-collision">detect collision</Link>
            </Menu.Item>
            <Menu.Item key="7">
              <Link to="/event-test">event test</Link>
            </Menu.Item> */
            /* <Menu.Item key="9">
              <Link to="/event-rect">event rect</Link>
            </Menu.Item> */}
          </Menu>
        </nav>
        <div className="content noSelect">
          <Routes>
            {menuList.map(({ component, path }, i) => (
              <Route path={path} key={i} element={component} />
            ))}
            <Route path="*" element={<Navigate to="/tree" />} />

            {/* <Route path="tree" element={<Tree />} /> */}
            {/* <Route path="chord" element={<Chord />}></Route>
            <Route path="round-circle" element={<RoundCircle />}></Route>
            <Route path="radial-bar" element={<RadialBar />}></Route>
            <Route path="radial-grid" element={<RadialGrid />}></Route>
            <Route path="save" element={<Api />}></Route>
            <Route
              path="detect-collision"
              element={<DetectCollision />}
            ></Route>
            <Route path="event-test" element={<EventTest />}></Route>
            <Route path="deformer" element={<Deformer />}></Route>
            <Route path="event-rect" element={<EventRect />}></Route>
            <Route path="de-casteljau" element={<DeCasteljau />}></Route>
            <Route
              path="high-order-bezier"
              element={<HighOrderBezier />}
            ></Route> */}
          </Routes>
        </div>
      </HashRouter>
    </>
  )
}
