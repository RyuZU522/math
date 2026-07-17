<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  conceptId: string
  paramValues: number[]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

/** 视口变换：平移 + 缩放 */
const viewOffsetX = ref(0)
const viewOffsetY = ref(0)
const viewScale = ref(1)

const MIN_VIEW_SCALE = 0.2
const MAX_VIEW_SCALE = 12
const DISPLAY_HEIGHT = 320
const EXPORT_PIXEL_RATIO = 3

const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragOriginOffsetX = ref(0)
const dragOriginOffsetY = ref(0)

const zoomPercentLabel = computed(() => `${Math.round(viewScale.value * 100)}%`)

/** 线宽随缩放补偿，避免放大后线条过粗 */
const strokeWidth = (baseWidth: number) => baseWidth / viewScale.value

/**
 * 将屏幕像素坐标转换为内容世界坐标（当前视口变换下）。
 * 坐标轴在视口变换之后绘制，因此需按可见区域反向推算范围。
 */
const getVisibleWorldBounds = (screenWidth: number, screenHeight: number) => {
  const scale = viewScale.value || 1
  const offsetX = viewOffsetX.value
  const offsetY = viewOffsetY.value
  const padding = 4 / scale

  return {
    left: (0 - offsetX) / scale - padding,
    top: (0 - offsetY) / scale - padding,
    right: (screenWidth - offsetX) / scale + padding,
    bottom: (screenHeight - offsetY) / scale + padding,
  }
}

/** 根据缩放自适应网格间距，保持屏幕上约 48px 一线 */
const resolveAdaptiveGridStep = (baseStep = 40) => {
  const targetScreenStep = 48
  const worldStepNeeded = targetScreenStep / (viewScale.value || 1)
  const ratio = Math.max(worldStepNeeded / baseStep, 0.125)
  const niceMultiplier = 2 ** Math.round(Math.log2(ratio))
  return baseStep * niceMultiplier
}

/** 绘制无限延伸的坐标轴与网格（随平移/缩放覆盖整个可视区域） */
const drawAxes = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  options?: {
    showGrid?: boolean
    originX?: number
    originY?: number
  },
) => {
  const originX = options?.originX ?? width / 2
  const originY = options?.originY ?? height / 2
  const bounds = getVisibleWorldBounds(width, height)
  const gridStep = resolveAdaptiveGridStep(40)

  if (options?.showGrid !== false) {
    context.strokeStyle = '#1e293b'
    context.lineWidth = strokeWidth(1)
    context.beginPath()

    const firstGridX = Math.floor(bounds.left / gridStep) * gridStep
    for (let gridX = firstGridX; gridX <= bounds.right + gridStep * 0.5; gridX += gridStep) {
      context.moveTo(gridX, bounds.top)
      context.lineTo(gridX, bounds.bottom)
    }

    const firstGridY = Math.floor(bounds.top / gridStep) * gridStep
    for (let gridY = firstGridY; gridY <= bounds.bottom + gridStep * 0.5; gridY += gridStep) {
      context.moveTo(bounds.left, gridY)
      context.lineTo(bounds.right, gridY)
    }
    context.stroke()
  }

  context.strokeStyle = '#475569'
  context.lineWidth = strokeWidth(1.5)
  context.beginPath()
  // 水平轴：左右无限延伸
  context.moveTo(bounds.left, originY)
  context.lineTo(bounds.right, originY)
  // 垂直轴：上下无限延伸
  context.moveTo(originX, bounds.top)
  context.lineTo(originX, bounds.bottom)
  context.stroke()
}

/** 绘制坐标轴标签 */
const drawAxisLabels = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  xLabel: string,
  yLabel: string,
  options?: { originX?: number; originY?: number },
) => {
  const originX = options?.originX ?? width / 2
  const originY = options?.originY ?? height / 2

  context.save()
  // 恢复到屏幕坐标系以绘制文字（不受缩放影响）
  context.setTransform(1, 0, 0, 1, 0, 0)
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  context.scale(dpr, dpr)

  context.font = '12px ui-sans-serif, system-ui, sans-serif'
  context.fillStyle = '#94a3b8'

  // X 轴标签 (右下角)
  const screenOriginY = originY * viewScale.value + viewOffsetY.value
  const clampedY = Math.max(20, Math.min(height - 20, screenOriginY))
  context.textAlign = 'right'
  context.textBaseline = 'bottom'
  context.fillText(xLabel, width - 12, clampedY - 8)

  // Y 轴标签 (左上角)
  const screenOriginX = originX * viewScale.value + viewOffsetX.value
  const clampedX = Math.max(20, Math.min(width - 20, screenOriginX))
  context.textAlign = 'left'
  context.textBaseline = 'top'
  context.fillText(yLabel, clampedX + 8, 12)

  context.restore()
}

