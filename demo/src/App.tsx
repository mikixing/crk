import React from 'react'
import Tree from './pages/Tree'
import Chord from './pages/Chord'
import RoundCircle from './pages/RoundCircle'
import RadialBar from './pages/RadialBar'
import RadialGrid from './pages/RadialGrid'

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
      </Routes>
    </HashRouter>
  )
}
