import CanvasArea from './CanvasArea.jsx'
import Sidebar from './Sidebar.jsx'

export default function WorkspaceView({ vm }) {
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <ToolRail vm={vm} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <PageTabsBar vm={vm} />
        <ModeBar vm={vm} />

        {!vm.hasScale && !vm.activePageEnriched.demoMode && (
          <div style={warningBannerStyle}>
            Calibrate the scale on this page before drawing lines, areas, or points — or switch to "Demonstrate only"
            to mark up without measuring.
          </div>
        )}

        <CanvasArea vm={vm} />
      </div>

      <Sidebar vm={vm} />
    </div>
  )
}

function ToolRail({ vm }) {
  return (
    <div style={{ width: 96, flex: '0 0 auto', background: '#0f172a', display: 'flex', flexDirection: 'column', padding: '12px 0', gap: 2 }}>
      {vm.toolButtons.map((tool) => (
        <button
          key={tool.id}
          onClick={tool.onClick}
          disabled={tool.disabled}
          style={{ ...toolBtnStyle, background: tool.active ? '#1e293b' : 'transparent', ...(tool.disabled ? { opacity: 0.3, cursor: 'not-allowed' } : {}) }}
        >
          <span style={{ width: 14, height: 14, borderRadius: '50%', background: tool.color, border: '2px solid #fff' }} />
          <span style={{ fontSize: 11, fontWeight: 600, textAlign: 'center' }}>{tool.label}</span>
        </button>
      ))}
    </div>
  )
}

function PageTabsBar({ vm }) {
  return (
    <div style={{ height: 56, flex: '0 0 auto', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', overflowX: 'auto' }}>
      {vm.pageTabs.map((pg) => (
        <button
          key={pg.id}
          onClick={pg.onSelect}
          style={{ ...pageTabStyle, background: pg.active ? '#fff7ed' : '#fff', border: `1px solid ${pg.active ? '#ea580c' : '#e2e8f0'}` }}
        >
          <img src={pg.img} loading="lazy" style={{ width: 36, height: 26, objectFit: 'cover', borderRadius: 2 }} />
          <span style={pageTabNameStyle}>{pg.name}</span>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: pg.hasScale ? '#16a34a' : '#cbd5e1' }} />
        </button>
      ))}
      <button onClick={vm.triggerFilePicker} style={addPageBtnStyle}>+ Add page</button>
      <button onClick={vm.undo} disabled={!vm.canUndo} style={{ ...undoBtnStyle, ...(vm.canUndo ? {} : { opacity: 0.35, cursor: 'not-allowed' }) }}>Undo</button>
    </div>
  )
}

function ModeBar({ vm }) {
  const demo = vm.activePageEnriched.demoMode
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 12 }}>
      <span style={{ color: '#64748b' }}>Page mode:</span>
      <button onClick={vm.setMeasureMode} style={{ ...modePillLeftStyle, background: !demo ? '#0f172a' : '#fff', color: !demo ? '#fff' : '#475569' }}>Measure</button>
      <button onClick={vm.setDemoModeOn} style={{ ...modePillRightStyle, background: demo ? '#0f172a' : '#fff', color: demo ? '#fff' : '#475569' }}>Demonstrate only</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
        <span style={{ color: '#64748b' }}>Start breach numbering at:</span>
        <input type="number" min="1" value={vm.breachStartValue} onChange={vm.onBreachStartChange} style={breachInputStyle} />
      </div>
    </div>
  )
}

const toolBtnStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, border: 'none', padding: '12px 4px', cursor: 'pointer', color: '#e2e8f0' }
const pageTabStyle = { display: 'flex', alignItems: 'center', gap: 8, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', flex: '0 0 auto' }
const pageTabNameStyle = { fontSize: 12, fontWeight: 600, color: '#0f172a', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const addPageBtnStyle = { flex: '0 0 auto', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13, color: '#475569' }
const undoBtnStyle = { flex: '0 0 auto', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13, color: '#475569', marginLeft: 'auto' }
const modePillLeftStyle = { border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '14px 0 0 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }
const modePillRightStyle = { border: '1px solid #cbd5e1', borderLeft: 'none', padding: '4px 10px', borderRadius: '0 14px 14px 0', fontSize: 11, fontWeight: 600, cursor: 'pointer' }
const breachInputStyle = { width: 56, padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }
const warningBannerStyle = { background: '#fff7ed', borderBottom: '1px solid #fed7aa', color: '#9a3412', fontSize: 13, padding: '8px 16px' }
