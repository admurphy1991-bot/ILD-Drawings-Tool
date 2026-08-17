/** Renders one enriched annotation (line/area/point/text) as SVG. Shared by
 *  the workspace canvas and the report pages so both stay visually identical. */
export default function AnnotationLayer({ annotations, showBreachNumbers, markerId }) {
  return (
    <>
      <defs>
        <marker id={markerId} markerWidth="4" markerHeight="4" refX="3.2" refY="1.6" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L3.2,1.6 L0,3.2 Z" style={{ fill: '#dc2626', fillOpacity: 0.8 }} />
        </marker>
      </defs>
      {annotations.map((ann) => (
        <g key={ann.id}>
          {ann.isLine && (
            <>
              <polyline points={ann.pointsStr} style={{ fill: 'none', stroke: ann.color, strokeWidth: 4, strokeLinecap: 'round', strokeLinejoin: 'round' }} />
              <foreignObject x={ann.labelX} y={ann.labelY} width="1" height="1" style={{ overflow: 'visible', pointerEvents: 'none' }}>
                <div style={labelStyle(ann.color, 16)}>{ann.svgLabel}</div>
              </foreignObject>
            </>
          )}
          {ann.isArea && (
            <>
              <path d={ann.pathD} style={{ fill: ann.color, fillOpacity: 0.18, stroke: 'none', fillRule: 'evenodd' }} />
              <polygon points={ann.pointsStr} style={{ fill: 'none', stroke: ann.color, strokeWidth: 3 }} />
              {ann.holesEnriched.map((hole, i) => (
                <polygon key={i} points={hole.pointsStr} style={{ fill: '#fff', fillOpacity: 0.6, stroke: '#64748b', strokeWidth: 2, strokeDasharray: '5 4' }} />
              ))}
            </>
          )}
          {ann.isPoint && (
            <>
              <line x1={ann.tailX} y1={ann.tailY} x2={ann.labelX} y2={ann.labelY} style={{ stroke: ann.color, strokeWidth: 1.2, strokeOpacity: 0.8 }} markerEnd={`url(#${markerId})`} />
              <line x1={ann.crossX1} y1={ann.crossY1} x2={ann.crossX2} y2={ann.crossY2} style={{ stroke: ann.color, strokeWidth: 1.4, strokeOpacity: 0.85, strokeLinecap: 'round' }} />
              <line x1={ann.crossX3} y1={ann.crossY3} x2={ann.crossX4} y2={ann.crossY4} style={{ stroke: ann.color, strokeWidth: 1.4, strokeOpacity: 0.85, strokeLinecap: 'round' }} />
              {showBreachNumbers && (
                <foreignObject x={ann.tailX} y={ann.tailY} width="1" height="1" style={{ overflow: 'visible', pointerEvents: 'none' }}>
                  <div style={{ ...labelStyle('#000', 15, 700), borderRadius: 10 }}>{ann.markerLabel}</div>
                </foreignObject>
              )}
            </>
          )}
          {ann.isText && (
            <foreignObject x={ann.labelX} y={ann.labelY} width="1" height="1" style={{ overflow: 'visible', pointerEvents: 'none' }}>
              <div style={labelStyle(ann.color, 18)}>{ann.valueLabel}</div>
            </foreignObject>
          )}
        </g>
      ))}
    </>
  )
}

function labelStyle(color, fontSize, weight = 600) {
  return {
    transform: 'translate(-50%,-50%)',
    whiteSpace: 'nowrap',
    font: `${weight} ${fontSize}px 'IBM Plex Mono',monospace`,
    color,
    background: '#fff',
    padding: '1px 6px',
    borderRadius: 3,
    boxShadow: '0 0 0 1px rgba(15,23,42,0.08)',
    display: 'inline-block',
  }
}
