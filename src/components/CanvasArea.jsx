import AnnotationLayer from './AnnotationLayer.jsx'

export default function CanvasArea({ vm }) {
  const pg = vm.activePageEnriched

  return (
    <div
      ref={vm.canvasScrollRef}
      onMouseDown={vm.onCanvasMouseDown}
      style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'auto', padding: 24, background: '#dfe3e8', cursor: vm.containerCursor }}
    >
      <div style={instructionPillStyle}>
        <span>{vm.instructionText}</span>
        {vm.draftActive && (
          <>
            <button onClick={vm.finishDraft} disabled={!vm.draftCanFinish} style={{ ...finishBtnStyle, ...(vm.draftCanFinish ? {} : { opacity: 0.4, cursor: 'not-allowed' }) }}>Finish</button>
            <button onClick={vm.cancelDraft} style={cancelBtnStyle}>Cancel</button>
          </>
        )}
      </div>

      <div style={zoomPillStyle}>
        <button onClick={vm.zoomOut} style={zoomBtnStyle}>−</button>
        <span onClick={vm.resetZoom} style={zoomLabelStyle}>{vm.zoomPct}</span>
        <button onClick={vm.zoomIn} style={zoomBtnStyle}>+</button>
      </div>

      <div style={{ position: 'relative', width: vm.canvasWidthPx, maxWidth: 'none', aspectRatio: pg.aspectRatio, background: '#fff', boxShadow: '0 2px 14px rgba(0,0,0,0.15)', flex: '0 0 auto', margin: 'auto' }}>
        <svg
          ref={vm.svgRef}
          viewBox={pg.viewBoxStr}
          onClick={vm.onSvgClick}
          onMouseMove={vm.onSvgMouseMove}
          onDoubleClick={vm.onSvgDoubleClick}
          style={{ width: '100%', height: '100%', display: 'block', cursor: vm.canvasCursor }}
        >
          {vm.hasActiveImg && <image href={pg.img} x="0" y="0" width={pg.vbW} height={pg.vbH} />}

          <AnnotationLayer annotations={pg.annotations} showBreachNumbers={vm.showBreachNumbers} markerId="breachArrow" />

          {vm.draftActive && (
            <>
              {vm.draftIsClosedShape ? (
                vm.draftIsExclude ? (
                  <polygon points={vm.draftPreviewPts} style={{ fill: '#94a3b8', fillOpacity: 0.3, stroke: '#475569', strokeWidth: 3, strokeDasharray: '6 5' }} />
                ) : (
                  <polygon points={vm.draftPreviewPts} style={{ fill: '#16a34a', fillOpacity: 0.15, stroke: '#16a34a', strokeWidth: 3, strokeDasharray: '8 6' }} />
                )
              ) : (
                <polyline points={vm.draftPreviewPts} style={{ fill: 'none', stroke: '#2563eb', strokeWidth: 3, strokeDasharray: '8 6' }} />
              )}
              {vm.draftNearStart && (
                <circle cx={vm.draftStartPoint.x} cy={vm.draftStartPoint.y} r="14" style={{ fill: 'none', stroke: '#16a34a', strokeWidth: 4 }} />
              )}
            </>
          )}

          {vm.calibActive && (
            <>
              <circle cx={vm.calibFirstPoint.x} cy={vm.calibFirstPoint.y} r="7" style={{ fill: '#ea580c', stroke: '#fff', strokeWidth: 2 }} />
              <polyline points={vm.calibLinePts} style={{ stroke: '#ea580c', strokeWidth: 3, strokeDasharray: '6 6' }} />
            </>
          )}

          {vm.calibInputActive && (
            <polyline points={vm.calibInputLinePts} style={{ stroke: '#ea580c', strokeWidth: 3 }} />
          )}
        </svg>

        {vm.calibInputActive && (
          <div style={{ position: 'absolute', left: vm.calibInputLeftPct, top: vm.calibInputTopPct, transform: 'translate(-50%,-115%)', ...popoverStyle, minWidth: 220 }}>
            <div style={popoverTitleStyle}>Real-world distance</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
              <input type="number" step="0.01" placeholder="e.g. 9" value={vm.calibInput.value} onChange={vm.onCalibValueChange} style={numInputStyle} />
              <span style={{ fontSize: 13, color: '#475569' }}>meters</span>
            </div>
            <div style={popoverActionsStyle}>
              <button onClick={vm.cancelCalibInput} style={popoverCancelBtnStyle}>Cancel</button>
              <button onClick={vm.confirmCalibration} style={popoverSaveBtnStyle}>Set Scale</button>
            </div>
          </div>
        )}

        {vm.formActive && (
          <div style={{ position: 'absolute', left: vm.formLeftPct, top: vm.formTopPct, transform: 'translate(-50%,-112%)', ...popoverStyle, minWidth: 240 }}>
            <div style={popoverTitleStyle}>{vm.formTitle}</div>
            {vm.formIsSubstrate ? (
              <select value={vm.activeForm.value} onChange={vm.onFormValueChange} style={selectStyle}>
                <option value="">Select type…</option>
                <option value="Plywood">Plywood</option>
                <option value="Concrete">Concrete</option>
                <option value="Warm Roof">Warm Roof</option>
                <option value="Not Tested">Not Tested</option>
              </select>
            ) : (
              <>
                {vm.formIsBreachNote && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <label style={{ fontSize: 12, color: '#475569' }}>Number of breaches here</label>
                    <input type="number" min="1" value={vm.activeForm.qty ?? 1} onChange={vm.onFormQtyChange} style={qtyInputStyle} />
                  </div>
                )}
                <textarea value={vm.activeForm.value} onChange={vm.onFormValueChange} placeholder={vm.formPlaceholder} rows={3} style={textareaStyle} />
              </>
            )}
            <div style={popoverActionsStyle}>
              <button onClick={vm.cancelForm} style={popoverCancelBtnStyle}>Cancel</button>
              <button onClick={vm.saveForm} style={popoverSaveBtnStyle}>Save</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const instructionPillStyle = {
  position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 15,
  background: '#0f172a', color: '#e2e8f0', fontSize: 12, padding: '8px 14px', borderRadius: 20,
  display: 'flex', alignItems: 'center', gap: 12, maxWidth: '80%', boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
}
const finishBtnStyle = { background: '#16a34a', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, cursor: 'pointer' }
const cancelBtnStyle = { background: 'transparent', color: '#f87171', border: '1px solid #f87171', padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, cursor: 'pointer' }
const zoomPillStyle = {
  position: 'absolute', bottom: 16, right: 16, zIndex: 15, background: '#0f172a', color: '#e2e8f0',
  borderRadius: 20, display: 'flex', alignItems: 'center', gap: 2, padding: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
}
const zoomBtnStyle = { background: 'transparent', border: 'none', color: '#e2e8f0', width: 28, height: 28, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }
const zoomLabelStyle = { fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, width: 44, textAlign: 'center', cursor: 'pointer' }
const popoverStyle = { background: '#fff', borderRadius: 6, boxShadow: '0 6px 20px rgba(0,0,0,0.25)', padding: 14, zIndex: 20 }
const popoverTitleStyle = { fontSize: 12, fontWeight: 600, marginBottom: 8 }
const popoverActionsStyle = { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }
const popoverCancelBtnStyle = { background: 'transparent', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }
const popoverSaveBtnStyle = { background: '#ea580c', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }
const numInputStyle = { width: 90, padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }
const qtyInputStyle = { width: 56, padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }
const selectStyle = { width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13, fontFamily: 'inherit', background: '#fff' }
const textareaStyle = { width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }
