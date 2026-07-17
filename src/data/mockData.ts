import { previewConcepts } from './formulaCatalog'
import { categories, type MathConcept } from './types'

export { categories }
export type { CategoryFilter, ConceptParam, MathConcept } from './types'

/** 可交互的核心概念（保留完整可视化参数） */
const interactiveConcepts: MathConcept[] = [
  {
    id: 'jordan-stability',
    title: 'Jordan 块临界稳定性',
    category: '线性代数',
    latexFormula: 'J = \\begin{bmatrix} \\lambda & 1 \\\\ 0 & \\lambda \\end{bmatrix}',
    description:
      '展示当特征值 λ 处于临界状态时，Jordan 块导致的代数发散与相平面轨迹。调节实部与扰动因子，观察系统从稳定到发散的过渡。',
    hasInteractive: true,
    derivationSteps: [
      '考虑线性常微分方程组 \\dot{x} = Jx',
      '解为 x(t) = e^{Jt} x(0)',
      '对于 Jordan 块 J = \\begin{bmatrix} \\lambda & 1 \\\\ 0 & \\lambda \\end{bmatrix}',
      'e^{Jt} = e^{\\lambda t} \\begin{bmatrix} 1 & t \\\\ 0 & 1 \\end{bmatrix}',
      '当 \\lambda < 0 时，e^{\\lambda t} 占主导，系统稳定；当 \\lambda = 0 时，t 项导致代数发散。',
    ],
    details: {
      intuitive:
        '矩阵的特征值决定了系统的稳定性。如果把系统比作一个在山谷里的球，特征值就像是山谷的坡度。实部小于0意味着坡度向内，球会稳定在谷底；等于0意味着平地，球会乱跑；Jordan块则表示存在"共振"或"重根"情况，会导致系统随时间代数级发散。',
      rigorous:
        '对于线性常系数微分方程组 $\\dot{x} = Ax$，其零解渐近稳定的充要条件是矩阵 $A$ 的所有特征值的实部均严格小于 $0$。若存在实部为 $0$ 的特征值，且对应 Jordan 块大小 $> 1$（即代数重数大于几何重数），则解矩阵 $e^{At}$ 中会包含 $t^k$ 形式的多项式项，导致系统不稳定。',
      application:
        '在控制理论中用于分析闭环系统的稳定性（如极点配置）；在机械振动中用于分析共振现象；在电路网络中用于判断系统是否会发生自激振荡。',
    },
    defaultParams: [
      {
        name: 'Lambda (实部)',
        queryKey: 'lambda',
        min: -1.5,
        max: 1.5,
        step: 0.1,
        value: -0.1,
      },
      {
        name: '扰动因子 (右上角)',
        queryKey: 'perturbation',
        min: 0,
        max: 2,
        step: 0.1,
        value: 1.0,
      },
    ],
  },
  {
    id: 'matrix-transform',
    title: '二维线性变换',
    category: '线性代数',
    latexFormula:
      'T(\\mathbf{v}) = A\\mathbf{v},\\quad A = \\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}',
    description:
      '可视化矩阵对单位圆与基向量的线性变换效果，直观理解拉伸、旋转与剪切。',
    hasInteractive: true,
    details: {
      intuitive:
        '矩阵不仅仅是一堆数字，它其实是一个“动作”。当你把一个矩阵乘上一个向量时，就相当于对空间进行了一次拉伸、挤压或旋转。在这个可视化中，你可以直观地看到网格和单位圆是如何被“捏扁搓圆”的。',
      rigorous:
        '线性映射 T: V -> W 保持向量加法 T(u+v) = T(u)+T(v) 和标量乘法 T(cu) = cT(u)。在给定基底下，任何有限维线性映射都可以唯一地表示为矩阵乘法。矩阵的行列式绝对值表示变换后面积的缩放比例，符号表示是否发生了镜像翻转。',
      application:
        '计算机图形学中的 3D 模型变换（平移、旋转、缩放）；机器学习中的数据降维与特征空间映射；物理学中的应力张量与形变分析；密码学中的线性变换混淆。',
    },
    defaultParams: [
      { name: 'a (缩放/剪切)', queryKey: 'a', min: -2, max: 2, step: 0.1, value: 1.2 },
      { name: 'b (剪切)', queryKey: 'b', min: -2, max: 2, step: 0.1, value: 0.5 },
      { name: 'c (剪切)', queryKey: 'c', min: -2, max: 2, step: 0.1, value: 0.3 },
      { name: 'd (缩放)', queryKey: 'd', min: -2, max: 2, step: 0.1, value: 0.8 },
    ],
  },
  {
    id: 'taylor-series',
    title: '泰勒级数展开',
    category: '微积分',
    latexFormula: 'e^{x} \\approx \\sum_{k=0}^{N} \\frac{x^{k}}{k!}',
    description:
      '用多项式局部逼近指数函数。提高阶数 N，观察逼近区间如何向外扩展。',
    hasInteractive: true,
    details: {
      intuitive:
        '如果你只知道一个函数在某一点的值、斜率、弯曲程度... 你能不能猜出它在附近长什么样？泰勒级数就是用越来越复杂的曲线（直线、抛物线、三次曲线...）去一点点贴合一个复杂的函数。阶数越高，贴合的范围就越广。',
      rigorous:
        '若函数 $f(x)$ 在点 $a$ 处具有直到 $n$ 阶的导数，则存在一个 $n$ 次多项式 $P_n(x)$ 使得 $f(x) = P_n(x) + R_n(x)$，其中 $R_n(x)$ 是佩亚诺余项或拉格朗日余项。如果函数在某邻域内无穷次可导且余项趋于 $0$，则函数可以展开为收敛的泰勒幂级数。',
      application:
        '计算机底层计算三角函数和指数函数（如 $\\sin$、$\\exp$）的算法基础；物理学中的微小扰动近似（如单摆的小角度近似 $\\sin \\theta \\approx \\theta$）；数值分析中的有限差分法；优化算法中的牛顿法。',
    },
    defaultParams: [
      { name: '展开阶数 N', queryKey: 'n', min: 1, max: 12, step: 1, value: 3 },
    ],
  },
]

/** 完整概念库：交互项在前 + 公式预览项 */
export const mockConcepts: MathConcept[] = [
  ...interactiveConcepts,
  ...previewConcepts,
]
