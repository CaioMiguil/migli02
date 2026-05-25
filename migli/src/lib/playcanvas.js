// MIGLI · PlayCanvas Engine (v3)
// ============================================================
// Pipeline de renderização imersivo com suporte REAL a Gaussian Splatting.
//
// Suporta:
//   .ply              — formato cru, fácil de produzir
//   .sog              — Spatially Ordered Gaussians (PlayCanvas, super comprimido)
//   .meta.json        — entrada do SOG
//   .lod-meta.json    — SOG com streaming LOD (ideal mobile)
//   null / 'demo'     — cena arquitetônica embutida (fallback elegante)
//
// API pública:
//   const viewer = createMigliViewer(canvas, { onReady, onProgress, onError })
//   await viewer.loadScene({ splatUrl, initial }) — carrega um splat
//   viewer.resetCamera()  — volta à pose inicial
//   viewer.dispose()      — libera tudo
//
// Referências:
//   https://developer.playcanvas.com/user-manual/gaussian-splatting/
//   https://github.com/playcanvas/supersplat
//   https://api.playcanvas.com/engine/classes/GSplatComponent.html
import * as pc from 'playcanvas'
import { detectDeviceProfile, getQualityPreset } from './deviceProfile'

/* ============================================================
   PUBLIC API
   ============================================================ */
export function createMigliViewer(canvas, opts = {}) {
  const { onReady, onProgress, onError, onInteract, qualityOverride } = opts

  // Detecta dispositivo, escolhe preset de qualidade
  const device = detectDeviceProfile()
  const quality = getQualityPreset(device.tier, qualityOverride)

  // Boot app shell — não aplica configurações de cena/câmera ainda. Em
  // PlayCanvas v2, `toneMapping` e `gammaCorrection` vivem na câmera, então
  // precisamos criar a câmera ANTES de aplicar o preset de qualidade.
  const app = bootstrapApp(canvas, { device, quality })
  const rig = createSceneRig(app)
  applyQualityToApp(app, rig.camera, quality)
  const lighting = installLighting(app, rig.root, { quality })
  const controls = createOrbitController(app, rig.camera, canvas, { onInteract })

  // Active scene — disposed on swap
  let currentScene = null

  // Default: arquitetônica embutida (sem splat real)
  currentScene = buildArchScene(app, rig.root)

  app.start()
  onReady?.({ app, camera: rig.camera, device, quality })

  return {
    app,
    camera: rig.camera,
    device,
    quality,

    /**
     * Carrega uma cena. Aceita splat real ou cai na cena embutida.
     *
     * @param {Object} scene
     * @param {string|null} scene.splatUrl  URL .ply / .sog / .meta.json
     * @param {Object} [scene.initial]      Pose inicial { position, target }
     * @param {boolean} [scene.cinematic]   Roda intro animado da câmera
     */
    async loadScene(scene = {}) {
      // Fade out current scene if any
      if (currentScene) {
        currentScene.dispose?.()
        currentScene = null
      }

      if (scene.initial) {
        controls.setPose(scene.initial.position, scene.initial.target)
      }

      if (!scene.splatUrl) {
        currentScene = buildArchScene(app, rig.root)
        onProgress?.(1, 'demo')
        if (scene.cinematic !== false) controls.playIntro()
        return { entity: currentScene.root }
      }

      try {
        currentScene = await buildSplatScene(app, rig.root, scene.splatUrl, {
          onProgress: (p) => onProgress?.(p, 'splat'),
        })
        if (scene.cinematic !== false) controls.playIntro()
        return { entity: currentScene.root }
      } catch (err) {
        onError?.(err)
        currentScene = buildArchScene(app, rig.root)
        throw err
      }
    },

    resetCamera() {
      controls.reset()
    },

    playCinematicIntro() {
      controls.playIntro()
    },

    setExposure(value) {
      safeAssign(app.scene, 'exposure', value)
    },

    /** Update render quality on the fly */
    setQuality(tier) {
      const next = getQualityPreset(tier)
      Object.assign(quality, next)
      applyQualityToApp(app, rig.camera, next)
    },

    dispose() {
      controls.dispose()
      lighting.dispose()
      currentScene?.dispose?.()
      try {
        app.destroy()
      } catch {
        /* noop on already-destroyed */
      }
    },
  }
}

