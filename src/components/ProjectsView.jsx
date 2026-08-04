import { useState } from 'react'

export default function ProjectsView({ vm }) {
  const [showForm, setShowForm] = useState(vm.projectList.length === 0)
  const [reportTitle, setReportTitle] = useState('')
  const [clientName, setClientName] = useState('')
  const [address, setAddress] = useState('')

  function submit() {
    if (!reportTitle.trim()) return
    vm.createProject({ reportTitle: reportTitle.trim(), clientName: clientName.trim(), address: address.trim() })
  }

  return (
    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', overflow: 'auto', padding: 40 }}>
      <div style={{ width: '100%', maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 24, margin: '0 0 6px' }}>Projects</h1>
            <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>
              Each project keeps its own drawings, annotations, and report — pick one to continue, or start a new one.
            </p>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)} style={newProjectBtnStyle}>+ New Project</button>
          )}
        </div>

        {showForm && (
          <div style={formCardStyle}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>New project</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>
              The project name doubles as the report title, so make it something you'd want a client to see.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Field label="Project / report name">
                <input autoFocus value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} placeholder="e.g. 42 Queen St — Reroof" style={inputStyle} />
              </Field>
              <Field label="Client name">
                <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client name" style={inputStyle} />
              </Field>
              <Field label="Site address">
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Site address" style={inputStyle} />
              </Field>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                onClick={submit}
                disabled={!reportTitle.trim()}
                style={{ ...createBtnStyle, ...(reportTitle.trim() ? {} : { opacity: 0.4, cursor: 'not-allowed' }) }}
              >
                Create project
              </button>
              {vm.projectList.length > 0 && (
                <button onClick={() => setShowForm(false)} style={cancelBtnStyle}>Cancel</button>
              )}
            </div>
          </div>
        )}

        {vm.projectList.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {vm.projectList.map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProjectCard({ p }) {
  return (
    <div style={cardStyle}>
      <button onClick={p.onSelect} style={cardMainStyle}>
        <div style={thumbWrapStyle}>
          {p.thumbnail ? (
            <img src={p.thumbnail} style={thumbImgStyle} />
          ) : (
            <span style={{ fontSize: 11, color: '#94a3b8' }}>No pages yet</span>
          )}
        </div>
        <div style={{ padding: '10px 12px' }}>
          <div style={cardTitleStyle}>{p.name}</div>
          {(p.clientName || p.address) && (
            <div style={cardSubStyle}>{[p.clientName, p.address].filter(Boolean).join(' · ')}</div>
          )}
          <div style={cardMetaStyle}>{p.pageCount} page{p.pageCount === 1 ? '' : 's'}</div>
        </div>
      </button>
      <button onClick={p.onDelete} style={deleteBtnStyle} title="Delete project">×</button>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</span>
      {children}
    </label>
  )
}

const newProjectBtnStyle = { flex: '0 0 auto', background: '#ea580c', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const formCardStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 18 }
const inputStyle = { padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13.5, fontFamily: 'inherit' }
const createBtnStyle = { background: '#ea580c', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const cancelBtnStyle = { background: 'transparent', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const cardStyle = { position: 'relative', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }
const cardMainStyle = { display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }
const thumbWrapStyle = { height: 110, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }
const thumbImgStyle = { width: '100%', height: '100%', objectFit: 'cover' }
const cardTitleStyle = { fontSize: 13.5, fontWeight: 700, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const cardSubStyle = { fontSize: 11.5, color: '#64748b', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const cardMetaStyle = { fontSize: 11, color: '#94a3b8' }
const deleteBtnStyle = { position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%', background: 'rgba(15,23,42,0.55)', color: '#fff', border: 'none', fontSize: 14, lineHeight: 1, cursor: 'pointer' }
