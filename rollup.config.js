import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'
import json from '@rollup/plugin-json'
import alias from '@rollup/plugin-alias'
import { uglify } from 'rollup-plugin-uglify'

import filesize from 'rollup-plugin-filesize'
import builtins from 'rollup-plugin-node-builtins'
import path from 'path'

const pkg = require(p('package.json'))

const isProduction = process.env.NODE_ENV === 'production'

export default [
  {
    input: p('src', 'index.ts'),
    output: [
      {
        file: p(pkg.main),
        name: 'crk',
        format: 'umd',
        sourcemap: !isProduction,
        plugins: [isProduction && uglify()],
      },
      {
        file: p(pkg.module),
        format: 'esm',
        sourcemap: true,
      },
    ],
    treeshake: true,
    watch: {
      include: p('src', '**'),
    },
    plugins: [
      resolve({
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        browser: true,
        preferBuiltins: true,
      }),
      commonjs(),

      json(),
      builtins(),
      typescript(),
      filesize(),
      alias({
        entries: [{ find: '@', replacement: 'src/' }],
      }),
    ],
  },
]

function p(...args) {
  return path.resolve(__dirname, ...args)
}
