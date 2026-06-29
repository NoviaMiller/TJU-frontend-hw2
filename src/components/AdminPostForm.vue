<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import { useRouter } from 'vue-router'

import { createPost, updatePost, uploadCover } from '@/api/services'
import { joinTags, parseTags } from '@/lib/format'
import { readFileAsDataUrl } from '@/lib/upload'
import type { Post, PostFormat, PostInput } from '@/types'

const props = defineProps<{
  mode: 'create' | 'edit'
  post?: Post | null
}>()

const router = useRouter()

const form = reactive<PostInput>({
  title: '',
  summary: '',
  content: '',
  format: 'markdown',
  category: '',
  tags: [],
  coverImage: '',
  status: 'published',
  pinned: false,
})

const tagText = ref('')
const saving = ref(false)
const uploading = ref(false)
const errorMessage = ref('')

const editorOptions = {
  theme: 'snow',
  placeholder: '输入富文本内容...',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ header: 1 }, { header: 2 }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block', 'link', 'image'],
      [{ color: [] }, { background: [] }],
      ['clean'],
    ],
  },
}

const submitLabel = computed(() => {
  if (saving.value) {
    return props.mode === 'create' ? '发布中...' : '保存中...'
  }

  return props.mode === 'create' ? '发布文章' : '保存修改'
})

watch(
  () => props.post,
  (post) => {
    if (!post) {
      form.title = ''
      form.summary = ''
      form.content = ''
      form.format = 'markdown'
      form.category = ''
      form.tags = []
      form.coverImage = ''
      form.status = 'published'
      form.pinned = false
      tagText.value = ''
      return
    }

    form.title = post.title
    form.summary = post.summary
    form.content = post.content
    form.format = post.format
    form.category = post.category
    form.tags = [...post.tags]
    form.coverImage = post.coverImage
    form.status = post.status
    form.pinned = post.pinned
    tagText.value = joinTags(post.tags)
  },
  { immediate: true },
)

function validate() {
  if (!form.title.trim()) {
    return '标题不能为空'
  }

  if (!form.summary.trim()) {
    return '摘要不能为空'
  }

  if (!form.category.trim()) {
    return '分类不能为空'
  }

  if (!form.content.trim()) {
    return '正文不能为空'
  }

  if (!form.coverImage.trim()) {
    return '请上传一张封面图'
  }

  return ''
}

function syncTags() {
  form.tags = parseTags(tagText.value)
}

function setFormat(format: PostFormat) {
  form.format = format
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  uploading.value = true
  errorMessage.value = ''

  try {
    const dataUrl = await readFileAsDataUrl(file)
    const response = await uploadCover({
      filename: file.name,
      dataUrl,
    })

    form.coverImage = response.url
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '上传失败'
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function submitForm() {
  syncTags()
  errorMessage.value = validate()

  if (errorMessage.value) {
    return
  }

  saving.value = true

  try {
    if (props.mode === 'create') {
      await createPost({ ...form })
    } else if (props.post) {
      await updatePost(props.post.id, { ...form })
    }

    await router.push({ name: 'admin-dashboard' })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '保存失败'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="editor-layout" @submit.prevent="submitForm">
    <section class="card-section">
      <div class="section-heading">
        <div>
          <h2>基础信息</h2>
          <p>先填写标题、摘要、分类与标签，让文章更容易被搜索和归档。</p>
        </div>
      </div>

      <div class="form-grid">
        <label class="field field--full">
          <span>文章标题</span>
          <input v-model="form.title" type="text" maxlength="60" placeholder="例如：Vue 3 权限管理实践" />
        </label>

        <label class="field field--full">
          <span>摘要</span>
          <textarea
            v-model="form.summary"
            rows="3"
            maxlength="140"
            placeholder="用 1~2 句话概括这篇文章最核心的价值。"
          />
        </label>

        <label class="field">
          <span>分类</span>
          <input v-model="form.category" type="text" placeholder="例如：前端开发" />
        </label>

        <label class="field">
          <span>标签</span>
          <input
            v-model="tagText"
            type="text"
            placeholder="多个标签用逗号分隔"
            @change="syncTags"
            @blur="syncTags"
          />
        </label>
      </div>
    </section>

    <section class="card-section">
      <div class="section-heading">
        <div>
          <h2>内容编辑</h2>
          <p>支持 Markdown 和富文本两种模式，适合课程资料和图文教程两类内容。</p>
        </div>

        <div class="format-switch">
          <button
            type="button"
            class="ghost-button"
            :class="{ 'ghost-button--active': form.format === 'markdown' }"
            @click="setFormat('markdown')"
          >
            Markdown
          </button>
          <button
            type="button"
            class="ghost-button"
            :class="{ 'ghost-button--active': form.format === 'richtext' }"
            @click="setFormat('richtext')"
          >
            富文本
          </button>
        </div>
      </div>

      <label v-if="form.format === 'markdown'" class="field field--full">
        <span>正文内容</span>
        <textarea
          v-model="form.content"
          rows="16"
          class="editor-textarea"
          placeholder="使用 Markdown 书写正文..."
        />
      </label>

      <label v-else class="field field--full">
        <span>正文内容</span>
        <QuillEditor
          v-model:content="form.content"
          content-type="html"
          theme="snow"
          toolbar="full"
          :options="editorOptions"
          class="quill-shell"
        />
      </label>
    </section>

    <section class="card-section">
      <div class="section-heading">
        <div>
          <h2>发布设置</h2>
          <p>上传封面、设置发布状态和置顶，后台列表会即时反映这些变化。</p>
        </div>
      </div>

      <div class="publish-grid">
        <div class="field">
          <span>封面图上传</span>
          <label class="upload-box">
            <input type="file" accept="image/*" @change="handleFileChange" />
            <span>{{ uploading ? '上传中...' : '选择图片并模拟上传' }}</span>
          </label>
          <small>当前返回的是 base64 URL，后续可替换为 MySQL + 文件服务。</small>
        </div>

        <div class="field">
          <span>发布状态</span>
          <select v-model="form.status">
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
          </select>
        </div>

        <label class="checkbox-field">
          <input v-model="form.pinned" type="checkbox" />
          <span>设为置顶文章</span>
        </label>
      </div>

      <div v-if="form.coverImage" class="cover-preview">
        <img :src="form.coverImage" alt="文章封面预览" />
      </div>
    </section>

    <div class="form-actions form-actions--editor">
      <span v-if="errorMessage" class="form-error">{{ errorMessage }}</span>
      <button class="primary-button" type="submit" :disabled="saving || uploading">
        {{ submitLabel }}
      </button>
    </div>
  </form>
</template>
