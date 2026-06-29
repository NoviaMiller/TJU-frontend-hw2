export function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

export function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function createExcerpt(value: string, maxLength = 130) {
  const plain = stripHtml(value)

  if (plain.length <= maxLength) {
    return plain
  }

  return `${plain.slice(0, maxLength).trim()}...`
}

export function formatViews(value: number) {
  if (value < 1000) {
    return `${value}`
  }

  return `${(value / 1000).toFixed(1)}k`
}

export function joinTags(tags: string[]) {
  return tags.join(', ')
}

export function parseTags(input: string) {
  return input
    .split(/[，,]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
}
