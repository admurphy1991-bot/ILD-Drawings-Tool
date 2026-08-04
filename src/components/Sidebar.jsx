export default function Sidebar({ vm }) {
  const pg = vm.activePageEnriched
  return (
    <div style={{ width: 300, flex: '0 0 auto', background: '#fff', borderLeft: '1px solid #e2e8f0', overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={sectionLabelStyle}>Job details</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input value={vm.job.clientName} onChange={(e) => vm.updateJob('clientName', e.target.value)} placeholder="Client name" style={inputStyle} />
          <input value={vm.job.address} onChange={(e) => vm.updateJob('address', e.target.value)} placeholder="Site address" style={inputStyle} />
          <input value={vm.job.reportTitle} onChange={(e) => vm.updateJob('reportTitle', e.target.value)} placeholder="Report title" style={inputStyle} />
          <input value={vm.job.company} onChange={(e) => vm.updateJob('company', e.target.value)} placeholder="Your company name" style={inputStyle} />
          <input value={vm.job.date} onChange={(e) => vm.updateJob('date', e.target.value)} placeholder="Date" style={inputStyle} />
        </div>
      </div>

      <div>
        <div style={sectionLabelStyle}>This page</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <StatCard label="Length" value={pg.totalLengthLabel} />
          <StatCard label="Area" value={pg.totalAreaLabel} />
          <StatCard label="Breaches flagged" value={pg.breachCount} span2 />
        </div>
      </div>

      {vm.hasAreaAnnotations && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px' }}>
          {vm.substrateLegend.map((leg) => (
            <div key={leg.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: leg.color }} />
              <span style={{ fontSize: 11, color: '#64748b' }}>{leg.label}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: 1 }}>
        <div style={sectionLabelStyle}>Annotations</div>
        {pg.hasAnnotations ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {pg.annotations.map((ann) => (
              <div key={ann.id}>
                <div style={annRowStyle}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: ann.color, flex: '0 0 auto' }} />
                  <span style={annMarkerStyle}>{ann.markerLabel}</span>
                  <span style={annValueStyle}>{ann.valueLabel}</span>
                  {ann.isEditable && <button onClick={ann.onEdit} style={editLinkStyle}>Edit</button>}
                  <button onClick={ann.onDelete} style={deleteLinkStyle}>×</button>
                </div>
                {ann.isArea && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 0 8px 18px' }}>
                    <button onClick={ann.onAddExclusion} style={exclLinkStyle}>+ Exclude untestable area</button>
                    {ann.hasHoles && (
                      <>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>· {ann.holesCount} excluded</span>
                        <button onClick={ann.onClearExclusions} style={exclClearStyle}>Clear</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#94a3b8' }}>No annotations on this page yet.</div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, span2 }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '8px 10px', ...(span2 ? { gridColumn: 'span 2' } : {}) }}>
      <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 15, fontWeight: 600 }}>{value}</div>
    </div>
  )
}

const sectionLabelStyle = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: '#94a3b8', marginBottom: 10 }
const inputStyle = { padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 13 }
const annRowStyle = { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }
const annMarkerStyle = { fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 700, color: '#475569', flex: '0 0 auto' }
const annValueStyle = { flex: 1, fontSize: 12, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const editLinkStyle = { background: 'none', border: 'none', color: '#2563eb', fontSize: 11, cursor: 'pointer', padding: 2 }
const deleteLinkStyle = { background: 'none', border: 'none', color: '#cbd5e1', fontSize: 15, cursor: 'pointer', lineHeight: 1, padding: 2 }
const exclLinkStyle = { background: 'none', border: 'none', color: '#64748b', fontSize: 11, cursor: 'pointer', padding: 2 }
const exclClearStyle = { background: 'none', border: 'none', color: '#dc2626', fontSize: 11, cursor: 'pointer', padding: 2 }
