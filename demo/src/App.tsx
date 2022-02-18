import React, { useEffect } from 'react'
// import DetectCollision from './pages/DetectCollision'
// import EventTest from './pages/EventTest'
// import EventRect from './pages/EventRect'

import { HashRouter, Navigate, Routes, Route, Link } from 'react-router-dom'
import { Menu } from 'antd'

import { menuList } from './config'

export default function App() {
  useEffect(() => {
    window.addEventListener('gesturestart', e => e.preventDefault())
    window.addEventListener('gesturechange', e => e.preventDefault())
    window.addEventListener('gestureend', e => e.preventDefault())
  })

  return (
    <>
      <HashRouter>
        <nav className="nav">
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
          </Menu>
        </nav>
        <div className="content noSelect">
          <Routes>
            {menuList.map(({ component, path }, i) => (
              <Route path={path} key={i} element={component} />
            ))}
            <Route path="*" element={<Navigate to="/tree" />} />
          </Routes>
        </div>
      </HashRouter>
    </>
  )
}
