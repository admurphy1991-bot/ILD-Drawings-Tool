import { useRef, useState, useEffect } from 'react'
import { enrichPage, blankPage } from '../lib/enrichPage.js'
import { dist } from '../lib/geometry.js'
import { filesToPages } from '../lib/pdfPages.js'
import { uploadToBlob } from '../lib/blobUpload.js'
import {
  fetchProjects, createProjectApi, updateProjectApi, deleteProjectApi,
  newProjectId, defaultDateLabel,
} from '../lib/projectsApi.js'

const SHOW_BREACH_NUMBERS = true

function buildJob({ reportTitle, clientName, address } = {}) {
  return {
    clientName: clientName || '',
    address: address || '',
    reportTitle: reportTitle || 'Drawing Markup Report',
    company: 'ILD',
    date: defaultDateLabel(),
  }
}

export function useMarkupApp() {
  const svgRef = useRef(null)
  const fileInputRef = useRef(null)
  const canvasScrollRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [store, setStore] = useState({ projects: {} })
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [mode, setMode] = useState('projects')
  const [pages, setPages] = useState([])
  const [activePageIndex, setActivePageIndex] = useState(0)
  const [activeTool, setActiveTool] = useState('calibrate')
  const [draft, setDraft] = useState(null)
  const [excludeTarget, setExcludeTarget] = useState(null)
  const [calibDraft, setCalibDraft] = useState(null)
  const [calibInput, setCalibInput] = useState(null)
  const [activeForm, setActiveForm] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const [history, setHistory] = useState([])
  const [job, setJob] = useState(buildJob())
  const [saveStatus, setSaveStatus] = useState('idle')
  const [excludedReportPageIds, setExcludedReportPageIds] = useState(() => new Set())
  // Tracks in-flight "create project" requests so the autosave PUT below can wait
  // for the POST to land first, instead of racing it and 404ing on a row that
  // doesn't exist yet.
  const pendingCreatesRef = useRef({})

  // ── Initial load from the database ──────────────────────────────────────
  // Always lands on the Projects list — it never auto-resumes into whatever
  // project was open last.
  useEffect(() => {
    let cancelled = false
    fetchProjects()
      .then((list) => {
        if (cancelled) return
        const projects = {}
        for (const p of list) projects[p.id] = p
        setStore({ projects })
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || 'Failed to load projects')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  // ── Autosave (scoped to the active project, debounced) ──────────────────
  useEffect(() => {
    if (!activeProjectId || loading) return
    setStore((s) => {
      if (!s.projects[activeProjectId]) return s
      return {
        ...s,
        projects: {
          ...s.projects,
          [activeProjectId]: { ...s.projects[activeProjectId], pages, job, updatedAt: new Date().toISOString() },
        },
      }
    })
    setSaveStatus('saving')
    const timer = setTimeout(() => {
      const pendingCreate = pendingCreatesRef.current[activeProjectId] || Promise.resolve()
      pendingCreate
        .then(() => updateProjectApi(activeProjectId, { job, pages }))
        .then(() => setSaveStatus('saved'))
        .catch(() => setSaveStatus('error'))
    }, 800)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, job, activeProjectId, loading])

  function resetEditorState() {
    setActivePageIndex(0)
    setActiveTool('calibrate')
    setDraft(null)
    setCalibDraft(null)
    setCalibInput(null)
    setActiveForm(null)
    setExcludeTarget(null)
    setHistory([])
    setZoom(1)
    setExcludedReportPageIds(new Set())
  }

  // ── Projects ─────────────────────────────────────────────────────────────
  function createProject({ reportTitle, clientName, address }) {
    const id = newProjectId()
    const newJob = buildJob({ reportTitle, clientName, address })
    const project = { id, job: newJob, pages: [], updatedAt: new Date().toISOString() }
    setStore((s) => ({ ...s, projects: { ...s.projects, [id]: project } }))
    setActiveProjectId(id)
    setPages([])
    setJob(newJob)
    resetEditorState()
    setMode('upload')
    pendingCreatesRef.current[id] = createProjectApi({ id, job: newJob }).catch(() => setSaveStatus('error'))
  }

  function selectProject(id) {
    const project = store.projects[id]
    if (!project) return
    setActiveProjectId(id)
    setPages(project.pages)
    setJob(project.job)
    resetEditorState()
    setMode(project.pages.length ? 'workspace' : 'upload')
  }

  function goToProjects() {
    setMode('projects')
  }

  function deleteProject(id) {
    if (!window.confirm('Delete this project and all its drawings? This cannot be undone.')) return
    const remainingProjects = { ...store.projects }
    delete remainingProjects[id]
    setStore((s) => ({ ...s, projects: remainingProjects }))
    if (activeProjectId === id) {
      setActiveProjectId(null)
      setPages([])
      setJob(buildJob())
      resetEditorState()
      setMode('projects')
    }
    deleteProjectApi(id).catch(() => setSaveStatus('error'))
  }

  // ── Upload ───────────────────────────────────────────────────────────────
  async function handleFiles(fileList) {
    const files = Array.from(fileList || [])
    if (!files.length) return
    setProcessing(true)
    try {
      const newPages = await filesToPages(files)
      setPages((ps) => [...ps, ...newPages])
    } finally {
      setProcessing(false)
    }
  }
  function onFilesSelected(e) {
    handleFiles(e.target.files)
    e.target.value = ''
  }
  function onFilesDropped(e) {
    handleFiles(e.dataTransfer.files)
  }
  function triggerFilePicker() {
    fileInputRef.current && fileInputRef.current.click()
  }
  function removePage(id) {
    setPages((ps) => ps.filter((p) => p.id !== id))
  }

  // ── Geometry / canvas point mapping ─────────────────────────────────────
  function getPoint(e) {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const page = pages[activePageIndex]
    const vbH = page && page.naturalW ? (1000 * page.naturalH) / page.naturalW : 700
    const x = ((e.clientX - rect.left) / rect.width) * 1000
    const y = ((e.clientY - rect.top) / rect.height) * vbH
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }
  }

  function pushHistory() {
    return [...history, pages].slice(-20)
  }

  function undo() {
    if (!history.length) return
    const prev = history[history.length - 1]
    setPages(prev)
    setHistory(history.slice(0, -1))
    setDraft(null)
    setCalibDraft(null)
    setCalibInput(null)
    setActiveForm(null)
    setExcludeTarget(null)
  }

  function commitAnnotation(type, points) {
    const h = pushHistory()
    const id = 'a' + Date.now() + Math.floor(Math.random() * 1000)
    const ann = { id, type, points }
    setPages((ps) => ps.map((p, i) => (i === activePageIndex ? { ...p, annotations: [...p.annotations, ann] } : p)))
    setDraft(null)
    setHistory(h)
    if (type === 'area') setActiveForm({ annId: id, kind: 'substrate', value: '' })
  }

  function finishDraft() {
    if (!draft) return
    const minPts = draft.type === 'area' || draft.type === 'exclude' ? 3 : 2
    if (draft.points.length < minPts) return
    if (draft.type === 'exclude') commitExclusion(excludeTarget, draft.points)
    else commitAnnotation(draft.type, draft.points)
  }

  function cancelDraft() {
    setDraft(null)
    setCalibDraft(null)
    setExcludeTarget(null)
  }

  function startExclude(annId) {
    const page = pages[activePageIndex]
    if (!page || !(page.scale || page.demoMode)) return
    setActiveTool('exclude')
    setExcludeTarget(annId)
    setDraft(null)
    setCalibDraft(null)
    setActiveForm(null)
  }

  function commitExclusion(annId, holePoints) {
    if (!annId || !holePoints || holePoints.length < 3) {
      setDraft(null)
      return
    }
    const h = pushHistory()
    setPages((ps) => ps.map((p, i) => (i !== activePageIndex ? p : {
      ...p,
      annotations: p.annotations.map((a) => (a.id === annId ? { ...a, holes: [...(a.holes || []), holePoints] } : a)),
    })))
    setDraft(null)
    setActiveTool('exclude')
    setExcludeTarget(null)
    setHistory(h)
  }

  function clearExclusions(annId) {
    const h = pushHistory()
    setPages((ps) => ps.map((p, i) => (i !== activePageIndex ? p : {
      ...p,
      annotations: p.annotations.map((a) => (a.id === annId ? { ...a, holes: [] } : a)),
    })))
    setHistory(h)
  }

  // ── Click / move handling ────────────────────────────────────────────────
  function onSvgClick(e) {
    e.preventDefault()
    if (activeForm) return
    const page = pages[activePageIndex]
    if (!page) return
    const pt = getPoint(e)

    if (activeTool === 'calibrate') {
      const cd = calibDraft || { points: [] }
      const pts = [...cd.points, pt]
      if (pts.length >= 2) {
        setCalibDraft(null)
        setCalibInput({ points: pts, value: '' })
      } else {
        setCalibDraft({ points: pts })
      }
      return
    }
    if (!page.scale && !page.demoMode) return
    if (activeTool === 'area' || activeTool === 'exclude') {
      const d = draft || { type: activeTool, points: [] }
      if (d.points.length >= 3 && dist(pt, d.points[0]) < 10) {
        if (activeTool === 'exclude') commitExclusion(excludeTarget, d.points)
        else commitAnnotation('area', d.points)
        return
      }
      setDraft({ ...d, points: [...d.points, pt] })
      return
    }
    if (activeTool === 'line') {
      const d = draft || { type: 'line', points: [] }
      setDraft({ ...d, points: [...d.points, pt] })
      return
    }
    if (activeTool === 'point') {
      const id = 'a' + Date.now() + Math.floor(Math.random() * 1000)
      const ann = { id, type: 'point', points: [pt], note: '', qty: 1 }
      const h = pushHistory()
      setPages((ps) => ps.map((p, i) => (i === activePageIndex ? { ...p, annotations: [...p.annotations, ann] } : p)))
      setHistory(h)
      setActiveForm({ annId: id, kind: 'note', value: '', qty: 1 })
      return
    }
    if (activeTool === 'text') {
      const id = 'a' + Date.now() + Math.floor(Math.random() * 1000)
      const ann = { id, type: 'text', points: [pt], label: '' }
      const h = pushHistory()
      setPages((ps) => ps.map((p, i) => (i === activePageIndex ? { ...p, annotations: [...p.annotations, ann] } : p)))
      setHistory(h)
      setActiveForm({ annId: id, kind: 'text', value: '' })
      return
    }
  }

  function onSvgDoubleClick(e) {
    e.preventDefault()
    finishDraft()
  }

  function onSvgMouseMove(e) {
    if (activeTool === 'calibrate' && calibDraft && calibDraft.points.length === 1) {
      const pt = getPoint(e)
      setCalibDraft((s) => ({ ...s, mouse: pt }))
    } else if ((activeTool === 'line' || activeTool === 'area' || activeTool === 'exclude') && draft) {
      const pt = getPoint(e)
      const nearStart = (activeTool === 'area' || activeTool === 'exclude') && draft.points.length >= 3 && dist(pt, draft.points[0]) < 10
      setDraft((s) => ({ ...s, mouse: pt, nearStart }))
    }
  }

  // ── Calibration ──────────────────────────────────────────────────────────
  function setCalibValue(v) {
    setCalibInput((s) => ({ ...s, value: v }))
  }
  function confirmCalibration() {
    if (!calibInput) return
    const val = parseFloat(calibInput.value)
    if (!val || val <= 0) return
    const [p1, p2] = calibInput.points
    const pxDist = Math.hypot(p2.x - p1.x, p2.y - p1.y)
    const ppu = pxDist / val
    const h = pushHistory()
    setPages((ps) => ps.map((p, i) => (i === activePageIndex ? { ...p, scale: { ppu, value: val } } : p)))
    setHistory(h)
    setCalibInput(null)
    setActiveTool('line')
  }
  function cancelCalibInput() {
    setCalibInput(null)
  }

  // ── Forms (substrate / note / text) ─────────────────────────────────────
  function setFormValue(v) {
    setActiveForm((s) => ({ ...s, value: v }))
  }
  function setFormQty(v) {
    setActiveForm((s) => ({ ...s, qty: v }))
  }
  function attachFormPhoto(file) {
    uploadToBlob(file, `breach-${Date.now()}-${file.name}`)
      .then((url) => setActiveForm((s) => ({ ...s, photo: url })))
      .catch(() => setSaveStatus('error'))
  }
  function saveForm() {
    if (!activeForm) return
    setPages((ps) => ps.map((p, i) => {
      if (i !== activePageIndex) return p
      return {
        ...p,
        annotations: p.annotations.map((a) => {
          if (a.id !== activeForm.annId) return a
          if (activeForm.kind === 'note') return { ...a, note: activeForm.value, qty: Math.max(1, parseInt(activeForm.qty, 10) || 1), photo: activeForm.photo || a.photo }
          if (activeForm.kind === 'substrate') return { ...a, substrate: activeForm.value }
          return { ...a, label: activeForm.value }
        }),
      }
    }))
    setActiveForm(null)
  }
  function cancelForm() {
    if (!activeForm) return
    setPages((ps) => ps.map((p, i) => {
      if (i !== activePageIndex) return p
      const ann = p.annotations.find((a) => a.id === activeForm.annId)
      const isEmpty = ann && (
        (activeForm.kind === 'note' && !ann.note && !activeForm.value && (Math.max(1, parseInt(activeForm.qty, 10) || 1) === 1)) ||
        (activeForm.kind === 'text' && !ann.label && !activeForm.value)
      )
      if (isEmpty) return { ...p, annotations: p.annotations.filter((a) => a.id !== activeForm.annId) }
      return p
    }))
    setActiveForm(null)
  }
  function editAnnotation(ann) {
    const kind = ann.type === 'point' ? 'note' : ann.type === 'area' ? 'substrate' : 'text'
    const value = kind === 'note' ? (ann.note || '') : kind === 'substrate' ? (ann.substrate || '') : (ann.label || '')
    setActiveForm({ annId: ann.id, kind, value, photo: ann.photo, qty: ann.qty || 1 })
  }
  function deleteAnnotation(annId) {
    const h = pushHistory()
    setPages((ps) => ps.map((p, i) => (i === activePageIndex ? { ...p, annotations: p.annotations.filter((a) => a.id !== annId) } : p)))
    setHistory(h)
  }

  // ── Pan ──────────────────────────────────────────────────────────────────
  function onCanvasMouseDown(e) {
    if (activeTool !== 'pan') return
    const el = canvasScrollRef.current
    if (!el) return
    e.preventDefault()
    const start = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop }
    setIsPanning(true)
    const onMove = (ev) => {
      el.scrollLeft = start.left - (ev.clientX - start.x)
      el.scrollTop = start.top - (ev.clientY - start.y)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      setIsPanning(false)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  function zoomIn() { setZoom((z) => Math.min(3, Math.round((z + 0.25) * 100) / 100)) }
  function zoomOut() { setZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100)) }
  function resetZoom() { setZoom(1) }

  // ── Tools / pages / mode ─────────────────────────────────────────────────
  function setTool(id) {
    const page = pages[activePageIndex]
    const unlocked = page && (page.scale || page.demoMode)
    if (id !== 'calibrate' && id !== 'pan' && !unlocked) return
    setActiveTool(id)
    setDraft(null)
    setCalibDraft(null)
    setExcludeTarget(null)
  }
  function setDemoMode(val) {
    setPages((ps) => ps.map((p, i) => (i === activePageIndex ? { ...p, demoMode: val } : p)))
  }
  function selectPage(idx) {
    const page = pages[idx]
    setActivePageIndex(idx)
    setActiveTool(page && page.scale ? 'line' : 'calibrate')
    setDraft(null)
    setCalibDraft(null)
    setCalibInput(null)
    setActiveForm(null)
    setExcludeTarget(null)
  }

  function goToWorkspace() {
    if (pages.length) {
      setMode('workspace')
      setActivePageIndex(0)
      setActiveTool(pages[0].scale ? 'line' : 'calibrate')
    }
  }
  function goToReport() { setMode('report') }
  function toggleReportPage(id) {
    setExcludedReportPageIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function selectAllReportPages() { setExcludedReportPageIds(new Set()) }
  function selectNoReportPages() { setExcludedReportPageIds(new Set(pages.map((p) => p.id))) }
  function backToEditor() { setMode('workspace') }
  function printReport() { window.print() }
  function updateJob(field, val) { setJob((s) => ({ ...s, [field]: val })) }
  function setBreachStart(val) {
    setPages((ps) => ps.map((p, i) => (i === activePageIndex ? { ...p, breachStartNumber: val } : p)))
  }

  // ── Derived view model (mirrors the prototype's renderVals()) ──────────
  const activePage = pages[activePageIndex] || null
  const activePageEnriched = enrichPage(activePage || blankPage(), { onEdit: editAnnotation, onDelete: deleteAnnotation, onAddExclusion: startExclude, onClearExclusions: clearExclusions })
  const hasScale = !!(activePage && activePage.scale)

  const TOOLS = [
    { id: 'calibrate', label: 'Set Scale', color: '#ea580c' },
    { id: 'line', label: 'Line', color: '#2563eb' },
    { id: 'area', label: 'Area', color: '#16a34a' },
    { id: 'point', label: 'Breach', color: '#dc2626' },
    { id: 'text', label: 'Label', color: '#334155' },
    { id: 'pan', label: 'Pan', color: '#64748b' },
  ]
  const unlocked = hasScale || (activePage && activePage.demoMode)
  const toolButtons = TOOLS.map((t) => ({
    ...t,
    disabled: t.id !== 'calibrate' && t.id !== 'pan' && !unlocked,
    active: activeTool === t.id,
    onClick: () => setTool(t.id),
  }))

  const pageTabs = pages.map((p, i) => ({
    id: p.id, name: p.name, img: p.img,
    active: i === activePageIndex,
    hasScale: !!p.scale,
    onSelect: () => selectPage(i),
  }))

  const draftPreviewPts = draft ? [...draft.points, ...(draft.mouse ? [draft.mouse] : [])].map((p) => p.x + ',' + p.y).join(' ') : ''
  const draftCanFinish = draft ? ((draft.type === 'area' || draft.type === 'exclude') ? draft.points.length >= 3 : draft.points.length >= 2) : false
  const draftIsArea = !!(draft && draft.type === 'area')
  const draftIsExclude = !!(draft && draft.type === 'exclude')
  const calibFirstPoint = calibDraft ? calibDraft.points[0] : { x: 0, y: 0 }
  const calibLinePts = calibDraft && calibDraft.mouse ? `${calibFirstPoint.x},${calibFirstPoint.y} ${calibDraft.mouse.x},${calibDraft.mouse.y}` : ''

  const calibInputLinePts = calibInput ? `${calibInput.points[0].x},${calibInput.points[0].y} ${calibInput.points[1].x},${calibInput.points[1].y}` : ''
  const calibInputLeftPct = calibInput ? (((calibInput.points[0].x + calibInput.points[1].x) / 2 / 1000) * 100) + '%' : '0%'
  const calibInputTopPct = calibInput ? (((calibInput.points[0].y + calibInput.points[1].y) / 2 / activePageEnriched.vbH) * 100) + '%' : '0%'

  let formLeftPct = '50%', formTopPct = '50%'
  if (activeForm) {
    const formAnnotation = activePageEnriched.annotations.find((a) => a.id === activeForm.annId)
    if (formAnnotation) { formLeftPct = formAnnotation.leftPct; formTopPct = formAnnotation.topPct }
  }

  const instructionMap = {
    calibrate: hasScale ? 'Recalibrate: click two points a known distance apart.' : 'Click two points a known distance apart (e.g. a wall or grid line), then enter the real length.',
    line: 'Click to place points along the run. Double-click or press Finish to complete.',
    area: 'Click to trace the region. Click back near your starting point (or press Finish) to close it.',
    point: 'Click on the drawing to flag a breach or area of concern.',
    text: 'Click on the drawing to place a text callout.',
    pan: 'Drag to move around the drawing.',
    exclude: 'Trace the untestable area (e.g. a hatch). Click back near your start point (or press Finish) to exclude it from the m² total.',
  }

  const reportPages = pages.map((p) => enrichPage(p))
  const selectedReportPages = reportPages.filter((p) => !excludedReportPageIds.has(p.id))
  const overallLength = selectedReportPages.reduce((s, p) => s + p.totalLength, 0)
  const overallArea = selectedReportPages.reduce((s, p) => s + p.totalArea, 0)
  const overallBreach = selectedReportPages.reduce((s, p) => s + p.breachCount, 0)
  const pageSelection = pages.map((p) => ({
    id: p.id,
    name: p.name,
    included: !excludedReportPageIds.has(p.id),
    onToggle: () => toggleReportPage(p.id),
  }))

  const projectList = Object.values(store.projects)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .map((p) => ({
      id: p.id,
      name: p.job.reportTitle || 'Untitled project',
      clientName: p.job.clientName,
      address: p.job.address,
      pageCount: p.pages.length,
      thumbnail: p.pages[0]?.img || null,
      updatedAt: p.updatedAt,
      onSelect: () => selectProject(p.id),
      onDelete: () => deleteProject(p.id),
    }))

  return {
    // data loading
    loading, loadError,
    saveStatus, saveStatusLabel: saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Save failed' : '',
    // mode
    mode, isProjects: mode === 'projects', isUpload: mode === 'upload', isWorkspace: mode === 'workspace', isReport: mode === 'report',
    goToWorkspace, goToReport, backToEditor, printReport,
    // projects
    projectList, createProject, selectProject, goToProjects, deleteProject,
    hasActiveProject: !!activeProjectId,
    // pages / upload
    pages, hasPages: pages.length > 0,
    uploadPages: pages.map((p) => ({ ...p, onRemove: () => removePage(p.id) })),
    processing, dropzoneLabel: processing ? 'Processing files…' : 'Click to choose files',
    fileInputRef, onFilesSelected, onFilesDropped, triggerFilePicker,
    // workspace / canvas
    svgRef, canvasScrollRef,
    activePage, activePageEnriched, hasScale, hasActiveImg: !!(activePage && activePage.img),
    activeTool, toolButtons, pageTabs,
    instructionText: instructionMap[activeTool] || '',
    onSvgClick, onSvgMouseMove, onSvgDoubleClick,
    canvasCursor: activeTool === 'pan' ? 'inherit' : 'crosshair',
    onCanvasMouseDown, containerCursor: activeTool === 'pan' ? (isPanning ? 'grabbing' : 'grab') : 'default',
    draftActive: !!draft, draftPreviewPts, draftIsArea, draftIsExclude, draftIsClosedShape: draftIsArea || draftIsExclude, draftCanFinish,
    draftNearStart: !!(draft && draft.nearStart), draftStartPoint: draft ? draft.points[0] : { x: 0, y: 0 },
    finishDraft, cancelDraft,
    calibActive: !!calibDraft, calibFirstPoint, calibLinePts,
    calibInputActive: !!calibInput, calibInput: calibInput || { value: '' }, calibInputLinePts, calibInputLeftPct, calibInputTopPct,
    onCalibValueChange: (e) => setCalibValue(e.target.value),
    confirmCalibration, cancelCalibInput,
    formActive: !!activeForm, activeForm: activeForm || { value: '', qty: 1 },
    formIsSubstrate: !!(activeForm && activeForm.kind === 'substrate'),
    formIsNote: !!(activeForm && activeForm.kind === 'note'),
    formTitle: activeForm && activeForm.kind === 'note' ? 'Breach / concern note' : activeForm && activeForm.kind === 'substrate' ? 'Substrate & membrane type' : 'Callout text',
    formPlaceholder: activeForm && activeForm.kind === 'note' ? 'Describe the issue…' : 'Label text…',
    formLeftPct, formTopPct,
    onFormValueChange: (e) => setFormValue(e.target.value),
    onFormQtyChange: (e) => setFormQty(e.target.value),
    onPhotoChange: (e) => { if (e.target.files[0]) attachFormPhoto(e.target.files[0]) },
    saveForm, cancelForm,
    undo, canUndo: history.length > 0,
    zoom, zoomPct: Math.round(zoom * 100) + '%', canvasWidthPx: Math.round(1100 * zoom) + 'px',
    zoomIn, zoomOut, resetZoom,
    setMeasureMode: () => setDemoMode(false), setDemoModeOn: () => setDemoMode(true),
    breachStartValue: (activePage && activePage.breachStartNumber) || 1,
    onBreachStartChange: (e) => setBreachStart(e.target.value),
    showBreachNumbers: SHOW_BREACH_NUMBERS,
    hasAreaAnnotations: activePageEnriched.annotations.some((a) => a.isArea),
    substrateLegend: [
      { label: 'Plywood', color: '#ccff00' },
      { label: 'Concrete', color: '#00e5ff' },
      { label: 'Warm Roof', color: '#ff3c00' },
      { label: 'Not set', color: '#39ff14' },
    ],
    // job details
    job, updateJob,
    // report
    reportPages, selectedReportPages, pageSelection,
    toggleReportPage, selectAllReportPages, selectNoReportPages,
    overallLengthLabel: overallLength.toFixed(2) + ' m', overallAreaLabel: overallArea.toFixed(2) + ' m²',
    overallBreach, pageCount: selectedReportPages.length, reportYear: new Date().getFullYear(),
    reportSubtitle: [job.clientName, job.address, job.date].filter(Boolean).join(' · '),
  }
}
