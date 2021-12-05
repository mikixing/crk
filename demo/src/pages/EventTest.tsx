import React, { useEffect, useRef } from 'react'
import { Stage, Group, Shape } from '@mikixing/crk'
import { initCanvas, setRoundRect } from '../util'

interface Node {
  name: string
  children?: Node[]
  mouseover?: (ev?: any) => void
}

const data: Node = {
  name: 'aaa',
  children: [
    {
      name: 'bbb',
      children: [
        { name: 'ccc', children: [] },
        { name: 'ddd', children: [] },
        {
          name: 'eee',
          children: [
            { name: 'ccc', children: [] },
            { name: 'ddd', children: [] },
            { name: 'eee', children: [] },
          ],
        },
      ],
    },

    { name: 'fff', children: [] },
    {
      name: 'iii',
      children: [
        { name: 'jjj', children: [] },
        { name: 'kkk', children: [] },
        { name: 'lll', children: [] },
      ],
    },
  ],
}

export default function EvenTest() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement
    initCanvas(canvas, 800, 600)

    const stage = new Stage(canvas, true)
    stage.x = 200
    stage.y = 50

    // rollover,rollout测试
    {
      const group = new Group()
      stage.addChild(group)
      new Array(1).fill(1).forEach((item, i) => {
        const grp = new Group()
        // grp.x = Math.random() * 300
        // grp.y = Math.random() * 300
        group.addChild(grp)

        // grp.addListener('click', ev => {
        //   console.log('----click----', ev)
        // })
        // grp.addListener('rollover', ev => {
        //   console.log('----rollover----', ev)
        // })
        // grp.addListener('rollout', ev => {
        //   console.log('----rollout----', ev)
        // })

        // grp.addListener('pressdown', ev => {
        //   console.log('------down------')
        //   const ox = grp.x
        //   const oy = grp.y
        //   const { x, y } = ev

        //   let moveFn: any, upFn: any
        //   grp.addListener(
        //     'pressmove',
        //     (moveFn = (ev: any) => {
        //       console.log('------move------')
        //       const dx = ev.x - x - 30
        //       const dy = ev.y - y

        //       grp.x = ox + dx
        //       grp.y = oy + dy
        //     })
        //   )
        //   grp.addListener(
        //     'pressup',
        //     (upFn = (ev: any) => {
        //       // console.log('------up------')
        //       grp.removeListener('pressmove', moveFn)
        //       grp.removeListener('pressup', upFn)
        //     })
        //   )
        // })

        const shape1 = genRect()
        const shape2 = genRect(30, 30, '#6cf')
        grp.addChild(shape1)
        grp.addChild(shape2)

        grp.on('pressmove', ev => {
          console.log('grp pressmove')
        })

        grp.on('rollover', ev => {
          ev.stopPropagation()
          console.log('grp rollover')
        })

        grp.on('rollout', ev => {
          console.log('grp rollout')
        })

        grp.on('mouseover', ev => {
          ev.stopPropagation()
          console.log('grp mouseover')
        })

        const shape3 = genRect(110, 0, 'green')
        group.addChild(shape3)

        group.on('rollover', ev => {
          console.log('group rollover')
        })
        group.on('rollout', ev => {
          console.log('group rollout')
        })

        group.on('mouseout', ev => {
          console.log('group mouseout')
        })

        // shape1.addListener('mouseover', ev => {
        //   console.log('-----mouseover-----', ev)
        // })
        // shape1.addListener('mouseout', ev => {
        //   console.log('-----mouseout-----', ev)
        // })
        // shape2.addListener('mouseover', ev => {
        //   console.log('-----mouseover-----', ev)
        // })
        // shape2.addListener('mouseout', ev => {
        //   console.log('-----mouseout-----', ev)
        // })
        // grp.addChild(genRect(400, 0))

        // new Array(3).fill(1).forEach((it, j) => {
        //   const shape = new Shape()
        //   const g = shape.graphics
        //   const x = 100 * j
        //   const hue = (i * 120) | 360
        //   g.setFillStyle(`hsl(${hue}, 50%, ${j * 10 + 40}%)`)
        //     .moveTo(x, 100)
        //     .lineTo(x + 100, 100)
        //     .lineTo(x + 100, 200)
        //     .lineTo(x, 200)
        //     .closePath()
        //     .fill()
        //   grp.addChild(genRect())
        //   // shape.addListener('rollover', ev => {
        //   //   console.log('rollover', shape)
        //   // })
        //   // shape.addListener('rollout', ev => {
        //   //   console.log('rollout', shape)
        //   // })
        // })
      })
      stage.enableMouseOver(10)
    }

    function genRect(x = 0, y = 0, color = '#f70') {
      const shape = new Shape()
      const g = shape.graphics
      g.setFillStyle(color).rect(x, y, 100, 100).closePath().fill()

      return shape
    }

    // 拖拽事件
    // {
    //   const draggableGroup = new Group()
    //   stage.addChild(draggableGroup)

    //   const shape = new Shape()
    //   draggableGroup.addChild(shape)
    //   const g = shape.graphics

    //   g.setFillStyle('#f70')
    //     .moveTo(300, 300)
    //     .bezierCurveTo(350, 350, 310, 280, 400, 320)
    //     .lineTo(400, 400)
    //     .bezierCurveTo(150, 450, 220, 330, 400, 200)
    //     .closePath()
    //     .fill()

    //   let sx: number,
    //     sy: number,
    //     ox: number,
    //     oy: number,
    //     moveFn: (ev: any) => void,
    //     upFn: (ev: any) => void
    //   shape.addListener('pressdown', ev => {
    //     console.log('pressdown')
    //     ox = shape.x
    //     oy = shape.y
    //     sx = ev.x
    //     sy = ev.y
    //     shape.addListener(
    //       'pressmove',
    //       (moveFn = ev => {
    //         console.log('pressmove')
    //         const dx = ev.x - sx
    //         const dy = ev.y - sy
    //         shape.x = dx + ox
    //         shape.y = dy + oy
    //       })
    //     )
    //     shape.addListener(
    //       'pressup',
    //       (upFn = ev => {
    //         console.log('pressup')
    //         shape.removeListener('pressmove', moveFn)
    //         shape.removeListener('pressup', upFn)
    //       })
    //     )
    //   })
    // }

    // // 点击,双击事件
    // {
    //   const group = new Group()
    //   const clickGroup = new Group()
    //   group.addChild(clickGroup)
    //   stage.addChild(group)

    //   group.addListener('click', ev => {
    //     console.log('group get')
    //   })
    //   group.addListener('dblclick', ev => {
    //     console.log('group get dblclick')
    //   })
    //   clickGroup.addListener('click', ev => {
    //     ev.stopPropagation()
    //     console.log('clickGroup get')
    //   })
    //   clickGroup.addListener('dblclick', ev => {
    //     console.log('clickGroup get dblclick')
    //   })

    //   const shape1 = new Shape()
    //   clickGroup.addChild(shape1)
    //   const g1 = shape1.graphics

    //   g1.setFillStyle('#f70')
    //     .moveTo(20, 20)
    //     .bezierCurveTo(50, 50, 10, 80, 40, 32)
    //     .lineTo(40, 40)
    //     .bezierCurveTo(35, 45, 12, 33, 45, 23)
    //     .closePath()
    //     .fill()

    //   shape1.addListener('click', ev => {
    //     console.log('click1')
    //   })

    //   const shape2 = new Shape()
    //   clickGroup.addChild(shape2)
    //   const g2 = shape2.graphics

    //   g2.setFillStyle('#bcf')
    //     .moveTo(60, 60)
    //     .bezierCurveTo(80, 60, 10, 70, 20, 32)
    //     .lineTo(10, 10)
    //     .bezierCurveTo(5, 70, 31, 62, 20, 17)
    //     .closePath()
    //     .fill()

    //   shape2.addListener('click', ev => {
    //     console.log('click shape2')
    //   })
    //   shape2.addListener('dblclick', ev => {
    //     console.log('dblclick shape2')
    //   })
    // }

    // // mouseover,mouseout事件
    // {
    //   const group = new Group()
    //   const mouseGroup = new Group()
    //   group.addChild(mouseGroup)
    //   stage.addChild(group)

    //   group.addListener('mouseover', ev => {
    //     console.log('group get mouseover')
    //   })
    //   mouseGroup.addListener('mouseover', ev => {
    //     ev.stopPropagation()
    //     console.log('mouseGroup get mouseover')
    //   })

    //   const shape1 = new Shape()
    //   mouseGroup.addChild(shape1)
    //   const g1 = shape1.graphics

    //   g1.setFillStyle('#f70')
    //     .arc(500, 500, 20, 0, Math.PI * 2)
    //     .fill()

    //   shape1.addListener('mouseover', ev => {
    //     console.log('mouseover shape1')
    //   })
    //   shape1.addListener('mouseout', ev => {
    //     console.log('mouseout shape1')
    //   })

    //   const shape2 = new Shape()
    //   mouseGroup.addChild(shape2)
    //   const g2 = shape2.graphics

    //   g2.setFillStyle('#bcf')
    //     .arc(520, 500, 20, 0, Math.PI * 2)
    //     .fill()

    //   shape2.addListener('mouseover', ev => {
    //     console.log('mouseover shape2')
    //   })
    //   shape2.addListener('mouseout', ev => {
    //     console.log('mouseout shape2')
    //   })
    // }

    // // mouseenter,mouseleave事件

    // stage.addListener('mouseenter', ev => {
    //   console.log('coming')
    // })
    // stage.addListener('mouseleave', ev => {
    //   console.log('leave')
    // })

    update()

    function update() {
      stage.update()
      requestAnimationFrame(update)
    }
  }, [])

  return <canvas ref={canvasRef} style={{ border: '1px solid red' }}></canvas>
}
