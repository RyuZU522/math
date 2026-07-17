import type { MathConcept } from './types'

/** 无 Canvas 交互的公式预览项 */
export const previewConcepts: MathConcept[] = [
  {
    id: 'determinant-expansion',
    title: '行列式展开',
    category: '线性代数',
    latexFormula:
      '\\det(A) = \\sum_{\\sigma\\in S_{n}}\\mathrm{sgn}(\\sigma)\\prod_{i=1}^{n}a_{i,\\sigma(i)}',
    description: '行列式的 Leibniz 公式定义。',
    hasInteractive: false,
  },
  {
    id: 'green-theorem',
    title: '格林公式',
    category: '微积分',
    latexFormula:
      '\\oint_{C}P\\,dx + Q\\,dy = \\iint_{D}\\left(\\frac{\\partial Q}{\\partial x}-\\frac{\\partial P}{\\partial y}\\right)dA',
    description: '平面区域上的曲线积分与二重积分关系。',
    hasInteractive: false,
  },
  {
    id: 'stokes-theorem',
    title: '斯托克斯定理',
    category: '微积分',
    latexFormula:
      '\\int_{\\partial S}\\mathbf{F}\\cdot d\\mathbf{r} = \\iint_{S}(\\nabla\\times\\mathbf{F})\\cdot d\\mathbf{S}',
    description: '将曲面积分与边界曲线积分联系起来的向量微积分核心定理。',
    hasInteractive: false,
  },
  {
    id: 'cramers-rule',
    title: '克莱姆法则',
    category: '线性代数',
    latexFormula: 'x_{i} = \\frac{\\det(A_{i})}{\\det(A)}',
    description: '用行列式求解线性方程组的经典方法。',
    hasInteractive: false,
  },
]
