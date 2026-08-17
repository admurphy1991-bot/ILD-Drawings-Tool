import { useMarkupApp } from './hooks/useMarkupApp.js'
import ProjectsView from './components/ProjectsView.jsx'
import UploadView from './components/UploadView.jsx'
import WorkspaceView from './components/WorkspaceView.jsx'
import ReportView from './components/ReportView.jsx'

export default function App() {
  const vm = useMarkupApp()

  if (vm.loading) {
    return (
      <div style={centeredScreenStyle}>
        <div style={{ fontSize: 14, color: '#64748b' }}>Loading projects…</div>
      </div>
    )
  }

  if (vm.loadError) {
    return (
      <div style={centeredScreenStyle}>
        <div style={{ maxWidth: 360, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Couldn't load projects</div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>{vm.loadError}</div>
          <button onClick={() => window.location.reload()} style={primaryBtnStyle}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', fontFamily: "'Public Sans',sans-serif", background: '#eef0f3', color: '#0f172a', overflow: 'hidden' }}>
      <div className="no-print" style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: 0.2, flex: '0 0 auto' }}>Overlay</span>
          {vm.isProjects ? (
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Drawing Markup</span>
          ) : (
            <>
              <button onClick={vm.goToProjects} style={backLinkStyle}>← All Projects</button>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>·</span>
              <span style={projectNameStyle}>{vm.job.reportTitle}</span>
              {vm.saveStatusLabel && (
                <span style={{ fontSize: 11, color: vm.saveStatus === 'error' ? '#f87171' : '#94a3b8' }}>· {vm.saveStatusLabel}</span>
              )}
            </>
          )}
        </div>
        {vm.isWorkspace && (
          <button onClick={vm.goToReport} style={primaryBtnStyle}>Generate Report</button>
        )}
        {vm.isReport && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={vm.backToEditor} style={secondaryBtnStyle}>Back to Editor</button>
            <button onClick={vm.printReport} style={primaryBtnStyle}>Print / Save PDF</button>
          </div>
        )}
      </div>

      <input
        type="file"
        accept="image/*,application/pdf,.pdf"
        multiple
        ref={vm.fileInputRef}
        onChange={vm.onFilesSelected}
        style={{ display: 'none' }}
      />

      {vm.isProjects && <ProjectsView vm={vm} />}
      {vm.isUpload && <UploadView vm={vm} />}
      {vm.isWorkspace && <WorkspaceView vm={vm} />}
      {vm.isReport && <ReportView vm={vm} />}
    </div>
  )
}

const centeredScreenStyle = {
  height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: "'Public Sans',sans-serif", background: '#eef0f3', color: '#0f172a',
}
const headerStyle = {
  height: 56, flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '0 20px', background: '#0f172a', color: '#fff',
}
const primaryBtnStyle = { background: '#ea580c', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const secondaryBtnStyle = { background: 'transparent', color: '#e2e8f0', border: '1px solid #475569', padding: '9px 16px', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const backLinkStyle = { background: 'none', border: 'none', color: '#e2e8f0', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0, flex: '0 0 auto' }
const projectNameStyle = { fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
