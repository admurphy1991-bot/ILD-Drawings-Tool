export function polylineLen(points) {
  let d = 0
  for (let i = 1; i < points.length; i++) {
    d += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
  }
  return d
}

export function polyArea(points) {
  let s = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    s += points[i].x * points[j].y - points[j].x * points[i].y
  }
  return Math.abs(s) / 2
}

export function centroid(points) {
  let x = 0, y = 0
  points.forEach((p) => { x += p.x; y += p.y })
  return { x: x / points.length, y: y / points.length }
}

export function buildPathD(outer, holes) {
  const ring = (pts) => 'M ' + pts.map((p) => `${p.x},${p.y}`).join(' L ') + ' Z'
  return ring(outer) + ' ' + (holes || []).map(ring).join(' ')
}

export function dist(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}
