<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

type NodePoint = {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  alpha?: number
  seed?: number
  orbitRadiusX?: number
  orbitRadiusY?: number
  orbitPhase?: number
  orbitSpeed?: number
}

type WaveLine = {
  amplitude: number
  frequency: number
  phase: number
  speed: number
  offset: number
  alpha: number
  thickness?: number
  bend?: number
}

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const activeStory = ref<number[]>([])
const rootSection = ref<HTMLElement | null>(null)
const coverCanvas = ref<HTMLCanvasElement | null>(null)
const closingCanvas = ref<HTMLCanvasElement | null>(null)
let previousThemeMode: 'light' | 'dark' | null = null
let observer: IntersectionObserver | null = null
let ticking = false
let cleanupCoverCanvas: (() => void) | null = null
let cleanupClosingCanvas: (() => void) | null = null

function updateScrollProgress() {
  if (!rootSection.value) {
    return
  }

  const coverSection = rootSection.value.querySelector<HTMLElement>('[data-story-section="0"]')

  if (!coverSection) {
    return
  }

  const rect = coverSection.getBoundingClientRect()
  const viewportHeight = window.innerHeight || 1
  const progress = Math.min(Math.max(-rect.top / (viewportHeight * 0.9), 0), 1)
  rootSection.value.style.setProperty('--home-scroll-progress', progress.toFixed(3))
}

function handleScroll() {
  if (ticking) {
    return
  }

  ticking = true
  window.requestAnimationFrame(() => {
    updateScrollProgress()
    ticking = false
  })
}

function goToLibrary() {
  void router.push({ name: 'library' })
}

function goToLogin() {
  void router.push({ name: 'login' })
}

function handleQuickStart() {
  if (authStore.isAuthenticated) {
    goToLibrary()
    return
  }

  goToLogin()
}

function createCoverCanvasAnimation(canvas: HTMLCanvasElement) {
  const canvasContext = canvas.getContext('2d')

  if (!canvasContext) {
    return () => { }
  }

  const context = canvasContext

  let animationFrameId = 0
  let width = 0
  let height = 0
  let ratio = 1
  let points: NodePoint[] = []
  let centerX = 0
  let centerY = 0

  function resize() {
    const bounds = canvas.getBoundingClientRect()
    ratio = Math.min(window.devicePixelRatio || 1, 2)
    width = bounds.width
    height = bounds.height
    centerX = width * 0.5
    centerY = height * 0.42
    canvas.width = Math.max(1, Math.floor(width * ratio))
    canvas.height = Math.max(1, Math.floor(height * ratio))
    context.setTransform(ratio, 0, 0, ratio, 0, 0)

    const orbitNodes = Array.from({ length: 18 }, (_, index) => {
      const ring = index < 8 ? 0 : index < 14 ? 1 : 2
      const radiusX = Math.min(width, height) * (0.14 + ring * 0.07)
      const radiusY = radiusX * (0.5 + ring * 0.05)

      return {
        x: centerX,
        y: centerY,
        vx: 0,
        vy: 0,
        radius: ring === 0 ? 2.5 : ring === 1 ? 2 : 1.8,
        alpha: ring === 0 ? 0.92 : 0.74,
        seed: Math.random() * Math.PI * 2,
        orbitRadiusX: radiusX,
        orbitRadiusY: radiusY,
        orbitPhase: (Math.PI * 2 * index) / 18,
        orbitSpeed: 0.00012 + ring * 0.00002,
      }
    })

    const fieldNodes = Array.from({ length: 28 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.08,
      radius: 1 + Math.random() * 1.8,
      alpha: 0.26 + Math.random() * 0.34,
      seed: Math.random() * Math.PI * 2,
    }))

    points = [...orbitNodes, ...fieldNodes]
  }

  function drawPetals(time: number) {
    context.save()
    context.translate(centerX, centerY)
    context.rotate(time * 0.00012)
    context.strokeStyle = 'rgba(242, 246, 252, 0.22)'
    context.lineWidth = 1

    for (let index = 0; index < 4; index += 1) {
      context.rotate(Math.PI / 2)
      context.beginPath()
      context.moveTo(-10, 0)
      context.bezierCurveTo(72, -36, 174, -26, 236, 0)
      context.bezierCurveTo(174, 26, 72, 36, -10, 0)
      context.stroke()
    }

    for (let spokeIndex = 0; spokeIndex < 6; spokeIndex += 1) {
      const angle = (Math.PI * 2 * spokeIndex) / 6 + (time * 0.00008)
      const armLength = Math.min(width, height) * 0.24
      context.beginPath()
      context.moveTo(0, 0)
      context.lineTo(Math.cos(angle) * armLength, Math.sin(angle) * armLength * 0.48)
      context.strokeStyle = 'rgba(244, 248, 252, 0.12)'
      context.stroke()
    }

    context.beginPath()
    context.fillStyle = 'rgba(250, 252, 255, 0.84)'
    context.arc(0, 0, 5.5, 0, Math.PI * 2)
    context.fill()

    context.restore()
  }

  function drawNodes(time: number) {
    for (let pointIndex = 0; pointIndex < points.length; pointIndex += 1) {
      const point = points[pointIndex]

      if (!point) {
        continue
      }

      if (point.orbitRadiusX && point.orbitRadiusY && point.orbitSpeed !== undefined && point.orbitPhase !== undefined) {
        const angle = time * point.orbitSpeed + point.orbitPhase
        const seed = point.seed ?? 0
        point.x = centerX + Math.cos(angle) * point.orbitRadiusX + Math.cos((time * 0.00036) + seed) * 4
        point.y = centerY + Math.sin(angle) * point.orbitRadiusY + Math.sin((time * 0.0003) + seed) * 4
      } else {
        point.x += point.vx
        point.y += point.vy

        if (point.x < -40) point.x = width + 40
        if (point.x > width + 40) point.x = -40
        if (point.y < -40) point.y = height + 40
        if (point.y > height + 40) point.y = -40
      }

      context.beginPath()
      context.fillStyle = `rgba(240, 244, 250, ${(point.alpha ?? 0.68).toFixed(3)})`
      context.arc(point.x, point.y, point.radius, 0, Math.PI * 2)
      context.fill()

      for (let neighborIndex = pointIndex + 1; neighborIndex < points.length; neighborIndex += 1) {
        const neighbor = points[neighborIndex]

        if (!neighbor) {
          continue
        }

        const distance = Math.hypot(point.x - neighbor.x, point.y - neighbor.y)

        if (distance > 196) {
          continue
        }

        const alpha = (1 - distance / 196) * ((point.orbitRadiusX || neighbor.orbitRadiusX) ? 0.26 : 0.16)
        context.beginPath()
        context.strokeStyle = `rgba(236, 241, 247, ${alpha.toFixed(3)})`
        context.lineWidth = (point.orbitRadiusX && neighbor.orbitRadiusX) ? 1.05 : 0.8
        context.moveTo(point.x, point.y)
        context.lineTo(neighbor.x, neighbor.y)
        context.stroke()
      }
    }
  }

  function drawFrame(time: number) {
    context.clearRect(0, 0, width, height)

    const halo = context.createRadialGradient(centerX, centerY - (height * 0.04), 0, centerX, centerY - (height * 0.04), width * 0.54)
    halo.addColorStop(0, 'rgba(255, 255, 255, 0.14)')
    halo.addColorStop(0.48, 'rgba(255, 255, 255, 0.05)')
    halo.addColorStop(1, 'rgba(255, 255, 255, 0)')
    context.fillStyle = halo
    context.fillRect(0, 0, width, height)

    for (let orbitIndex = 0; orbitIndex < 4; orbitIndex += 1) {
      const radius = Math.min(width, height) * (0.14 + orbitIndex * 0.065)
      context.beginPath()
      context.strokeStyle = `rgba(240, 244, 250, ${(0.09 - orbitIndex * 0.014).toFixed(3)})`
      context.lineWidth = 1
      context.ellipse(
        centerX,
        centerY,
        radius * (1.26 + orbitIndex * 0.08),
        radius * (0.54 + orbitIndex * 0.02),
        (time * 0.00006) + orbitIndex * 0.44,
        0,
        Math.PI * 2,
      )
      context.stroke()
    }

    for (let drizzleIndex = 0; drizzleIndex < 10; drizzleIndex += 1) {
      const x = ((drizzleIndex + 1) / 11) * width
      const yOffset = ((time * 0.05) + drizzleIndex * 68) % (height + 180)
      context.beginPath()
      context.strokeStyle = `rgba(245, 248, 252, ${(0.05 + (drizzleIndex % 3) * 0.012).toFixed(3)})`
      context.lineWidth = 0.8
      context.moveTo(x, yOffset - 80)
      context.lineTo(x - 12, yOffset)
      context.stroke()
    }

    drawNodes(time)
    drawPetals(time)

    animationFrameId = window.requestAnimationFrame(drawFrame)
  }

  resize()
  animationFrameId = window.requestAnimationFrame(drawFrame)
  window.addEventListener('resize', resize, { passive: true })

  return () => {
    window.cancelAnimationFrame(animationFrameId)
    window.removeEventListener('resize', resize)
  }
}

function createClosingCanvasAnimation(canvas: HTMLCanvasElement) {
  const canvasContext = canvas.getContext('2d')

  if (!canvasContext) {
    return () => { }
  }

  const context = canvasContext

  let animationFrameId = 0
  let width = 0
  let height = 0
  let ratio = 1
  let waveLines: WaveLine[] = []
  let orbitPoints: { angle: number; radiusX: number; radiusY: number; size: number; alpha: number }[] = []

  function resize() {
    const bounds = canvas.getBoundingClientRect()
    ratio = Math.min(window.devicePixelRatio || 1, 2)
    width = bounds.width
    height = bounds.height
    canvas.width = Math.max(1, Math.floor(width * ratio))
    canvas.height = Math.max(1, Math.floor(height * ratio))
    context.setTransform(ratio, 0, 0, ratio, 0, 0)

    waveLines = Array.from({ length: 12 }, (_, index) => ({
      amplitude: 12 + index * 4.6,
      frequency: 0.006 + index * 0.0006,
      phase: index * 0.58,
      speed: 0.0007 + index * 0.00012,
      offset: height * (0.22 + index * 0.056),
      alpha: 0.16 - index * 0.01,
      thickness: 1 + (index % 3) * 0.18,
      bend: 0.16 + index * 0.012,
    }))

    orbitPoints = Array.from({ length: 14 }, (_, index) => ({
      angle: (Math.PI * 2 * index) / 14,
      radiusX: Math.min(width, height) * (0.18 + (index % 4) * 0.045),
      radiusY: Math.min(width, height) * (0.06 + (index % 3) * 0.02),
      size: index % 4 === 0 ? 3.2 : 2.2,
      alpha: index % 4 === 0 ? 0.66 : 0.42,
    }))
  }

  function drawWave(line: WaveLine, time: number) {
    context.beginPath()

    for (let x = -120; x <= width + 120; x += 12) {
      const normalized = x / Math.max(width, 1)
      const y =
        line.offset +
        Math.sin((x * line.frequency) + (time * line.speed) + line.phase) * line.amplitude +
        Math.cos((normalized * Math.PI * 3.2) + (time * line.speed * 0.66)) * (line.amplitude * (line.bend ?? 0.24))

      if (x === -120) {
        context.moveTo(x, y)
      } else {
        context.lineTo(x, y)
      }
    }

    context.strokeStyle = `rgba(236, 241, 247, ${Math.max(line.alpha, 0.02).toFixed(3)})`
    context.lineWidth = line.thickness ?? 1.1
    context.stroke()
  }

  function drawFrame(time: number) {
    context.clearRect(0, 0, width, height)

    const glow = context.createRadialGradient(width * 0.72, height * 0.46, 0, width * 0.72, height * 0.46, width * 0.58)
    glow.addColorStop(0, 'rgba(255, 255, 255, 0.14)')
    glow.addColorStop(0.56, 'rgba(255, 255, 255, 0.04)')
    glow.addColorStop(1, 'rgba(255, 255, 255, 0)')
    context.fillStyle = glow
    context.fillRect(0, 0, width, height)

    context.save()
    context.translate(width * 0.66, height * 0.5)
    context.rotate(Math.sin(time * 0.00012) * 0.08)

    for (let ringIndex = 0; ringIndex < 5; ringIndex += 1) {
      const radiusX = Math.min(width, height) * (0.16 + ringIndex * 0.07)
      const radiusY = radiusX * (0.24 + ringIndex * 0.03)
      context.beginPath()
      context.strokeStyle = `rgba(236, 241, 247, ${(0.16 - ringIndex * 0.022).toFixed(3)})`
      context.lineWidth = 1
      context.ellipse(0, 0, radiusX, radiusY, ringIndex * 0.24, 0, Math.PI * 2)
      context.stroke()
    }

    orbitPoints.forEach((point, index) => {
      const angle = point.angle + (time * 0.00016) * (index % 2 === 0 ? 1 : -1)
      const x = Math.cos(angle) * point.radiusX
      const y = Math.sin(angle) * point.radiusY
      context.beginPath()
      context.fillStyle = `rgba(242, 246, 250, ${point.alpha.toFixed(3)})`
      context.arc(x, y, point.size, 0, Math.PI * 2)
      context.fill()
    })

    context.restore()

    waveLines.forEach((line) => {
      drawWave(line, time)
    })

    animationFrameId = window.requestAnimationFrame(drawFrame)
  }

  resize()
  animationFrameId = window.requestAnimationFrame(drawFrame)
  window.addEventListener('resize', resize, { passive: true })

  return () => {
    window.cancelAnimationFrame(animationFrameId)
    window.removeEventListener('resize', resize)
  }
}

onMounted(() => {
  if (typeof window === 'undefined') {
    return
  }

  previousThemeMode = themeStore.mode
  themeStore.setMode('dark', false)

  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-story-section]'))
  activeStory.value = sections.length ? [0] : []

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const index = Number(entry.target.getAttribute('data-story-section'))

        if (!Number.isFinite(index)) {
          return
        }

        if (entry.isIntersecting) {
          activeStory.value = Array.from(new Set([...activeStory.value, index])).sort((a, b) => a - b)
          return
        }

        activeStory.value = activeStory.value.filter((item) => item !== index)
      })
    },
    {
      threshold: 0.22,
      rootMargin: '-10% 0px -14% 0px',
    },
  )

  sections.forEach((section) => observer?.observe(section))
  updateScrollProgress()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleScroll, { passive: true })

  if (coverCanvas.value) {
    cleanupCoverCanvas = createCoverCanvasAnimation(coverCanvas.value)
  }

  if (closingCanvas.value) {
    cleanupClosingCanvas = createClosingCanvasAnimation(closingCanvas.value)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('resize', handleScroll)
  }

  if (previousThemeMode) {
    themeStore.setMode(previousThemeMode, false)
  }

  observer?.disconnect()
  observer = null
  cleanupCoverCanvas?.()
  cleanupCoverCanvas = null
  cleanupClosingCanvas?.()
  cleanupClosingCanvas = null
})
</script>

<template>
  <main ref="rootSection" class="page-shell page-shell--home-story">
    <section class="home-story home-story--cover" data-story-section="0"
      :class="{ 'is-visible': activeStory.includes(0) }">
      <div class="home-story-backdrop cover-rainfield" aria-hidden="true">
        <canvas ref="coverCanvas" class="cover-rainfield__canvas" />
        <span class="cover-rainfield__glow cover-rainfield__glow--one" />
        <span class="cover-rainfield__glow cover-rainfield__glow--two" />
        <span class="cover-rainfield__petal cover-rainfield__petal--one" />
        <span class="cover-rainfield__petal cover-rainfield__petal--two" />
        <span class="cover-rainfield__petal cover-rainfield__petal--three" />
        <span class="cover-rainfield__petal cover-rainfield__petal--four" />
      </div>
      <div class="container home-story__inner home-story__inner--cover home-story__inner--stagger">
        <div class="home-cover-copy">
          <div class="home-cover-copy__lead">经典文献，系统整理，持续阅读</div>
          <h1 class="home-hero-title" aria-label="汉语言 Wiki 系统">
            <span class="home-hero-title__shadow" aria-hidden="true">汉语言 Wiki 系统</span>
            <span class="home-hero-title__main">汉语言 Wiki 系统</span>
          </h1>
          <p class="home-cover-copy__summary">
            百家古文献，分享、阅读、评论。把课程资料与专题积累整理成真正可进入、可追踪、可复用的知识入口。
          </p>

          <div class="home-cover-actions">
            <button class="primary-button primary-button--with-orb" type="button" @click="goToLibrary">
              <span>免费预览</span>
              <span class="button-orb" aria-hidden="true">→</span>
            </button>

            <button class="ghost-button" type="button" @click="handleQuickStart">
              {{ authStore.isAuthenticated ? '继续阅读' : '快速开始' }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="home-story home-story--intro" data-story-section="1"
      :class="{ 'is-visible': activeStory.includes(1) }">
      <div class="home-story-backdrop intro-orbitfield" aria-hidden="true">
        <span class="intro-orbitfield__halo intro-orbitfield__halo--one" />
        <span class="intro-orbitfield__halo intro-orbitfield__halo--two" />
        <span class="intro-orbitfield__rotor intro-orbitfield__rotor--one" />
        <span class="intro-orbitfield__rotor intro-orbitfield__rotor--two" />
        <span class="intro-orbitfield__rotor intro-orbitfield__rotor--three" />
        <span class="intro-orbitfield__rotor intro-orbitfield__rotor--four" />
        <span class="intro-orbitfield__petals intro-orbitfield__petals--outer" />
        <span class="intro-orbitfield__petals intro-orbitfield__petals--inner" />
        <span class="intro-orbitfield__cluster intro-orbitfield__cluster--one" />
        <span class="intro-orbitfield__cluster intro-orbitfield__cluster--two" />
      </div>
      <div class="container home-story__inner home-story__inner--intro home-story__inner--stagger">
        <div class="orbital-scene" aria-hidden="true">
          <div class="orbital-scene__glow orbital-scene__glow--outer" />
          <div class="orbital-scene__glow orbital-scene__glow--inner" />
          <div class="orbital-scene__line orbital-scene__line--one" />
          <div class="orbital-scene__line orbital-scene__line--two" />
          <div class="orbital-scene__line orbital-scene__line--three" />
          <div class="orbital-scene__line orbital-scene__line--four" />
          <div class="orbital-scene__petal-ring orbital-scene__petal-ring--outer" />
          <div class="orbital-scene__petal-ring orbital-scene__petal-ring--inner" />
          <div class="orbital-scene__asteroid-cloud orbital-scene__asteroid-cloud--one" />
          <div class="orbital-scene__asteroid-cloud orbital-scene__asteroid-cloud--two" />
          <div class="orbital-scene__planet">
            <span class="orbital-scene__core" />
            <span class="orbital-scene__crest" />
          </div>
        </div>

        <div class="home-intro-copy">
          <span class="section-kicker">我们的优势</span>
          <h2>课程资料变知识入口</h2>
          <p>
            这里不是只放一批零散文章，而是把课程资料整理成真正可搜索、可阅读、可持续维护的知识入口。长期沉淀、反复查阅、后续扩展，不在话下
          </p>
        </div>
      </div>
    </section>

    <section class="home-story home-story--features" data-story-section="2"
      :class="{ 'is-visible': activeStory.includes(2) }">
      <div class="home-story-backdrop feature-inkfield" aria-hidden="true">
        <span class="feature-inkfield__stream feature-inkfield__stream--one" />
        <span class="feature-inkfield__stream feature-inkfield__stream--two" />
        <span class="feature-inkfield__stream feature-inkfield__stream--three" />
        <span class="feature-inkfield__stream feature-inkfield__stream--four" />
        <span class="feature-inkfield__wash feature-inkfield__wash--one" />
        <span class="feature-inkfield__wash feature-inkfield__wash--two" />
        <span class="feature-inkfield__wash feature-inkfield__wash--three" />
        <span class="feature-inkfield__wash feature-inkfield__wash--four" />
      </div>
      <div class="container home-story__inner home-story__inner--features home-story__inner--stagger">
        <div class="home-features-copy home-features-copy--inked">
          <div class="home-features-copy__ink" aria-hidden="true">
            <span class="home-features-copy__ink-wash home-features-copy__ink-wash--one" />
            <span class="home-features-copy__ink-wash home-features-copy__ink-wash--two" />
            <span class="home-features-copy__ink-splash home-features-copy__ink-splash--one" />
            <span class="home-features-copy__ink-splash home-features-copy__ink-splash--two" />
          </div>
          <span class="section-kicker">更多功能</span>
          <h2>读、找、谈</h2>

          <ul class="feature-rail" aria-label="首页亮点">
            <li class="feature-rail__item">
              <strong>海量文献</strong>
              <p>从主题文章到原典摘录，内容可以持续扩充，而不是散落在不同文件夹里。</p>
            </li>
            <li class="feature-rail__item">
              <strong>云友解读</strong>
              <p>保留导读、评述与专题整理，让阅读不只停在原文，还能形成讨论上下文。</p>
            </li>
            <li class="feature-rail__item">
              <strong>畅所欲言</strong>
              <p>游客和读者都能围绕文章留言，评论区成为阅读反馈与知识补充的一部分。</p>
            </li>
          </ul>
        </div>

        <div class="ink-panel" aria-hidden="true">
          <div class="ink-panel__sheet" />
          <div class="ink-panel__mist ink-panel__mist--top" />
          <div class="ink-panel__mist ink-panel__mist--bottom" />
          <div class="ink-panel__stream ink-panel__stream--one" />
          <div class="ink-panel__stream ink-panel__stream--two" />
          <div class="ink-panel__stream ink-panel__stream--three" />
          <div class="ink-panel__stream ink-panel__stream--four" />
          <div class="ink-panel__spray ink-panel__spray--one" />
          <div class="ink-panel__spray ink-panel__spray--two" />
          <div class="ink-panel__wash ink-panel__wash--primary" />
          <div class="ink-panel__wash ink-panel__wash--secondary" />
          <div class="ink-panel__art-frame">
            <img class="ink-panel__art" src="/home-chapter-three-art.png" alt="" decoding="async" />
          </div>
        </div>
      </div>
    </section>

    <section class="home-story home-story--closing" data-story-section="3"
      :class="{ 'is-visible': activeStory.includes(3) }">
      <div class="home-story-backdrop closing-wavefield" aria-hidden="true">
        <canvas ref="closingCanvas" class="closing-wavefield__canvas" />
        <span class="closing-wavefield__glow closing-wavefield__glow--one" />
        <span class="closing-wavefield__glow closing-wavefield__glow--two" />
      </div>
      <div class="container home-story__inner home-story__inner--closing home-story__inner--stagger">
        <article class="home-closing-card">
          <span class="section-kicker">卷尾语</span>
          <h2>更多内容，敬请期待</h2>
          <p>
            文库已经可以进入浏览，首页后续还会继续补充更完整的专题叙事、内容导览和展示细节，让入口既清晰又更有表达力。
          </p>
          <div class="home-closing-actions">
            <button class="primary-button primary-button--with-orb" type="button" @click="goToLibrary">
              <span>进入文库</span>
              <span class="button-orb" aria-hidden="true">→</span>
            </button>
            <button class="ghost-button" type="button" @click="authStore.isAuthenticated ? goToLibrary() : goToLogin()">
              {{ authStore.isAuthenticated ? '去继续阅读' : '前往登录' }}
            </button>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>
