import katex from 'katex'

/** 转义普通文本，避免 v-html 插入非预期标签 */
const escapeHTML = (text: string) =>
  text.replace(/[&<>"']/g, (character) => {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }
    return escapeMap[character] ?? character
  })

/** 渲染由单个美元符号包裹的行内 LaTeX */
export const renderInlineLatex = (sourceText: string): string =>
  sourceText
    .split(/(\$[^$]+\$)/g)
    .map((textPart) => {
      if (!textPart.startsWith('$') || !textPart.endsWith('$')) {
        return escapeHTML(textPart)
      }

      return katex.renderToString(textPart.slice(1, -1), {
        displayMode: false,
        throwOnError: false,
      })
    })
    .join('')
