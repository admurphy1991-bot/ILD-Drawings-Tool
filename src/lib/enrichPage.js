import { polylineLen, polyArea, centroid, buildPathD } from './geometry.js'

export const COLORS = { line: '#2563eb', area: '#39ff14', point: '#dc2626', concern: '#0891b2', text: '#334155' }
export const SUBSTRATE_COLORS = { Plywood: '#ccff00', Concrete: '#00e5ff', 'Warm Roof': '#ff3c00', 'Not Tested': '#a855f7' }

const BLANK_IMG = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7'

export function blankPage() {
  return { naturalW: 3, naturalH: 2, annotations: [], scale: null, img: BLANK_IMG }
}

/** Mirrors the prototype's Component#enrichPage exactly, plus onEdit/onDelete/
 *  onAddExclusion/onClearExclusions callbacks are injected by the caller via `handlers`
 *  (annId => void) since this is a pure function, not a class method. */
export function enrichPage(page, handlers = {}) {
  const { onEdit, onDelete, onAddExclusion, onClearExclusions } = handlers
  // Demonstrate-only pages never measure, even if they carry a stale calibration
  // from before the page was switched into demo mode.
  const ppu = !page.demoMode && page.scale ? page.scale.ppu : null
  const vbW = 1000
  const vbH = page.naturalW ? Math.round((1000 * page.naturalH) / page.naturalW) : 700
  const counters = { line: 0, area: 0, point: 0, concern: 0, text: 0 }
  const breachStart = parseInt(page.breachStartNumber, 10) || 1

  const annotations = (page.annotations || []).map((a) => {
    let labelX = 0, labelY = 0, valueLabel = '', markerLabel = '', pointsStr = ''
    if (a.type === 'line') {
      counters.line++
      markerLabel = 'L' + counters.line
      pointsStr = a.points.map((p) => p.x + ',' + p.y).join(' ')
      const mid = a.points[Math.floor((a.points.length - 1) / 2)]
      labelX = mid.x
      labelY = mid.y - 14
    }
    let netAreaUnits = 0, tailX = 0, tailY = 0, svgLabel = ''
    let crossX1 = 0, crossY1 = 0, crossX2 = 0, crossY2 = 0, crossX3 = 0, crossY3 = 0, crossX4 = 0, crossY4 = 0
    if (a.type === 'area') {
      counters.area++
      markerLabel = 'A' + counters.area
      pointsStr = a.points.map((p) => p.x + ',' + p.y).join(' ')
      const outerArea = polyArea(a.points)
      const holesArea = (a.holes || []).reduce((s, h) => s + polyArea(h), 0)
      netAreaUnits = Math.max(0, outerArea - holesArea)
      const areaStr = ppu ? (netAreaUnits / (ppu * ppu)).toFixed(2) + ' m²' : ''
      valueLabel = (areaStr ? areaStr + ' · ' : '') + (a.substrate || 'Substrate not set')
      const c = centroid(a.points)
      labelX = c.x
      labelY = c.y
      svgLabel = markerLabel + ' · ' + (areaStr || (a.substrate || 'Substrate not set'))
    } else if (a.type === 'point' || a.type === 'concern') {
      if (a.type === 'concern') {
        counters.concern++
        markerLabel = '#' + counters.concern
        valueLabel = a.note || 'No notes yet'
      } else {
        const qty = Math.max(1, parseInt(a.qty, 10) || 1)
        const firstNum = breachStart + counters.point
        const lastNum = firstNum + qty - 1
        counters.point += qty
        markerLabel = qty > 1 ? `B${firstNum}-${lastNum}` : `B${firstNum}`
        valueLabel = (qty > 1 ? `×${qty} · ` : '') + (a.note || 'No notes yet')
      }
      labelX = a.points[0].x
      labelY = a.points[0].y
      let tailDx = 30, tailDy = -30
      if (labelX + tailDx > vbW - 20) tailDx = -30
      if (labelY + tailDy < 20) tailDy = 30
      tailX = labelX + tailDx
      tailY = labelY + tailDy
      const cs = 3.5
      crossX1 = labelX - cs; crossY1 = labelY - cs; crossX2 = labelX + cs; crossY2 = labelY + cs
      crossX3 = labelX - cs; crossY3 = labelY + cs; crossX4 = labelX + cs; crossY4 = labelY - cs
    } else if (a.type === 'text') {
      counters.text++
      markerLabel = 'T' + counters.text
      labelX = a.points[0].x
      labelY = a.points[0].y
      valueLabel = a.label || ''
    }
    if (a.type === 'line') {
      const areaLenLabel = ppu ? (polylineLen(a.points) / ppu).toFixed(2) + ' m' : ''
      valueLabel = areaLenLabel || '—'
      svgLabel = areaLenLabel ? markerLabel + ' · ' + areaLenLabel : markerLabel
    }
    return {
      ...a,
      isLine: a.type === 'line', isArea: a.type === 'area', isPoint: a.type === 'point', isText: a.type === 'text',
      isConcern: a.type === 'concern', isMarker: a.type === 'point' || a.type === 'concern',
      isEditable: a.type === 'point' || a.type === 'concern' || a.type === 'text' || a.type === 'area',
      pointsStr, valueLabel, markerLabel, labelX, labelY, svgLabel, tailX, tailY, netAreaUnits,
      crossX1, crossY1, crossX2, crossY2, crossX3, crossY3, crossX4, crossY4,
      color: a.type === 'area' ? (SUBSTRATE_COLORS[a.substrate] || COLORS.area) : COLORS[a.type],
      leftPct: (labelX / vbW) * 100 + '%', topPct: (labelY / vbH) * 100 + '%',
      hasPhoto: !!a.photo, photo: a.photo,
      typeLabel: a.type === 'line' ? 'Line' : a.type === 'area' ? 'Area' : a.type === 'point' ? 'Breach' : a.type === 'concern' ? 'Area of concern' : 'Label',
      onEdit: onEdit ? () => onEdit(a) : undefined,
      onDelete: onDelete ? () => onDelete(a.id) : undefined,
      pathD: a.type === 'area' ? buildPathD(a.points, a.holes || []) : null,
      holesCount: (a.holes || []).length, hasHoles: (a.holes || []).length > 0,
      holesEnriched: (a.holes || []).map((h) => ({ pointsStr: h.map((p) => p.x + ',' + p.y).join(' ') })),
      onAddExclusion: onAddExclusion ? () => onAddExclusion(a.id) : undefined,
      onClearExclusions: onClearExclusions ? () => onClearExclusions(a.id) : undefined,
    }
  })

  const totalLength = annotations.filter((a) => a.isLine).reduce((s, a) => s + (ppu ? polylineLen(a.points) / ppu : 0), 0)
  const totalArea = annotations.filter((a) => a.isArea).reduce((s, a) => s + (ppu ? a.netAreaUnits / (ppu * ppu) : 0), 0)
  const untestedArea = annotations
    .filter((a) => a.isArea && a.substrate === 'Not Tested')
    .reduce((s, a) => s + (ppu ? a.netAreaUnits / (ppu * ppu) : 0), 0)
  const breachCount = counters.point
  const usedSubstrates = [...new Set(annotations.filter((a) => a.isArea).map((a) => a.substrate || 'Not set'))]
  const markupColours = usedSubstrates.map((s) => ({ label: s, color: SUBSTRATE_COLORS[s] || COLORS.area }))
  const symbolKeyItems = []
  if (annotations.some((a) => a.isLine)) symbolKeyItems.push({ shape: 'line', color: COLORS.line, label: 'Measured run' })
  if (annotations.some((a) => a.isPoint)) symbolKeyItems.push({ shape: 'point', color: COLORS.point, label: 'Breach' })
  if (annotations.some((a) => a.isConcern)) symbolKeyItems.push({ shape: 'point', color: COLORS.concern, label: 'Area of concern' })
  if (annotations.some((a) => a.isText)) symbolKeyItems.push({ shape: 'text', color: COLORS.text, label: 'Callout' })

  const concerns = annotations.filter((a) => a.isConcern)

  return {
    ...page,
    annotations,
    viewBoxStr: `0 0 ${vbW} ${vbH}`, vbW, vbH,
    aspectRatio: `${page.naturalW || 3} / ${page.naturalH || 2}`,
    hasScale: !!page.scale, hasAnnotations: annotations.length > 0,
    totalLength, totalArea, untestedArea, breachCount,
    totalLengthLabel: totalLength.toFixed(2) + ' m', totalAreaLabel: totalArea.toFixed(2) + ' m²',
    untestedAreaLabel: untestedArea.toFixed(2) + ' m²',
    scaleLabel: page.scale ? `Calibrated · ${page.scale.value} m reference` : 'Not calibrated',
    measurements: annotations.filter((a) => a.isLine || a.isArea),
    hasMeasurements: annotations.some((a) => a.isLine || a.isArea),
    breaches: annotations.filter((a) => a.isPoint),
    hasBreaches: annotations.some((a) => a.isPoint),
    concerns, hasConcerns: concerns.length > 0, concernCount: concerns.length,
    markupColours, symbolKeyItems, hasMarkupColours: markupColours.length > 0, hasSymbolKey: symbolKeyItems.length > 0,
    hasImg: !!page.img, demoMode: !!page.demoMode,
  }
}
