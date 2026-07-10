import { startHitReporting } from './systems/hittest.js'

const stage = document.getElementById('stage')

// walking-skeleton target: a red square the e2e (and a human) can hit
const square = document.createElement('div')
square.className = 'hittable'
square.style.cssText = 'left:200px; top:200px; width:80px; height:80px; background:#e33; border-radius:8px'
square.addEventListener('mousedown', () => {
  square.style.background = '#3a3'
  setTimeout(() => (square.style.background = '#e33'), 300)
})
stage.appendChild(square)

startHitReporting()
