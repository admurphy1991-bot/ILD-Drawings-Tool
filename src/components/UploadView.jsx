export default function UploadView({ vm }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: 40 }}>
      <div style={{ width: '100%', maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, margin: '0 0 6px' }}>Upload drawing pages</h1>
          <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>
            Add one or more high-resolution construction drawing pages (PDF, PNG, or JPG). Multi-page PDFs are split
            into one page per sheet automatically. You'll set the scale and mark up each page next.
          </p>
        </div>

        <Dropzone vm={vm} />

        {vm.hasPages && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {vm.uploadPages.map((pg) => (
              <div key={pg.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 12px' }}>
                <img src={pg.img} loading="lazy" style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 3, flex: '0 0 auto' }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{pg.name}</span>
                <button onClick={pg.onRemove} style={removeBtnStyle}>×</button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={vm.goToWorkspace}
          disabled={!vm.hasPages}
          style={{ ...continueBtnStyle, ...(vm.hasPages ? {} : continueBtnDisabledStyle) }}
        >
          Continue to Markup
        </button>
      </div>
    </div>
  )
}

function Dropzone({ vm }) {
  return (
    <div
      onClick={vm.triggerFilePicker}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); vm.onFilesDropped(e) }}
      style={dropzoneStyle}
    >
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{vm.dropzoneLabel}</div>
      <div style={{ fontSize: 12, color: '#94a3b8' }}>or drag and drop image files here</div>
    </div>
  )
}

const dropzoneStyle = {
  border: '2px dashed #cbd5e1', borderRadius: 8, padding: 36, textAlign: 'center', cursor: 'pointer', background: '#fff',
}
const removeBtnStyle = { background: 'none', border: 'none', color: '#94a3b8', fontSize: 16, cursor: 'pointer', lineHeight: 1 }
const continueBtnStyle = {
  alignSelf: 'flex-start', background: '#ea580c', color: '#fff', border: 'none', padding: '11px 22px',
  borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: 'pointer',
}
const continueBtnDisabledStyle = { opacity: 0.4, cursor: 'not-allowed', background: '#94a3b8' }
