import { useState, useCallback, useRef, useEffect } from 'react'
import './App.css'

const DEFAULT_TYPO = {
  fontSize: 48,
  letterSpacing: -0.5,
  lineHeight: 1.1,
}

const randomTex = () => ({
  texX: Math.round(Math.random() * 100),
  texY: Math.round(Math.random() * 100),
})

const INITIAL_LAYERS = [
  {
    id: 1,
    x: 60,
    y: 50,
    z: 1,
    width: 580,
    height: 440,
    rotation: -1.2,
    className: 'layer-paper',
    type: 'text',
    text: 'Tracing\nPaper',
    ...DEFAULT_TYPO,
    fontSize: 72,
    letterSpacing: -1.5,
    lineHeight: 0.95,
    textColor: '#0a0a0a',
    texX: 10,
    texY: 25,
  },
  {
    id: 2,
    x: 340,
    y: 100,
    z: 2,
    width: 460,
    height: 380,
    rotation: 0.6,
    className: 'layer-paper',
    type: 'text',
    text: 'Where sheets overlap, colors blend through the fibres.',
    ...DEFAULT_TYPO,
    fontSize: 24,
    letterSpacing: -0.3,
    lineHeight: 1.35,
    textColor: '#0a0a0a',
    texX: 70,
    texY: 85,
  },
  {
    id: 3,
    x: 160,
    y: 320,
    z: 3,
    width: 400,
    height: 320,
    rotation: 1.4,
    className: 'layer-paper',
    type: 'text',
    text: 'A canvas for freely arranging text, image, and video.',
    ...DEFAULT_TYPO,
    fontSize: 18,
    letterSpacing: 0.2,
    lineHeight: 1.6,
    textColor: '#0a0a0a',
    texX: 45,
    texY: 5,
  },
  {
    id: 4,
    x: 420,
    y: 260,
    z: 4,
    width: 360,
    height: 260,
    rotation: -0.5,
    className: 'layer-media',
    type: 'video',
    src: '/images/video1.mp4',
    texX: 88,
    texY: 60,
  },
]

const MIN_W = 80
const MIN_H = 60

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

const HANDLE_CURSORS = {
  nw: 'nwse-resize',
  se: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
}

const HANDLE_AXIS = {
  nw: { dx: -1, dy: -1 },
  n:  { dx:  0, dy: -1 },
  ne: { dx:  1, dy: -1 },
  e:  { dx:  1, dy:  0 },
  se: { dx:  1, dy:  1 },
  s:  { dx:  0, dy:  1 },
  sw: { dx: -1, dy:  1 },
  w:  { dx: -1, dy:  0 },
}

let nextId = 5