/* ============================================================
   BOOTSTRAP — app + tone mapping + atmospheric fog
   ============================================================ */
function bootstrapApp(canvas, { device, quality } = {}) {
  const app = new pc.Application(canvas, {
    mouse: new pc.Mouse(canvas),
    touch: new pc.TouchDevice(canvas),
    graphicsDeviceOptions: {
      // Splats já têm AA interno — desligado por padrão dá mais FPS
      antialias: !!quality?.antialias,
      alpha: true,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    },
  })
  app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW)
  app.setCanvasResolution(pc.RESOLUTION_AUTO)

  // Adaptive DPR — celulares low-end ganham 30%+ FPS limitando para 1.5x
  if (device && quality) {
    const dpr = Math.min(device.dpr, quality.maxDpr)
    app.graphicsDevice.maxPixelRatio = dpr
  }

  // Handle resize cleanly
  const onResize = () => app.resizeCanvas()
  window.addEventListener('resize', onResize)
  app.on('destroy', () => window.removeEventListener('resize', onResize))

  return app
}

/**
 * Aplica um preset de qualidade ao app + camera.
 *
 * PlayCanvas v2 mudou várias APIs:
 *   - `scene.fog` agora é getter-only que retorna FogParams. Os valores são
 *     escritos em scene.fog.type/.color/.start/.end
 *   - `toneMapping` e `gammaCorrection` saíram do Scene e vão direto na
 *     CameraComponent
 *   - `scene.exposure` e `scene.ambientLight` continuam no Scene
 *
 * Cada atribuição vive em try/catch para tolerar variações entre versões 2.x.
 */
function applyQualityToApp(app, camera, quality) {
  if (!quality) return

  // ── Tone mapping + gamma → camera (v2) ─────────────────────────────
  const cam = camera?.camera
  if (cam) {
    safeAssign(cam, 'toneMapping', pc.TONEMAP_ACES)
    safeAssign(cam, 'gammaCorrection', pc.GAMMA_SRGB)
  }

  // ── Scene-wide (ainda válido em v2) ────────────────────────────────
  safeAssign(app.scene, 'exposure', 1.15)
  safeAssignColor(app.scene, 'ambientLight', 0.05, 0.1, 0.18)

  // ── Fog via FogParams (v2 API) ─────────────────────────────────────
  // app.scene.fog é getter-only → mexer nas suas propriedades, não atribuir.
  const fog = app.scene?.fog
  if (fog && typeof fog === 'object') {
    if (quality.fog) {
      safeAssign(fog, 'type', pc.FOG_LINEAR)
      safeAssign(fog, 'start', 8)
      safeAssign(fog, 'end', 25)
      safeAssignColor(fog, 'color', 0.03, 0.06, 0.12)
    } else {
      safeAssign(fog, 'type', pc.FOG_NONE)
    }
  }
}

/** Atribui prop e silencia erros (read-only, propriedade removida em versão futura, etc) */
function safeAssign(target, key, value) {
  try {
    target[key] = value
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[MIGLI] Não foi possível setar ${key}:`, e?.message || e)
  }
}

function safeAssignColor(target, key, r, g, b) {
  try {
    const existing = target[key]
    if (existing && typeof existing.set === 'function') {
      // Reusa o objeto Color (algumas props são getter-only mas o Color é mutável)
      existing.set(r, g, b)
    } else {
      target[key] = new pc.Color(r, g, b)
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[MIGLI] Não foi possível setar ${key}:`, e?.message || e)
  }
}

/* ============================================================
   SCENE RIG — root + camera
   ============================================================ */
function createSceneRig(app) {
  const root = new pc.Entity('scene-root')
  app.root.addChild(root)

  const camera = new pc.Entity('camera')
  camera.addComponent('camera', {
    clearColor: new pc.Color(0.024, 0.05, 0.1, 1),
    fov: 52,
    nearClip: 0.05,
    farClip: 200,
  })
  camera.setPosition(3.5, 1.7, 4.8)
  camera.lookAt(0, 0.7, 0)
  app.root.addChild(camera)

  return { root, camera }
}

