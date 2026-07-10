// Procedural gremlin sprite: inline SVG, zero assets. The wrapper div is the
// hittable; state classes drive CSS keyframe rigs defined in sprite CSS below.
const SIZE = 60

const GREMLIN_SVG = `
<svg viewBox="0 0 60 60" width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <g class="rig">
    <!-- ears -->
    <path class="ear" d="M12 22 L2 4 L20 12 Z" fill="#3fa73f"/>
    <path class="ear" d="M48 22 L58 4 L40 12 Z" fill="#3fa73f"/>
    <path d="M12 20 L6 9 L17 14 Z" fill="#e88bb1"/>
    <path d="M48 20 L54 9 L43 14 Z" fill="#e88bb1"/>
    <!-- body -->
    <ellipse cx="30" cy="34" rx="21" ry="20" fill="#4cbf4c"/>
    <ellipse cx="30" cy="41" rx="14" ry="11" fill="#a8e0a0"/>
    <!-- eyes -->
    <g class="eye">
      <ellipse cx="21" cy="27" rx="7" ry="8" fill="#ffe94d"/>
      <ellipse class="pupil" cx="22" cy="28" rx="2.6" ry="4.5" fill="#111"/>
      <rect class="eyelid" x="13" y="18" width="16" height="18" rx="8" fill="#3fa73f"/>
    </g>
    <g class="eye">
      <ellipse cx="39" cy="27" rx="7" ry="8" fill="#ffe94d"/>
      <ellipse class="pupil" cx="38" cy="28" rx="2.6" ry="4.5" fill="#111"/>
      <rect class="eyelid" x="31" y="18" width="16" height="18" rx="8" fill="#3fa73f"/>
    </g>
    <!-- mouth -->
    <g class="mouth">
      <path d="M18 40 Q30 50 42 40 Q30 46 18 40 Z" fill="#7a1f2b"/>
      <path d="M20 40.5 L23 44 L26 41.5 L29 45 L32 41.5 L35 44 L38 40.8"
            fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
    </g>
    <!-- tongue for taunting -->
    <path class="tongue" d="M27 44 Q30 54 33 44 Z" fill="#ff6b8d"/>
    <!-- arms -->
    <path class="arm" d="M10 34 Q2 30 4 22" fill="none" stroke="#3fa73f" stroke-width="5" stroke-linecap="round"/>
    <path class="arm" d="M50 34 Q58 30 56 22" fill="none" stroke="#3fa73f" stroke-width="5" stroke-linecap="round"/>
    <!-- feet -->
    <ellipse class="foot" cx="21" cy="55" rx="7" ry="4" fill="#3fa73f"/>
    <ellipse class="foot" cx="39" cy="55" rx="7" ry="4" fill="#3fa73f"/>
  </g>
</svg>`

export const SPRITE_CSS = `
.gremlin {
  position: absolute;
  width: ${SIZE}px;
  height: ${SIZE}px;
  margin: ${-SIZE / 2}px 0 0 ${-SIZE / 2}px; /* pos is the sprite's center */
  will-change: transform;
  filter: drop-shadow(0 3px 3px rgba(0,0,0,.35));
}
.gremlin .flip { width: 100%; height: 100%; }
.gremlin .rig { transform-origin: 30px 55px; }

.gremlin .eyelid { transform: translateY(-14px); }
.gremlin .eye { animation: blink 4.2s infinite; }
@keyframes blink {
  0%, 94%, 100% { transform: translateY(0); }
  96%, 98% { transform: translateY(6px); }
}
.gremlin .tongue { visibility: hidden; }

.st-SPAWN { animation: pop-in .5s ease-out; }
@keyframes pop-in {
  0% { transform: scale(0) rotate(-360deg); }
  70% { transform: scale(1.25); }
  100% { transform: scale(1); }
}

.st-WANDER .rig { animation: waddle .5s infinite ease-in-out; }
.st-CHASE_CURSOR .rig, .st-FLEE .rig { animation: waddle .22s infinite ease-in-out; }
@keyframes waddle {
  0%, 100% { transform: rotate(-7deg); }
  50% { transform: rotate(7deg); }
}

.st-IDLE .rig { animation: bob 1.6s infinite ease-in-out; }
@keyframes bob {
  0%, 100% { transform: scale(1, 1); }
  50% { transform: scale(1.04, .96); }
}

.st-TAUNT .tongue { visibility: visible; animation: waggle .18s infinite; transform-origin: 30px 44px; }
.st-TAUNT .rig { animation: bob .4s infinite ease-in-out; }
@keyframes waggle {
  0%, 100% { transform: rotate(-12deg); }
  50% { transform: rotate(12deg); }
}

.st-SCREECH .mouth { animation: screech-mouth .12s infinite; transform-origin: 30px 42px; }
.st-SCREECH { animation: tremble .09s infinite; }
@keyframes screech-mouth {
  0%, 100% { transform: scale(1.15, 1.4); }
  50% { transform: scale(1.3, 2.1); }
}
@keyframes tremble {
  0%, 100% { translate: -1.5px 0; }
  50% { translate: 1.5px 0; }
}

.st-SIT_ON_CURSOR .rig { animation: happy-bounce .35s infinite ease-in-out; }
@keyframes happy-bounce {
  0%, 100% { transform: scale(1.05, .92); }
  50% { transform: scale(.95, 1.08) translateY(-3px); }
}

.st-DODGE { animation: dodge-flash .18s; }
@keyframes dodge-flash {
  0% { opacity: 0; transform: scale(1.6); }
  100% { opacity: 1; transform: scale(1); }
}

.st-MULTIPLY { animation: tremble .06s infinite; }

.st-CAUGHT { animation: squish .5s forwards ease-in; }
@keyframes squish {
  0% { transform: scale(1, 1); }
  30% { transform: scale(1.5, .25) translateY(20px); }
  100% { transform: scale(1.7, .05) translateY(28px); opacity: 0; }
}
`

export function createSprite(model, { onCatchAttempt }) {
  const el = document.createElement('div')
  el.className = 'gremlin hittable'
  const flip = document.createElement('div')
  flip.className = 'flip'
  flip.innerHTML = GREMLIN_SVG
  el.appendChild(flip)
  el.addEventListener('mousedown', (e) => {
    e.preventDefault()
    onCatchAttempt()
  })

  let lastState = null
  return {
    el,
    sync() {
      el.style.transform = `translate3d(${model.pos.x}px, ${model.pos.y}px, 0)`
      flip.style.transform = `scaleX(${model.facing})`
      if (model.fsm.state !== lastState) {
        if (lastState) el.classList.remove(`st-${lastState}`)
        lastState = model.fsm.state
        el.classList.add(`st-${lastState}`)
        // a caught (dying) gremlin must not hold the window interactive
        el.classList.toggle('hittable', lastState !== 'CAUGHT')
      }
    },
  }
}
