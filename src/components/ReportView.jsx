import './report.css'
import AnnotationLayer from './AnnotationLayer.jsx'

export default function ReportView({ vm }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <PageSelector vm={vm} />
      <div className="report-container" style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {vm.selectedReportPages.map((pg, i) => (
          <DrawingPage key={pg.id} pg={pg} job={vm.job} reportYear={vm.reportYear} showBreachNumbers={vm.showBreachNumbers} markerId={`breachArrowReport${i}`} />
        ))}
        <SummaryPage vm={vm} />
      </div>
    </div>
  )
}

function PageSelector({ vm }) {
  if (vm.pageSelection.length <= 1) return null
  return (
    <div className="no-print" style={selectorBarStyle}>
      <span style={selectorLabelStyle}>Include pages:</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
        {vm.pageSelection.map((p) => (
          <label key={p.id} style={pageCheckStyle}>
            <input type="checkbox" checked={p.included} onChange={p.onToggle} />
            <span>{p.name}</span>
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginLeft: 8 }}>
        <button onClick={vm.selectAllReportPages} style={selectorLinkStyle}>All</button>
        <button onClick={vm.selectNoReportPages} style={selectorLinkStyle}>None</button>
      </div>
      <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8', flex: '0 0 auto' }}>Summary page is always included</span>
    </div>
  )
}

function DrawingPage({ pg, job, reportYear, showBreachNumbers, markerId }) {
  return (
    <section className="report-page" style={{ padding: 14 }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', border: '1px solid #94a3b8', marginBottom: 8 }}>
        <svg viewBox={pg.viewBoxStr} style={{ width: '100%', height: '100%', display: 'block' }}>
          {pg.hasImg && <image href={pg.img} x="0" y="0" width={pg.vbW} height={pg.vbH} />}
          <AnnotationLayer annotations={pg.annotations} showBreachNumbers={showBreachNumbers} markerId={markerId} />
        </svg>
      </div>

      <div style={{ flex: '0 0 auto', border: '1px solid #0f172a', fontSize: 9, color: '#0f172a' }}>
        <div style={{ display: 'flex' }}>
          <div style={{ ...colStyle, flex: 1.1 }}>
            <div style={colHeadStyle}>Client:</div>
            <div>{job.clientName}</div>
            <div>{job.address}</div>
          </div>
          <div style={{ ...colStyle, flex: 1 }}>
            <div style={colHeadStyle}>Project:</div>
            <div>{job.reportTitle}</div>
          </div>
          <div style={{ ...colStyle, flex: 1 }}>
            <div style={colHeadStyle}>Drawing:</div>
            <div>{pg.name}</div>
            <div style={{ color: '#64748b' }}>{pg.scaleLabel}</div>
          </div>
          <div style={{ ...colStyle, flex: 1.1 }}>
            <div style={colHeadStyle}>Markup Colours:</div>
            {pg.hasMarkupColours && pg.markupColours.map((mc) => (
              <div key={mc.label} style={swatchRowStyle}>
                <span style={{ width: 22, height: 10, background: mc.color, border: '1px solid #0f172a', flex: '0 0 auto' }} />
                <span>{mc.label}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '6px 8px', borderRight: '1px solid #0f172a', flex: 1.3 }}>
            <div style={colHeadStyle}>Symbol Key:</div>
            {pg.hasSymbolKey && pg.symbolKeyItems.map((sym) => (
              <div key={sym.label} style={swatchRowStyle}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: sym.color, flex: '0 0 auto' }} />
                <span>{sym.label}</span>
              </div>
            ))}
          </div>
          <div style={{ flex: 1.2, padding: '6px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <div style={{ width: 80, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/assets/ild-logo.jpeg" alt="ILD logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ fontWeight: 700, textAlign: 'center' }}>{job.company}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #0f172a', padding: '4px 8px', fontSize: 8 }}>
          <span>{reportYear}</span>
          <span style={{ fontStyle: 'italic', color: '#64748b' }}>
            This drawing is the property of {job.company} and may not be reproduced without consent.
          </span>
          <span style={{ fontWeight: 700 }}>NOT TO SCALE</span>
        </div>
      </div>
    </section>
  )
}

function SummaryPage({ vm }) {
  return (
    <section className="report-page" style={{ padding: 24 }}>
      <h1 style={{ fontSize: 26, margin: '0 0 4px' }}>{vm.job.reportTitle}</h1>
      <p style={{ fontSize: 13, color: '#475569', margin: '0 0 20px' }}>Prepared for {vm.reportSubtitle}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        <SummaryStat label="Pages" value={vm.pageCount} />
        <SummaryStat label="Total length" value={vm.overallLengthLabel} />
        <SummaryStat label="Total area" value={vm.overallAreaLabel} />
        <SummaryStat label="Breaches flagged" value={vm.overallBreach} />
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {vm.selectedReportPages.map((pg) => (
          <div key={pg.id} style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, margin: '0 0 6px' }}>{pg.name}</h2>
            {pg.hasMeasurements && (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10, fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #0f172a' }}>
                    <th style={thStyle}>Marker</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Measurement</th>
                  </tr>
                </thead>
                <tbody>
                  {pg.measurements.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ ...tdStyle, fontFamily: "'IBM Plex Mono',monospace" }}>{m.markerLabel}</td>
                      <td style={tdStyle}>{m.typeLabel}</td>
                      <td style={{ ...tdStyle, fontFamily: "'IBM Plex Mono',monospace" }}>{m.valueLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {pg.hasBreaches && pg.breaches.map((b) => (
              <div key={b.id} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: b.color, color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>{b.markerLabel}</div>
                <div style={{ flex: 1, fontSize: 11, color: '#334155' }}>{b.valueLabel}</div>
                {b.hasPhoto && <img src={b.photo} loading="lazy" style={{ width: 52, height: 40, objectFit: 'cover', borderRadius: 3 }} />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

function SummaryStat({ label, value }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: 12 }}>
      <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 20, fontWeight: 600 }}>{value}</div>
    </div>
  )
}

const colStyle = { padding: '6px 8px', borderRight: '1px solid #0f172a' }
const colHeadStyle = { fontWeight: 700, marginBottom: 3 }
const swatchRowStyle = { display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }
const thStyle = { textAlign: 'left', padding: '5px 4px' }
const tdStyle = { padding: '5px 4px' }
const selectorBarStyle = {
  flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
  padding: '10px 20px', background: '#fff', borderBottom: '1px solid #e2e8f0', fontSize: 12,
}
const selectorLabelStyle = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: '#94a3b8', flex: '0 0 auto' }
const pageCheckStyle = { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#334155', cursor: 'pointer' }
const selectorLinkStyle = { background: 'none', border: 'none', color: '#2563eb', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }
