<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const activeStory = ref<number[]>([])
const rootSection = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
let ticking = false

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

function handleQuickStart() {
  if (authStore.isAuthenticated) {
    void router.push({ name: 'library' })
    return
  }

  void router.push({ name: 'login' })
}

onMounted(() => {
  if (typeof window === 'undefined') {
    return
  }

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
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('resize', handleScroll)
  }
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <main ref="rootSection" class="page-shell page-shell--home-story">
    <section class="home-story home-story--cover" data-story-section="0"
      :class="{ 'is-visible': activeStory.includes(0) }">
      <div class="container home-story__inner home-story__inner--cover home-story__inner--stagger">
        <div class="home-cover-copy">
          <span class="eyebrow">卷首语</span>
          <p class="home-cover-copy__lead">经典文献，系统整理，持续阅读</p>
          <h1 class="home-hero-title">
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

            <button class="ghost-button home-cover-actions__secondary" type="button" @click="handleQuickStart">
              {{ authStore.isAuthenticated ? '继续阅读' : '快速开始' }}
            </button>
          </div>
        </div>

        <aside class="home-cover-panel" aria-label="站点信息">
          <div class="home-cover-panel__metric">
            <strong>典藏</strong>
            <span>课程资料与专题整理统一归档</span>
          </div>
          <div class="home-cover-panel__metric">
            <strong>阅读</strong>
            <span>从推荐、分类到全文评论保持完整链路</span>
          </div>
          <div class="home-cover-panel__note">
            学习古汉语，分享古汉语知识的不二法门
          </div>
        </aside>
      </div>
    </section>

    <section class="home-story home-story--intro" data-story-section="1"
      :class="{ 'is-visible': activeStory.includes(1) }">
      <div class="container home-story__inner home-story__inner--intro home-story__inner--stagger">
        <div class="orbital-scene" aria-hidden="true">
          <div class="orbital-scene__halo orbital-scene__halo--outer" />
          <div class="orbital-scene__halo orbital-scene__halo--inner" />
          <div class="orbital-scene__mist orbital-scene__mist--left" />
          <div class="orbital-scene__mist orbital-scene__mist--right" />
          <div class="orbital-scene__satellite orbital-scene__satellite--alpha" />
          <div class="orbital-scene__satellite orbital-scene__satellite--beta" />
          <div class="orbital-scene__ring orbital-scene__ring--back" />
          <div class="orbital-scene__planet">
            <span class="orbital-scene__core" />
            <span class="orbital-scene__crest" />
          </div>
          <div class="orbital-scene__ring orbital-scene__ring--front" />
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
      <div class="container home-story__inner home-story__inner--features home-story__inner--stagger">
        <div class="home-features-copy">
          <span class="section-kicker">更多功能</span>
          <h2>读、找、谈，全面完整的使用场景</h2>

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
          <div class="ink-panel__stroke ink-panel__stroke--one" />
          <div class="ink-panel__stroke ink-panel__stroke--two" />
          <div class="ink-panel__wash ink-panel__wash--primary" />
          <div class="ink-panel__wash ink-panel__wash--secondary" />
          <div class="ink-panel__callout">
            <span>水墨意象</span>
            <p>用更安静的画面承接中文文献主题，不抢内容，只为首页提供更明确的气质。</p>
          </div>
        </div>
      </div>
    </section>

    <section class="home-story home-story--closing" data-story-section="3"
      :class="{ 'is-visible': activeStory.includes(3) }">
      <div class="container home-story__inner home-story__inner--closing home-story__inner--stagger">
        <div class="home-closing-card">
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
            <button class="ghost-button" type="button" @click="handleQuickStart">
              {{ authStore.isAuthenticated ? '去继续阅读' : '前往登录' }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
