import resolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import filesize from 'rollup-plugin-filesize'

export default [
  {
    external: ['auth0-js', 'solid-js', 'solid-start'],
    plugins: [
      resolve({
        extensions: ['.js', '.jsx']
      }),
      babel({
        extensions: ['.js', '.jsx'],
        babelHelpers: 'bundled',
        presets: ['babel-preset-solid'],
        exclude: 'node_modules/**'
      }),
      filesize()
    ],
    input: 'src/index.jsx',
    output: {
      file: 'dist/index.jsx',
      format: 'es'
    }
  },
  {
    input: 'src/api/callback.js',
    output: [
      {
        file: 'dist/api/callback.js',
        format: 'es'
      }
    ]
  },
  {
    input: 'src/api/userinfo.js',
    output: [
      {
        file: 'dist/api/userinfo.js',
        format: 'es'
      }
    ]
  }
]