/* ============================================================
   LIGHTING — three-point cinematic with animated rim
   Splats are pre-lit (the lighting is baked into the points), but we
   still keep these for the demo scene and any non-splat geometry.
   ============================================================ */
function installLighting(app, root, { quality } = {}) {
  const shadows = quality?.shadows !== false

  const key = new pc.Entity('key-light')
  key.addComponent('light', {
    type: 'directional',
    color: new pc.Color(1, 0.92, 0.82),
    intensity: 1.4,
    castShadows: shadows,
    shadowDistance: 25,
    shadowResolution: 2048,
    shadowBias: 0.04,
    normalOffsetBias: 0.05,
  })
  key.setEulerAngles(48, 35, 0)
  root.addChild(key)

  const fill = new pc.Entity('fill-light')
  fill.addComponent('light', {
    type: 'directional',
    color: new pc.Color(0.3, 0.65, 1),
    intensity: 0.55,
  })
  fill.setEulerAngles(-25, -130, 0)
  root.addChild(fill)

  const rim = new pc.Entity('rim-light')
  rim.addComponent('light', {
    type: 'point',
    color: new pc.Color(0, 0.76, 1),
    intensity: 2.2,
    range: 9,
  })
  rim.setPosition(-2.2, 3, -2.5)
  root.addChild(rim)

  // Subtle animated rim — sells "alive" feel
  let t = 0
  const tickFn = (dt) => {
    t += dt
    rim.light.intensity = 1.8 + Math.sin(t * 0.8) * 0.4
  }
  app.on('update', tickFn)

  return {
    dispose() {
      app.off('update', tickFn)
      ;[key, fill, rim].forEach((e) => {
        root.removeChild(e)
        e.destroy()
      })
    },
  }
}

/* ============================================================
   SPLAT SCENE — REAL Gaussian Splat loader
   ============================================================
   Uses PlayCanvas v2's built-in `gsplat` asset type which handles
   .ply, .sog, .meta.json, and .lod-meta.json automatically.
   ============================================================ */
async function buildSplatScene(app, root, url, { onProgress } = {}) {
  const group = new pc.Entity('splat-scene')
  root.addChild(group)

  // Create + register the gsplat asset
  const asset = new pc.Asset(`splat-${Date.now()}`, 'gsplat', { url })
  app.assets.add(asset)

  // Progress tracking
  asset.on('progress', (loaded, total) => {
    if (total > 0) onProgress?.(loaded / total)
  })

  // Load and await readiness
  await new Promise((resolve, reject) => {
    asset.once('load', () => resolve())
    asset.once('error', (err) => reject(new Error(`Falha ao carregar splat: ${err}`)))
    app.assets.load(asset)
  })

  // Attach the gsplat component to an entity
  const entity = new pc.Entity('splat-entity')
  entity.addComponent('gsplat', { asset })
  // Splats are loaded with a default orientation of (0, 0, 180) by supersplat —
  // we apply the same so up is up.
  entity.setLocalEulerAngles(0, 0, 180)
  group.addChild(entity)

  onProgress?.(1)

  return {
    root: group,
    asset,
    entity,
    dispose() {
      root.removeChild(group)
      group.destroy()
      try {
        app.assets.remove(asset)
        asset.unload()
      } catch {
        /* noop */
      }
    },
  }
}

/* ============================================================
   FALLBACK SCENE — stylized architectural demo
   Used when no splat URL is provided, or when a splat fails to load.
   ============================================================ */
