import { ease } from '@mikixing/transition'
import { useEffect, useRef } from 'react'

export default function Test() {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = box.current as HTMLDivElement

    ease(
      { left: 0 },
      {
        left: 1000,
        duration: 5000,
        onUpdate: obj => {
          if (obj?.left) {
            el.style.left = obj.left + 'px'
          }
        },
      }
    )
    ease(
      { top: 0 },
      {
        top: 200,
        duration: 5000,
        onUpdate: obj => {
          if (obj?.top) {
            el.style.top = obj.top + 'px'
          }
        },
      }
    )
    setTimeout(() => {
      ease(
        { left: 300 },
        {
          left: 0,
          duration: 3000,
          onUpdate: obj => {
            if (obj?.left) {
              el.style.left = obj.left + 'px'
            }
          },
        }
      )
    }, 2000)
  }, [box])
  return (
    <div
      ref={box}
      style={{
        position: 'absolute',
        width: '100px',
        height: '100px',
        backgroundColor: 'red',
      }}
    ></div>
  )
}
