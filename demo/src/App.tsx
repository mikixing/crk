import React from 'react'
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

import './App.css'

import { HashRouter, Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="tree" element={<Tree />}></Route>
        <Route path="chord" element={<Chord />}></Route>
        <Route path="round-circle" element={<RoundCircle />}></Route>
        <Route path="radial-bar" element={<RadialBar />}></Route>
        <Route path="radial-grid" element={<RadialGrid />}></Route>
        <Route path="save" element={<Api />}></Route>
        <Route path="detect-collision" element={<DetectCollision />}></Route>
        <Route path="event-test" element={<EventTest />}></Route>
        <Route path="deformer" element={<Deformer />}></Route>
        <Route path="event-rect" element={<EventRect />}></Route>
      </Routes>
    </HashRouter>
  )
}