function buildArchScene(app, root) {
  const group = new pc.Entity('arch-scene')
  root.addChild(group)

  const M = createMaterials()

  // Floor
  const floor = new pc.Entity('floor')
  floor.addComponent('render', { type: 'plane', material: M.floor })
  floor.setLocalScale(14, 1, 14)
  group.addChild(floor)

  // Back & side walls
  const wallBack = new pc.Entity('wall-back')
  wallBack.addComponent('render', { type: 'plane', material: M.wall })
  wallBack.setLocalScale(14, 1, 7)
  wallBack.setEulerAngles(90, 0, 0)
  wallBack.setLocalPosition(0, 3.5, -5)
  group.addChild(wallBack)

  const wallSide = new pc.Entity('wall-side')
  wallSide.addComponent('render', { type: 'plane', material: M.wall })
  wallSide.setLocalScale(14, 1, 7)
  wallSide.setEulerAngles(0, 0, -90)
  wallSide.setLocalPosition(-5, 3.5, 0)
  group.addChild(wallSide)

  // Ceiling
  const ceiling = new pc.Entity('ceiling')
  ceiling.addComponent('render', { type: 'plane', material: M.ceiling })
  ceiling.setLocalScale(14, 1, 14)
  ceiling.setLocalPosition(0, 6, 0)
  ceiling.setLocalEulerAngles(180, 0, 0)
  group.addChild(ceiling)

  // Window glow
  const windowPane = new pc.Entity('window')
  windowPane.addComponent('render', { type: 'plane', material: M.windowGlow })
  windowPane.setEulerAngles(90, 0, 0)
  windowPane.setLocalScale(3.2, 1, 1.8)
  windowPane.setLocalPosition(1.3, 2.2, -4.94)
  group.addChild(windowPane)

  // Furniture stand-ins
  group.addChild(makeBox(M.furniture, [2.6, 0.7, 1], [-0.4, 0.35, 1.6]))
  group.addChild(makeBox(M.furniture, [1.3, 0.1, 0.7], [-0.4, 0.5, 0.4]))
  group.addChild(makeBox(M.furniture, [0.6, 0.6, 0.6], [-2.5, 0.3, 1.6]))

  // Signature aqua floor strip
  group.addChild(makeBox(M.accent, [9, 0.012, 0.05], [0, 0.018, -2.2]))

  // Pendant
  const pendant = new pc.Entity('pendant')
  pendant.addComponent('render', { type: 'sphere', material: M.pendantGlow })
  pendant.setLocalScale(0.32, 0.32, 0.32)
  pendant.setLocalPosition(-0.4, 3.6, 0.4)
  group.addChild(pendant)

  // Slow autonomous breathing
  let t = 0
  const tickFn = (dt) => {
    t += dt
    group.setLocalEulerAngles(0, Math.sin(t * 0.08) * 1.2, 0)
    pendant.setLocalPosition(-0.4, 3.6 + Math.sin(t * 0.6) * 0.04, 0.4)
  }
  app.on('update', tickFn)

  return {
    root: group,
    dispose() {
      app.off('update', tickFn)
      root.removeChild(group)
      group.destroy()
    },
  }
}

/* ============================================================
   MATERIALS — small reusable palette
   ============================================================ */
function createMaterials() {
  const M = {}

  M.floor = new pc.StandardMaterial()
  M.floor.diffuse.set(0.04, 0.07, 0.12)
  M.floor.metalness = 0.5
  M.floor.gloss = 0.88
  M.floor.useMetalness = true
  M.floor.update()

  M.wall = new pc.StandardMaterial()
  M.wall.diffuse.set(0.07, 0.11, 0.18)
  M.wall.metalness = 0.08
  M.wall.gloss = 0.35
  M.wall.useMetalness = true
  M.wall.update()

  M.ceiling = new pc.StandardMaterial()
  M.ceiling.diffuse.set(0.04, 0.06, 0.1)
  M.ceiling.gloss = 0.2
  M.ceiling.update()

  M.windowGlow = new pc.StandardMaterial()
  M.windowGlow.emissive.set(0, 0.76, 1)
  M.windowGlow.emissiveIntensity = 2.4
  M.windowGlow.useLighting = false
  M.windowGlow.update()

  M.pendantGlow = new pc.StandardMaterial()
  M.pendantGlow.emissive.set(1, 0.85, 0.7)
  M.pendantGlow.emissiveIntensity = 3
  M.pendantGlow.useLighting = false
  M.pendantGlow.update()

  M.furniture = new pc.StandardMaterial()
  M.furniture.diffuse.set(0.05, 0.13, 0.22)
  M.furniture.metalness = 0.5
  M.furniture.gloss = 0.6
  M.furniture.useMetalness = true
  M.furniture.update()

  M.accent = new pc.StandardMaterial()
  M.accent.emissive.set(0, 0.76, 1)
  M.accent.emissiveIntensity = 4
  M.accent.useLighting = false
  M.accent.update()

  return M
}