function App() {
  const [layers, setLayers] = useState(INITIAL_LAYERS)
  const [dragging, setDragging] = useState(null)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const resizing = useRef(null)
  const rotating = useRef(null)
  const maxZ = useRef(4)
  const imageInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const clipboard = useRef(null)

  const updateLayer = useCallback((id, updates) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    )
  }, [])

  // ── Add layers ──
  const addPaperLayer = useCallback(() => {
    maxZ.current += 1
    const id = nextId++
    setLayers((prev) => [
      ...prev,
      {
        id,
        x: 100 + Math.random() * 200,
        y: 80 + Math.random() * 200,
        z: maxZ.current,
        width: 400,
        height: 300,
        rotation: (Math.random() - 0.5) * 4,
        className: 'layer-paper',
        type: 'text',
        text: 'New layer',
        ...DEFAULT_TYPO,
        fontSize: 32,
        textColor: '#0a0a0a',
        ...randomTex(),
      },
    ])
    setSelected(id)
  }, [])

  const addImageFromFile = useCallback((file, dropX, dropY) => {
    const url = URL.createObjectURL(file)
    maxZ.current += 1
    const id = nextId++
    const img = new Image()
    img.onload = () => {
      const aspect = img.naturalWidth / img.naturalHeight
      const w = 400
      const h = Math.round(w / aspect)
      const x = dropX != null ? dropX - w / 2 : 100 + Math.random() * 200
      const y = dropY != null ? dropY - h / 2 : 80 + Math.random() * 200
      setLayers((prev) => [
        ...prev,
        {
          id,
          x,
          y,
          z: maxZ.current,
          width: w,
          height: h,
          rotation: (Math.random() - 0.5) * 4,
          className: 'layer-image-raw',
          type: 'image',
          src: url,
          filename: file.name,
          ...randomTex(),
        },
      ])
      setSelected(id)
    }
    img.src = url
  }, [])

  const addVideoFromFile = useCallback((file, dropX, dropY) => {
    const url = URL.createObjectURL(file)
    maxZ.current += 1
    const id = nextId++
    const x = dropX != null ? dropX - 200 : 100 + Math.random() * 200
    const y = dropY != null ? dropY - 140 : 80 + Math.random() * 200
    setLayers((prev) => [
      ...prev,
      {
        id,
        x,
        y,
        z: maxZ.current,
        width: 400,
        height: 280,
        rotation: (Math.random() - 0.5) * 4,
        className: 'layer-media',
        type: 'video',
        src: url,
        ...randomTex(),
      },
    ])
    setSelected(id)
  }, [])

  // File input wrappers
  const addImageLayer = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) addImageFromFile(file)
    e.target.value = ''
  }, [addImageFromFile])

  const addVideoLayer = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) addVideoFromFile(file)
    e.target.value = ''
  }, [addVideoFromFile])

  // ── Drag & drop files onto canvas ──
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const files = [...e.dataTransfer.files]
    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        addImageFromFile(file, e.clientX, e.clientY)
      } else if (file.type.startsWith('video/')) {
        addVideoFromFile(file, e.clientX, e.clientY)
      }
    })
  }, [addImageFromFile, addVideoFromFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
  }, [])

  // ── Drag (move) ──
  const handlePointerDown = useCallback((e, id) => {
    if (editing === id) return
    e.preventDefault()
    const layer = layers.find((l) => l.id === id)
    if (!layer) return

    dragOffset.current = {
      x: e.clientX - layer.x,
      y: e.clientY - layer.y,
    }

    maxZ.current += 1
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, z: maxZ.current } : l))
    )
    setSelected(id)
    setDragging(id)
  }, [layers, editing])

  // ── Resize ──
  const handleResizeDown = useCallback((e, id, handle) => {
    e.stopPropagation()
    e.preventDefault()
    const layer = layers.find((l) => l.id === id)
    if (!layer) return

    const rad = (layer.rotation * Math.PI) / 180
    resizing.current = {
      id,
      handle,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startW: layer.width,
      startH: layer.height,
      startX: layer.x,
      startY: layer.y,
      cos: Math.cos(rad),
      sin: Math.sin(rad),
    }
  }, [layers])

  // ── Rotate via bbox handle ──
  const handleRotateDown = useCallback((e, id) => {
    e.stopPropagation()
    e.preventDefault()
    const layer = layers.find((l) => l.id === id)
    if (!layer) return

    const cx = layer.x + layer.width / 2
    const cy = layer.y + layer.height / 2
    const startAngle =
      Math.atan2(e.clientX - cx, -(e.clientY - cy)) * (180 / Math.PI)

    rotating.current = {
      id,
      cx,
      cy,
      startAngle,
      startRotation: layer.rotation,
    }
  }, [layers])

  const handlePointerMove = useCallback(
    (e) => {
      /* ── Rotation ── */
      if (rotating.current) {
        const r = rotating.current
        const currentAngle =
          Math.atan2(e.clientX - r.cx, -(e.clientY - r.cy)) * (180 / Math.PI)
        const newRotation = r.startRotation + (currentAngle - r.startAngle)

        setLayers((prev) =>
          prev.map((l) =>
            l.id === r.id ? { ...l, rotation: newRotation } : l
          )
        )
        return
      }

      /* ── Resize ── */
      if (resizing.current) {
        const r = resizing.current
        const axis = HANDLE_AXIS[r.handle]

        const rawDx = e.clientX - r.startMouseX
        const rawDy = e.clientY - r.startMouseY
        const localDx = rawDx * r.cos + rawDy * r.sin
        const localDy = -rawDx * r.sin + rawDy * r.cos

        let newW = r.startW
        let newH = r.startH
        let newX = r.startX
        let newY = r.startY

        if (axis.dx === 1) {
          newW = Math.max(MIN_W, r.startW + localDx)
        } else if (axis.dx === -1) {
          const delta = Math.min(localDx, r.startW - MIN_W)
          newW = r.startW - delta
          newX = r.startX + delta * r.cos
          newY = r.startY + delta * r.sin
        }

        if (axis.dy === 1) {
          newH = Math.max(MIN_H, r.startH + localDy)
        } else if (axis.dy === -1) {
          const delta = Math.min(localDy, r.startH - MIN_H)
          newH = r.startH - delta
          newX = newX - delta * r.sin
          newY = newY + delta * r.cos
        }

        setLayers((prev) =>
          prev.map((l) =>
            l.id === r.id
              ? { ...l, width: Math.round(newW), height: Math.round(newH), x: newX, y: newY }
              : l
          )
        )
        return
      }

      /* ── Drag ── */
      if (dragging === null) return
      const x = e.clientX - dragOffset.current.x
      const y = e.clientY - dragOffset.current.y
      setLayers((prev) =>
        prev.map((l) => (l.id === dragging ? { ...l, x, y } : l))
      )
    },
    [dragging]
  )

  const handlePointerUp = useCallback(() => {
    setDragging(null)
    resizing.current = null
    rotating.current = null
  }, [])

  const handleCanvasClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      setSelected(null)
      setEditing(null)
    }
  }, [])

  const handleDoubleClick = useCallback((e, id) => {
    const layer = layers.find((l) => l.id === id)
    if (layer?.type !== 'text') return
    e.stopPropagation()
    setEditing(id)
    setSelected(id)
  }, [layers])

  // ── Copy & Paste (Ctrl/Cmd + C / V) ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (editing) return // don't hijack while editing text
      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key === 'c' && selected) {
        const layer = layers.find((l) => l.id === selected)
        if (layer) clipboard.current = { ...layer }
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
        e.preventDefault()
        setLayers((prev) => prev.filter((l) => l.id !== selected))
        setSelected(null)
      }

      if (mod && e.key === 'v' && clipboard.current) {
        const src = clipboard.current
        maxZ.current += 1
        const id = nextId++
        const copy = {
          ...src,
          id,
          x: src.x + 20,
          y: src.y + 20,
          z: maxZ.current,
          ...randomTex(),
        }
        setLayers((prev) => [...prev, copy])
        setSelected(id)
        // shift clipboard so next paste offsets again
        clipboard.current = { ...copy }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selected, editing, layers])

  const selectedLayer = layers.find((l) => l.id === selected)
  const isTextLayer = selectedLayer?.type === 'text'

  return (
    <div
      className="canvas"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleCanvasClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Add layer toolbar */}
      <div className="toolbar" onClick={(e) => e.stopPropagation()}>
        <button onClick={addPaperLayer}>+ Paper</button>
        <button onClick={() => imageInputRef.current?.click()}>+ Image</button>
        <button onClick={() => videoInputRef.current?.click()}>+ Video</button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={addImageLayer}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          onChange={addVideoLayer}
        />
      </div>

      {layers.map((layer) => {
        const isEditing = editing === layer.id
        const isSelected = selected === layer.id

        return (
          <div
            key={layer.id}
            className={`layer ${layer.className} ${
              dragging === layer.id ? 'dragging' : ''
            } ${isSelected ? 'active selected' : ''}`}
            style={{
              transform: `translate(${layer.x}px, ${layer.y}px) rotate(${layer.rotation}deg)`,
              zIndex: layer.z,
              width: `${layer.width}px`,
              height: `${layer.height}px`,
              '--tex-x': `${layer.texX ?? 50}%`,
              '--tex-y': `${layer.texY ?? 50}%`,
            }}
            onPointerDown={(e) => handlePointerDown(e, layer.id)}
            onDoubleClick={(e) => handleDoubleClick(e, layer.id)}
          >
            {layer.type === 'video' && (
              <div className="layer-content layer-video">
                <video
                  src={layer.src}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>
            )}

            {layer.type === 'image' && (
              <div className="layer-content layer-image">
                <img src={layer.src} alt="" draggable={false} />
              </div>
            )}

            {layer.type === 'text' && (
              <div
                className={`layer-content layer-text ${isEditing ? 'editing' : ''} ${layer.textColor === '#fff' ? 'text-white' : ''}`}
                contentEditable={isEditing}
                suppressContentEditableWarning
                style={{
                  fontSize: `${layer.fontSize}px`,
                  letterSpacing: `${layer.letterSpacing}px`,
                  lineHeight: layer.lineHeight,
                  whiteSpace: 'pre-wrap',
                  color: layer.textColor || '#0a0a0a',
                }}
                onBlur={(e) => {
                  updateLayer(layer.id, { text: e.currentTarget.textContent })
                }}
                onPointerDown={(e) => {
                  if (isEditing) e.stopPropagation()
                }}
              >
                {layer.text}
              </div>
            )}

            {/* Bounding box */}
            {isSelected && !isEditing && (
              <div className="bbox">
                {HANDLES.map((h) => (
                  <div
                    key={h}
                    className={`bbox-handle bbox-handle-${h}`}
                    style={{ cursor: HANDLE_CURSORS[h] }}
                    onPointerDown={(e) => handleResizeDown(e, layer.id, h)}
                  />
                ))}
                {/* Rotation handle */}
                <div className="bbox-rotate-line" />
                <div
                  className="bbox-rotate-handle"
                  onPointerDown={(e) => handleRotateDown(e, layer.id)}
                />
                {layer.filename && (
                  <span className="bbox-filename">{layer.filename}</span>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Control panel — text layers only */}
      {selected && isTextLayer && selectedLayer && (
        <div className="typo-panel" onClick={(e) => e.stopPropagation()}>
          <div className="typo-row">
            <label>Size</label>
            <input
              type="range"
              min="10"
              max="400"
              step="1"
              value={selectedLayer.fontSize}
              onChange={(e) =>
                updateLayer(selected, { fontSize: Number(e.target.value) })
              }
            />
            <span className="typo-value">{selectedLayer.fontSize}</span>
          </div>
          <div className="typo-row">
            <label>Tracking</label>
            <input
              type="range"
              min="-20"
              max="40"
              step="0.1"
              value={selectedLayer.letterSpacing}
              onChange={(e) =>
                updateLayer(selected, { letterSpacing: Number(e.target.value) })
              }
            />
            <span className="typo-value">{selectedLayer.letterSpacing.toFixed(1)}</span>
          </div>
          <div className="typo-row">
            <label>Leading</label>
            <input
              type="range"
              min="0.6"
              max="3"
              step="0.05"
              value={selectedLayer.lineHeight}
              onChange={(e) =>
                updateLayer(selected, { lineHeight: Number(e.target.value) })
              }
            />
            <span className="typo-value">{selectedLayer.lineHeight.toFixed(2)}</span>
          </div>
          <div className="typo-row">
            <label>Color</label>
            <button
              className="color-toggle"
              onClick={() =>
                updateLayer(selected, {
                  textColor: selectedLayer.textColor === '#fff' ? '#0a0a0a' : '#fff',
                })
              }
            >
              <span
                className="color-swatch"
                style={{ background: selectedLayer.textColor || '#0a0a0a' }}
              />
              {(selectedLayer.textColor || '#0a0a0a') === '#fff' ? 'White' : 'Black'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
