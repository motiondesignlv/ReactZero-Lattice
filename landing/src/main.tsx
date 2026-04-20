import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import 'reactzero-lattice/styles/a11y.css'
import './grid-styles.css'
import './global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