function makeBox(mat, scale, pos) {
  const e = new pc.Entity('box')
  e.addComponent('render', { type: 'box', material: mat })
  e.setLocalScale(...scale)
  e.setLocalPosition(...pos)
  return e
}

/* ============================================================
   ORBIT CONTROLLER — momentum + pinch + idle drift
   ============================================================ */
function createOrbitController(app, camera, canvas, { onInteract } = {}) {
  let dragging = false
  let lastX = 0
  let lastY = 0
  let yaw = -38
  let pitch = -8
  let targetYaw = yaw
  let targetPitch = pitch
  let velYaw = 0
  let velPitch = 0
  let distance = 6.3
  let targetDistance = distance
  let lastTwoFingerDist = null
  let introRaf = 0
  const target = new pc.Vec3(0, 0.8, 0)
  // Initial pose stored for reset
  const initialPose = {
    position: camera.getPosition().clone(),
    target: target.clone(),
  }

  const minPitch = -42
  const maxPitch = 18
  const minDist = 2
  const maxDist = 14

  const apply = () => {
    const rad = pc.math.DEG_TO_RAD
    const x = target.x + distance * Math.cos(pitch * rad) * Math.sin(yaw * rad)
    const y = target.y + distance * Math.sin(pitch * rad)
    const z = target.z + distance * Math.cos(pitch * rad) * Math.cos(yaw * rad)
    camera.setPosition(x, y, z)
    camera.lookAt(target.x, target.y, target.z)
  }

  let lastInteractAt = performance.now()
  const ping = () => {
    lastInteractAt = performance.now()
    onInteract?.()
  }

  const getPointer = (e) => {
    if (e.touches?.[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    return { x: e.clientX ?? 0, y: e.clientY ?? 0 }
  }

  const onDown = (e) => {
    if (introRaf) {
      cancelAnimationFrame(introRaf)
      introRaf = 0
    }
    dragging = true
    velYaw = 0
    velPitch = 0
    const { x, y } = getPointer(e)
    lastX = x
    lastY = y
    ping()
  }
  const onUp = () => {
    dragging = false
  }
  const onMove = (e) => {
    if (e.touches?.length === 2) {
      const a = e.touches[0]
      const b = e.touches[1]
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      if (lastTwoFingerDist != null) {
        const delta = lastTwoFingerDist - d
        targetDistance = Math.max(
          minDist,
          Math.min(maxDist, targetDistance + delta * 0.01),
        )
      }
      lastTwoFingerDist = d
      ping()
      return
    } else {
      lastTwoFingerDist = null
    }
    if (!dragging) return
    const { x, y } = getPointer(e)
    const dx = x - lastX
    const dy = y - lastY
    velYaw = -dx * 0.35
    velPitch = -dy * 0.25
    targetYaw += velYaw
    targetPitch = Math.max(
      minPitch,
      Math.min(maxPitch, targetPitch + velPitch),
    )
    lastX = x
    lastY = y
    ping()
  }
  const onWheel = (e) => {
    e.preventDefault()
    targetDistance = Math.max(
      minDist,
      Math.min(maxDist, targetDistance + e.deltaY * 0.005),
    )
    ping()
  }

  canvas.addEventListener('mousedown', onDown)
  window.addEventListener('mouseup', onUp)
  window.addEventListener('mousemove', onMove)
  canvas.addEventListener('touchstart', onDown, { passive: true })
  window.addEventListener('touchend', onUp)
  window.addEventListener('touchmove', onMove, { passive: true })
  canvas.addEventListener('wheel', onWheel, { passive: false })

  const tickFn = (dt) => {
    if (!dragging && performance.now() - lastInteractAt > 3000) {
      targetYaw -= dt * 3.5
    }
    if (!dragging) {
      targetYaw += velYaw * 0.92 * dt * 60
      targetPitch = Math.max(
        minPitch,
        Math.min(maxPitch, targetPitch + velPitch * 0.92 * dt * 60),
      )
      velYaw *= 0.92
      velPitch *= 0.92
      if (Math.abs(velYaw) < 0.01) velYaw = 0
      if (Math.abs(velPitch) < 0.01) velPitch = 0
    }
    yaw += (targetYaw - yaw) * 0.1
    pitch += (targetPitch - pitch) * 0.1
    distance += (targetDistance - distance) * 0.08
    apply()
  }
  app.on('update', tickFn)
  apply()

  return {
    /**
     * Plays a cinematic intro: camera starts pulled-back & high, then eases
     * into the initial pose over ~2s. Used on scene load.
     */
    playIntro({ duration = 2200 } = {}) {
      // Start pose: pulled back, slightly elevated, slightly off-axis
      const startYaw = yaw + 25
      const startPitch = Math.max(-30, pitch - 6)
      const startDistance = Math.min(maxDist, distance + 3.5)
      const endYaw = yaw
      const endPitch = pitch
      const endDistance = distance

      yaw = startYaw
      pitch = startPitch
      distance = startDistance
      targetYaw = startYaw
      targetPitch = startPitch
      targetDistance = startDistance
      velYaw = 0
      velPitch = 0
      apply()

      const startedAt = performance.now()
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
      const easeInOutQuart = (t) =>
        t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2

      const introTick = () => {
        const t = Math.min(1, (performance.now() - startedAt) / duration)
        const e = easeInOutQuart(t)
        yaw = startYaw + (endYaw - startYaw) * e
        pitch = startPitch + (endPitch - startPitch) * e
        distance = startDistance + (endDistance - startDistance) * easeOutCubic(t)
        targetYaw = yaw
        targetPitch = pitch
        targetDistance = distance
        apply()
        if (t < 1) {
          introRaf = requestAnimationFrame(introTick)
        } else {
          // Reset idle-drift timer so it doesn't pounce right after intro
          lastInteractAt = performance.now()
          introRaf = 0
        }
      }
      if (introRaf) cancelAnimationFrame(introRaf)
      introRaf = requestAnimationFrame(introTick)
    },

    /** Reset to initial camera pose */
    reset() {
      target.copy(initialPose.target)
      camera.setPosition(initialPose.position)
      // Derive yaw/pitch/distance from current pose
      const offset = camera.getPosition().clone().sub(target)
      distance = offset.length()
      targetDistance = distance
      yaw = Math.atan2(offset.x, offset.z) * pc.math.RAD_TO_DEG
      pitch = Math.asin(offset.y / distance) * pc.math.RAD_TO_DEG
      targetYaw = yaw
      targetPitch = pitch
      velYaw = 0
      velPitch = 0
      apply()
      ping()
    },
    /** Set camera and target programmatically (used by scene loader) */
    setPose(position, lookAt) {
      if (Array.isArray(position) && position.length === 3) {
        camera.setPosition(position[0], position[1], position[2])
      }
      if (Array.isArray(lookAt) && lookAt.length === 3) {
        target.set(lookAt[0], lookAt[1], lookAt[2])
      }
      const offset = camera.getPosition().clone().sub(target)
      distance = offset.length()
      targetDistance = distance
      yaw = Math.atan2(offset.x, offset.z) * pc.math.RAD_TO_DEG
      pitch = Math.asin(offset.y / distance) * pc.math.RAD_TO_DEG
      targetYaw = yaw
      targetPitch = pitch
      // Update initial pose so reset returns here
      initialPose.position.set(position[0], position[1], position[2])
      initialPose.target.set(lookAt[0], lookAt[1], lookAt[2])
      apply()
    },
    dispose() {
      if (introRaf) cancelAnimationFrame(introRaf)
      app.off('update', tickFn)
      canvas.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('touchstart', onDown)
      window.removeEventListener('touchend', onUp)
      window.removeEventListener('touchmove', onMove)
      canvas.removeEventListener('wheel', onWheel)
    },
  }
}
