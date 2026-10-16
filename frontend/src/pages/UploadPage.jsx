import { useState, useRef } from 'react'

const API_BASE = 'https://geospatial-measurement-api-bzxy.onrender.com'

export default function UploadPage({ onSuccess }) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef()

  const isValidFile = (f) => {
    const name = f.name.toLowerCase()
    return name.endsWith('.kml') || name.endsWith('.zip')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) {
      if (!isValidFile(dropped)) {
        setError('Only .kml or .zip (Shapefile) files are accepted.')
        setFile(null)
      } else {
        setFile(dropped)
        setError(null)
      }
    }
  }

  const handleSelect = (e) => {
    const selected = e.target.files[0]
    if (selected) {
      if (!isValidFile(selected)) {
        setError('Only .kml or .zip (Shapefile) files are accepted.')
        setFile(null)
      } else {
        setFile(selected)
        setError(null)
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API_BASE}/api/files/`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Upload failed')
      }
      const data = await res.json()
      onSuccess(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ maxWidth: '640px', margin: '48px auto 0' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '3.5em', marginBottom: '12px' }}>🗺️</div>
        <h1 style={{ fontSize: '1.8em', fontWeight: 700, color: '#f1f5f9', marginBottom: '10px' }}>
          Geospatial File Measurement
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1em', lineHeight: 1.6 }}>
          Upload a Shapefile (.zip) or KML (.kml) file to extract features
          and calculate accurate metric measurements using UTM projection.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragging ? '#38bdf8' : file ? '#22c55e' : '#334155'}`,
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? '#0f2236' : file ? '#0f2b1f' : '#1e293b',
          transition: 'all 0.2s',
          marginBottom: '16px',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".kml,.zip"
          onChange={handleSelect}
          style={{ display: 'none' }}
        />
        {file ? (
          <>
            <div style={{ fontSize: '2.5em', marginBottom: '10px' }}>✅</div>
            <div style={{ color: '#22c55e', fontWeight: 600, fontSize: '1.05em' }}>{file.name}</div>
            <div style={{ color: '#64748b', fontSize: '0.85em', marginTop: '6px' }}>
              {(file.size / 1024).toFixed(1)} KB · Click to change
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '2.5em', marginBottom: '12px' }}>📂</div>
            <div style={{ color: '#cbd5e1', fontWeight: 600, fontSize: '1.05em', marginBottom: '6px' }}>
              Drop your file here, or click to browse
            </div>
            <div style={{ color: '#475569', fontSize: '0.85em' }}>
              Supported: <strong style={{ color: '#94a3b8' }}>.zip</strong> (Shapefile) and{' '}
              <strong style={{ color: '#94a3b8' }}>.kml</strong>
            </div>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: '#450a0a', border: '1px solid #ef4444', borderRadius: '8px',
          padding: '12px 16px', color: '#fca5a5', fontSize: '0.9em', marginBottom: '14px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '10px',
          border: 'none',
          background: file && !uploading ? 'linear-gradient(135deg, #0ea5e9, #38bdf8)' : '#334155',
          color: file && !uploading ? 'white' : '#64748b',
          fontSize: '1em',
          fontWeight: 700,
          cursor: file && !uploading ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
          letterSpacing: '0.3px',
        }}
      >
        {uploading ? (
          <span>⏳ Processing... (may take 30–60s on first load)</span>
        ) : (
          <span>🚀 Upload &amp; Analyse</span>
        )}
      </button>

      {/* Info Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '36px' }}>
        {[
          { icon: '📐', title: 'Polygons', desc: 'Area calculated in m² after UTM reprojection' },
          { icon: '📏', title: 'LineStrings', desc: 'Length calculated in metres after reprojection' },
          { icon: '📍', title: 'Points', desc: 'Coordinates extracted, no measurement needed' },
        ].map(card => (
          <div key={card.title} style={{
            background: '#1e293b', border: '1px solid #334155',
            borderRadius: '10px', padding: '16px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.8em', marginBottom: '8px' }}>{card.icon}</div>
            <div style={{ fontWeight: 600, fontSize: '0.9em', color: '#e2e8f0', marginBottom: '4px' }}>{card.title}</div>
            <div style={{ fontSize: '0.78em', color: '#64748b', lineHeight: 1.5 }}>{card.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