/** 重置视口 */
const resetView = () => {
  viewOffsetX.value = 0
  viewOffsetY.value = 0
  viewScale.value = 1
  drawVisualization()
}

/** 将画布尺寸适配容器宽度，保持清晰锐度 */
const resizeCanvas = () => {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return

  const displayWidth = container.clientWidth
  const displayHeight = DISPLAY_HEIGHT
  const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2)

  canvas.width = Math.floor(displayWidth * devicePixelRatio)
  canvas.height = Math.floor(displayHeight * devicePixelRatio)
  canvas.style.width = `${displayWidth}px`
  canvas.style.height = `${displayHeight}px`

  const context = canvas.getContext('2d')
  if (context) {
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
  }

  drawVisualization()
}

/** 应用视口平移与缩放 */
const applyViewTransform = (context: CanvasRenderingContext2D) => {
  context.translate(viewOffsetX.value, viewOffsetY.value)
  context.scale(viewScale.value, viewScale.value)
}

/** Jordan 块相平面轨迹 */
const drawJordan = (context: CanvasRenderingContext2D, width: number, height: number) => {
  const lambdaValue = props.paramValues[0] ?? -0.1
  const perturbation = props.paramValues[1] ?? 1.0
  const centerX = width / 2
  const centerY = height / 2
  const scale = 55

  drawAxes(context, width, height)
  drawAxisLabels(context, width, height, '状态 x₁', '状态 x₂')

  const initialConditions = [
    [1.2, 0.8],
    [-1.0, 1.0],
    [0.6, -1.2],
    [-0.8, -0.6],
    [1.5, -0.3],
    [-0.4, 1.4],
  ]

  const colors = ['#38bdf8', '#10b981', '#a78bfa', '#f472b6', '#fbbf24', '#34d399']

  initialConditions.forEach((initialState, trajectoryIndex) => {
    let stateX = initialState[0]
    let stateY = initialState[1]
    const timeStep = 0.02
    const stepCount = 400

    context.strokeStyle = colors[trajectoryIndex % colors.length]
    context.lineWidth = strokeWidth(1.6)
    context.beginPath()
    context.moveTo(centerX + stateX * scale, centerY - stateY * scale)

    for (let stepIndex = 0; stepIndex < stepCount; stepIndex++) {
      const derivativeX = lambdaValue * stateX + perturbation * stateY
      const derivativeY = lambdaValue * stateY
      stateX += derivativeX * timeStep
      stateY += derivativeY * timeStep

      const canvasX = centerX + stateX * scale
      const canvasY = centerY - stateY * scale
      if (canvasX < -200 || canvasX > width + 200 || canvasY < -200 || canvasY > height + 200) break
      context.lineTo(canvasX, canvasY)
    }
    context.stroke()
  })
}

