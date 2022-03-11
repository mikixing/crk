import Matrix, { deg2rad } from '../src/lib/Matrix'

let num = 0
test(`${++num}.创建Matrix实例`, done => {
  const m = new Matrix()

  expect(m.a).toBe(1)
  expect(m.b).toBe(0)
  expect(m.c).toBe(0)
  expect(m.d).toBe(1)
  expect(m.e).toBe(0)
  expect(m.f).toBe(0)

  done()
})

test(`${++num}.矩阵克隆`, done => {
  const m = new Matrix(6, 8, 7, 10, 5, 0).clone()

  expect(m.a).toBe(6)
  expect(m.b).toBe(8)
  expect(m.c).toBe(7)
  expect(m.d).toBe(10)
  expect(m.e).toBe(5)
  expect(m.f).toBe(0)

  done()
})

test(`${++num}.矩阵乘以单位矩阵,仍等于该矩阵(左乘)`, done => {
  const m = new Matrix(10, 20, 30, 40, 50, 60)
  const unitM = new Matrix()
  m.prependMatrix(unitM)

  expect(m.a).toBe(10)
  expect(m.b).toBe(20)
  expect(m.c).toBe(30)
  expect(m.d).toBe(40)
  expect(m.e).toBe(50)
  expect(m.f).toBe(60)

  done()
})

test(`${++num}.矩阵乘以另一矩阵(左乘)`, done => {
  const m = new Matrix(10, 20, 30, 40, 50, 60)
  const m2 = new Matrix(1, 2, 3, 4, 5, 6)
  m.prependMatrix(m2)

  expect(m.a).toBe(70)
  expect(m.b).toBe(100)
  expect(m.c).toBe(150)
  expect(m.d).toBe(220)
  expect(m.e).toBe(235)
  expect(m.f).toBe(346)

  done()
})

test(`${++num}.矩阵乘以单位矩阵,仍等于该矩阵(右乘)`, done => {
  const m = new Matrix(10, 20, 30, 40, 50, 60)
  const unitM = new Matrix()
  m.appendMatrix(unitM)

  expect(m.a).toBe(10)
  expect(m.b).toBe(20)
  expect(m.c).toBe(30)
  expect(m.d).toBe(40)
  expect(m.e).toBe(50)
  expect(m.f).toBe(60)

  done()
})
test(`${++num}.矩阵乘以另一矩阵(右乘)`, done => {
  const m = new Matrix(10, 20, 30, 40, 50, 60)
  const m2 = new Matrix(1, 2, 3, 4, 5, 6)
  m.appendMatrix(m2)

  expect(m.a).toBe(70)
  expect(m.b).toBe(100)
  expect(m.c).toBe(150)
  expect(m.d).toBe(220)
  expect(m.e).toBe(280)
  expect(m.f).toBe(400)

  done()
})

// 旋转
test(`${++num}.矩阵旋转`, done => {
  const m = new Matrix(6, 8, 7, 10, 5, 0)
  const rad = deg2rad * 30
  m.rotate(rad)

  expect(m.a).toBeLessThan(9.5)
  expect(m.b).toBeGreaterThan(9)
  expect(m.c).toBeLessThan(4)
  expect(m.d).toBeLessThan(6)
  expect(m.e).toBe(5)
  expect(m.f).toBe(0)

  done()
})

// 位移
test(`${++num}.矩阵旋转`, done => {
  const m = new Matrix(6, 8, 7, 10, 5, 0)
  m.translate(20, 30)

  expect(m.a).toBe(6)
  expect(m.b).toBe(8)
  expect(m.c).toBe(7)
  expect(m.d).toBe(10)
  expect(m.e).toBe(335)
  expect(m.f).toBe(460)

  done()
})

// 缩放
test(`${++num}.矩阵缩放`, done => {
  const m = new Matrix(6, 8, 7, 10, 5, 0)
  m.scale(2, 2)

  expect(m.a).toBe(12)
  expect(m.b).toBe(16)
  expect(m.c).toBe(14)
  expect(m.d).toBe(20)
  expect(m.e).toBe(5)
  expect(m.f).toBe(0)

  done()
})

// 倾斜
test(`${++num}.矩阵倾斜`, done => {
  const m = new Matrix(6, 8, 7, 10, 5, 0)
  const skewX = deg2rad * 30
  const skewY = deg2rad * 60
  m.skew(skewX, skewY)

  expect(m.a).toBeLessThan(10)
  expect(m.b).toBeLessThan(14)
  expect(m.c).toBeLessThan(4)
  expect(m.d).toBeLessThan(6)
  expect(m.e).toBe(5)
  expect(m.f).toBe(0)

  done()
})

// 求三阶逆矩阵
test(`${++num}.求逆矩阵`, done => {
  const m = new Matrix(6, 8, 7, 10, 5, 0)
  m.invert()

  expect(m.a).toBe(2.5)
  expect(m.b).toBe(-2)
  expect(m.c).toBe(-1.75)
  expect(m.d).toBe(1.5)
  expect(m.e).toBe(-12.5)
  expect(m.f).toBe(10)

  done()
})

// 矩阵变换坐标
test(`${++num}.矩阵变换坐标`, done => {
  const point = [20, 30]
  const m = new Matrix(6, 8, 7, 10, 5, 0)
  const tp = m.transformPoint(...(point as [number, number]))

  expect(tp).toMatchObject({ x: 335, y: 460 })

  done()
})
