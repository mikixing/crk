import React, { useEffect } from 'react'

import { Navigate, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Menu } from 'antd'

import { menuList } from './config'

export default function App() {
  useEffect(() => {
    window.addEventListener('gesturestart', e => e.preventDefault())
    window.addEventListener('gesturechange', e => e.preventDefault())
    window.addEventListener('gestureend', e => e.preventDefault())
  })

  const location = useLocation()
  const key = menuList.findIndex(item => item.path === location.pathname) + ''

  return (
    <>
      <nav className="nav">
        <div
          style={{
            cursor: 'pointer',
            margin: '0 24px',
            textAlign: 'center',
          }}
        >
          <a
            style={{
              borderBottom: '1px solid #f0f0f0',
              padding: '10px 0',
              display: 'block',
            }}
            href="https://github.com/mikixing/crk"
            rel="noreferrer"
            target="_blank"
          >
            <h1
              style={{
                fontFamily: 'monospace',
                fontSize: 28,
                color: '#34bdff',
                lineHeight: 1.5,
                marginBottom: 0,
              }}
            >
              crk
            </h1>
            <div
              style={{
                fontSize: '12px',
                color: '#666',
              }}
            >
              canvas图形绘制工具集
            </div>
          </a>
        </div>
        <Menu
          defaultSelectedKeys={[key]}
          mode="inline"
          theme="light"
          style={{ height: '100%', borderRight: 0 }}
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
          <Route path="*" element={<Navigate to={menuList[0].path} />} />
        </Routes>
      </div>
    </>
  )
}