/** 二维线性变换：单位圆与基向量 */
const drawMatrixTransform = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) => {
  const matrixA = props.paramValues[0] ?? 1.2
  const matrixB = props.paramValues[1] ?? 0.5
  const matrixC = props.paramValues[2] ?? 0.3
  const matrixD = props.paramValues[3] ?? 0.8
  const centerX = width / 2
  const centerY = height / 2
  const scale = 70

  drawAxes(context, width, height)
  drawAxisLabels(context, width, height, 'x 轴', 'y 轴')

  context.strokeStyle = '#475569'
  context.lineWidth = strokeWidth(1)
  context.setLineDash([4, 4])
  context.beginPath()
  for (let angleIndex = 0; angleIndex <= 64; angleIndex++) {
    const angle = (angleIndex / 64) * Math.PI * 2
    const pointX = centerX + Math.cos(angle) * scale
    const pointY = centerY - Math.sin(angle) * scale
    if (angleIndex === 0) context.moveTo(pointX, pointY)
    else context.lineTo(pointX, pointY)
  }
  context.closePath()
  context.stroke()
  context.setLineDash([])

  context.strokeStyle = '#38bdf8'
  context.lineWidth = strokeWidth(2)
  context.beginPath()
  for (let angleIndex = 0; angleIndex <= 64; angleIndex++) {
    const angle = (angleIndex / 64) * Math.PI * 2
    const sourceX = Math.cos(angle)
    const sourceY = Math.sin(angle)
    const transformedX = matrixA * sourceX + matrixB * sourceY
    const transformedY = matrixC * sourceX + matrixD * sourceY
    const pointX = centerX + transformedX * scale
    const pointY = centerY - transformedY * scale
    if (angleIndex === 0) context.moveTo(pointX, pointY)
    else context.lineTo(pointX, pointY)
  }
  context.closePath()
  context.stroke()

  const drawArrow = (endX: number, endY: number, color: string, label: string) => {
    context.strokeStyle = color
    context.fillStyle = color
    context.lineWidth = strokeWidth(2)
    context.beginPath()
    context.moveTo(centerX, centerY)
    context.lineTo(centerX + endX * scale, centerY - endY * scale)
    context.stroke()
    context.font = `${12 / viewScale.value}px ui-sans-serif, system-ui`
    context.fillText(label, centerX + endX * scale + 6, centerY - endY * scale - 6)
  }

  drawArrow(1, 0, '#64748b', 'e₁')
  drawArrow(0, 1, '#64748b', 'e₂')
  drawArrow(matrixA, matrixC, '#10b981', 'Ae₁')
  drawArrow(matrixB, matrixD, '#f472b6', 'Ae₂')
}

/** 阶乘辅助函数 */
const factorial = (order: number): number => {
  let product = 1
  for (let index = 2; index <= order; index++) product *= index
  return product
}

/** 泰勒级数逼近 e^x */
const drawTaylor = (context: CanvasRenderingContext2D, width: number, height: number) => {
  const expansionOrder = Math.max(1, Math.round(props.paramValues[0] ?? 3))
  const centerX = width / 2
  const centerY = height / 2
  const scaleX = width / 10
  const scaleY = height / 8

  drawAxes(context, width, height)
  drawAxisLabels(context, width, height, '自变量 x', '函数值 y')

  context.strokeStyle = '#475569'
  context.lineWidth = strokeWidth(1.5)
  context.setLineDash([5, 4])
  context.beginPath()
  for (let pixelX = 0; pixelX < width; pixelX++) {
    const xValue = (pixelX - centerX) / scaleX
    const yValue = Math.exp(xValue)
    const pixelY = centerY - yValue * scaleY
    if (pixelX === 0) context.moveTo(pixelX, pixelY)
    else context.lineTo(pixelX, pixelY)
  }
  context.stroke()
  context.setLineDash([])

  context.strokeStyle = '#38bdf8'
  context.lineWidth = strokeWidth(2)
  context.beginPath()
  for (let pixelX = 0; pixelX < width; pixelX++) {
    const xValue = (pixelX - centerX) / scaleX
    let approximation = 0
    for (let order = 0; order <= expansionOrder; order++) {
      approximation += xValue ** order / factorial(order)
    }
    const pixelY = centerY - approximation * scaleY
    if (pixelX === 0) context.moveTo(pixelX, pixelY)
    else context.lineTo(pixelX, pixelY)
  }
  context.stroke()
}

/** 向指定上下文绘制场景内容（不含视口变换） */
const drawSceneContent = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) => {
  switch (props.conceptId) {
    case 'jordan-stability':
      drawJordan(context, width, height)
      break
    case 'matrix-transform':
      drawMatrixTransform(context, width, height)
      break
    case 'taylor-series':
      drawTaylor(context, width, height)
      break
    default:
      drawAxes(context, width, height)
  }
}

/** 完整绘制：背景 + 视口变换 + 场景 */
const drawVisualization = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  const context = canvas.getContext('2d')
  if (!context) return

  const width = canvas.clientWidth
  const height = canvas.clientHeight
  const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2)

  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
  context.clearRect(0, 0, width, height)
  context.fillStyle = '#020617'
  context.fillRect(0, 0, width, height)

  context.save()
  applyViewTransform(context)
  drawSceneContent(context, width, height)
  context.restore()
}

