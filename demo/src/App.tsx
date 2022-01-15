import React, { useRef, createContext, useContext, useEffect } from 'react'
import Tree from './pages/Tree'
import Chord from './pages/Chord'
import RoundCircle from './pages/RoundCircle'
import RadialBar from './pages/RadialBar'
import RadialGrid from './pages/RadialGrid'
import Api from './pages/Api'
import DetectCollision from './pages/DetectCollision'
import EventTest from './pages/EventTest'
import Deformer from './pages/Deformer/index'
import EventRect from './pages/EventRect'
import { Menu } from 'antd'

import './App.css'

import { HashRouter, Routes, Route, Link } from 'react-router-dom'

const ContentCtx = createContext<React.RefObject<HTMLDivElement> | null>(null)

export const useContentRef = () => {
  return useContext(ContentCtx)
}

export default function App() {
  const contentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    window.addEventListener('resize', ev => {
      console.log(contentRef.current?.offsetWidth)
    })
  })

  return (
    <>
      <HashRouter>
        <nav className="nav" style={{ height: '100%' }}>
          <Menu
            defaultSelectedKeys={['1']}
            defaultOpenKeys={['sub1']}
            mode="inline"
            theme="light"
            style={{ height: '100%' }}
            className="noSelect"
            // inlineCollapsed={this.state.collapsed}
          >
            <Menu.Item key="1">
              <Link to="/">Home</Link>
            </Menu.Item>
            <Menu.Item key="2">
              <Link to="/tree">Tree</Link>
            </Menu.Item>
            <Menu.Item key="3">
              <Link to="/chord">chord</Link>
            </Menu.Item>
            <Menu.Item key="4">
              <Link to="/round-circle">round circle</Link>
            </Menu.Item>
            <Menu.Item key="5">
              <Link to="/radial-bar">radial bar</Link>
            </Menu.Item>
            <Menu.Item key="6">
              <Link to="/detect-collision">detect collision</Link>
            </Menu.Item>
            <Menu.Item key="7">
              <Link to="/event-test">event test</Link>
            </Menu.Item>
            <Menu.Item key="8">
              <Link to="/deformer">deformer</Link>
            </Menu.Item>
            <Menu.Item key="9">
              <Link to="/event-rect">event rect</Link>
            </Menu.Item>
          </Menu>
        </nav>
        <div className="content noSelect" ref={contentRef}>
          <ContentCtx.Provider value={contentRef}>
            <Routes>
              <Route path="*" element={<Tree />} />
              <Route path="chord" element={<Chord />}></Route>
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
            </Routes>
          </ContentCtx.Provider>
        </div>
      </HashRouter>
    </>
  )
}