/** 以指针位置为中心缩放 */
const handleWheel = (event: WheelEvent) => {
  event.preventDefault()
  const canvas = canvasRef.value
  if (!canvas) return

  const boundingRect = canvas.getBoundingClientRect()
  const pointerX = event.clientX - boundingRect.left
  const pointerY = event.clientY - boundingRect.top

  const zoomFactor = event.deltaY < 0 ? 1.12 : 1 / 1.12
  const previousScale = viewScale.value
  const nextScale = Math.min(
    MAX_VIEW_SCALE,
    Math.max(MIN_VIEW_SCALE, previousScale * zoomFactor),
  )

  if (nextScale === previousScale) return

  const scaleRatio = nextScale / previousScale
  viewOffsetX.value = pointerX - (pointerX - viewOffsetX.value) * scaleRatio
  viewOffsetY.value = pointerY - (pointerY - viewOffsetY.value) * scaleRatio
  viewScale.value = nextScale
  drawVisualization()
}

const handlePointerDown = (event: PointerEvent) => {
  if (event.button !== 0) return
  const canvas = canvasRef.value
  if (!canvas) return

  isDragging.value = true
  dragStartX.value = event.clientX
  dragStartY.value = event.clientY
  dragOriginOffsetX.value = viewOffsetX.value
  dragOriginOffsetY.value = viewOffsetY.value
  canvas.setPointerCapture(event.pointerId)
}

const handlePointerMove = (event: PointerEvent) => {
  if (!isDragging.value) return
  const deltaX = event.clientX - dragStartX.value
  const deltaY = event.clientY - dragStartY.value
  viewOffsetX.value = dragOriginOffsetX.value + deltaX
  viewOffsetY.value = dragOriginOffsetY.value + deltaY
  drawVisualization()
}

const handlePointerUp = (event: PointerEvent) => {
  if (!isDragging.value) return
  isDragging.value = false
  const canvas = canvasRef.value
  if (canvas?.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId)
  }
}

/** 高清导出当前视口为 PNG */
const exportAsImage = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const displayWidth = canvas.clientWidth
  const displayHeight = canvas.clientHeight
  const exportCanvas = document.createElement('canvas')
  exportCanvas.width = Math.floor(displayWidth * EXPORT_PIXEL_RATIO)
  exportCanvas.height = Math.floor(displayHeight * EXPORT_PIXEL_RATIO)

  const exportContext = exportCanvas.getContext('2d')
  if (!exportContext) return

  exportContext.setTransform(EXPORT_PIXEL_RATIO, 0, 0, EXPORT_PIXEL_RATIO, 0, 0)
  exportContext.fillStyle = '#020617'
  exportContext.fillRect(0, 0, displayWidth, displayHeight)

  exportContext.save()
  exportContext.translate(viewOffsetX.value, viewOffsetY.value)
  exportContext.scale(viewScale.value, viewScale.value)
  drawSceneContent(exportContext, displayWidth, displayHeight)
  exportContext.restore()

  const fileName = `mathviz-${props.conceptId}-${Date.now()}.png`
  exportCanvas.toBlob(
    (blob) => {
      if (!blob) return
      const objectUrl = URL.createObjectURL(blob)
      const anchorElement = document.createElement('a')
      anchorElement.href = objectUrl
      anchorElement.download = fileName
      anchorElement.click()
      URL.revokeObjectURL(objectUrl)
    },
    'image/png',
  )
}

watch(
  () => props.conceptId,
  () => {
    viewOffsetX.value = 0
    viewOffsetY.value = 0
    viewScale.value = 1
    drawVisualization()
  },
)

watch(
  () => [...props.paramValues],
  () => {
    drawVisualization()
  },
)

onMounted(() => {
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  const canvas = canvasRef.value
  if (canvas) {
    canvas.addEventListener('wheel', handleWheel, { passive: false })
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  const canvas = canvasRef.value
  if (canvas) {
    canvas.removeEventListener('wheel', handleWheel)
  }
})
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-[11px] text-slate-500">
        滚轮缩放 · 拖拽平移 · 当前
        <span class="font-mono text-sky-400/90">{{ zoomPercentLabel }}</span>
      </p>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="rounded-lg border border-slate-700/80 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
          @click="resetView"
        >
          重置视图
        </button>
        <button
          type="button"
          class="rounded-lg border border-sky-400/40 bg-sky-400/10 px-3 py-1.5 text-xs font-medium text-sky-300 transition hover:bg-sky-400/20"
          @click="exportAsImage"
        >
          导出为图片
        </button>
      </div>
    </div>

    <div
      ref="containerRef"
      class="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-950"
    >
      <canvas
        ref="canvasRef"
        class="block w-full touch-none select-none"
        :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @pointercancel="handlePointerUp"
        @pointerleave="handlePointerUp"
      />
    </div>
  </div>
</template>
