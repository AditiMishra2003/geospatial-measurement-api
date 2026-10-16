import { useState, useEffect } from 'react'

const API_BASE = 'https://geospatial-measurement-api-bzxy.onrender.com'

const STATUS_STYLES = {
  COMPLETED: { bg: '#052e16', border: '#22c55e', color: '#4ade80', label: '✅ COMPLETED' },
  PROCESSING: { bg: '#1c1917', border: '#f59e0b', color: '#fbbf24', label: '⏳ PROCESSING' },
  FAILED:     { bg: '#450a0a', border: '#ef4444', color: '#f87171', label: '❌ FAILED' },
  PENDING:    { bg: '#1e293b', border: '#475569', color: '#94a3b8', label: '🕐 PENDING' },
}

const GEOM_ICONS = {
  Polygon: '▭', MultiPolygon: '▭▭',
  LineString: '〰', MultiLineString: '〰〰',
  Point: '•', MultiPoint: '••',
}

export default function ResultsPage({ file, onBack }) {
  const [measurements, setMeasurements] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('All')

  useEffect(() => {
    fetchMeasurements()
  }, [file.id])

  const fetchMeasurements = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/files/${file.id}/measurements/`)
      if (!res.ok) throw new Error('Failed to fetch measurements')
      const data = await res.json()
      setMeasurements(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const statusStyle = STATUS_STYLES[file.status] || STATUS_STYLES.PENDING

  // Get unique geometry types for filter
  const geomTypes = measurements
    ? ['All', ...new Set(measurements.features.map(f => f.geometry_type))]
    : ['All']

  // Filter features
  const filteredFeatures = measurements?.features.filter(f => {
    const matchType = filterType === 'All' || f.geometry_type === filterType
    const matchSearch = search === '' ||
      JSON.stringify(f.properties).toLowerCase().includes(search.toLowerCase()) ||
      f.geometry_type.toLowerCase().includes(search.toLowerCase()) ||
      String(f.feature_id).includes(search)
    return matchType && matchSearch
  }) || []

  const formatMeasurement = (m) => {
    if (!m) return <span style={{ color: '#475569' }}>—</span>
    if (m.unsupported) return <span style={{ color: '#f59e0b', fontSize: '0.85em' }}>Unsupported</span>
    if (m.area_m2 != null) return (
      <span>
        <span style={{ color: '#34d399', fontWeight: 600 }}>
          {m.area_m2 >= 1000000
            ? `${(m.area_m2 / 1000000).toFixed(4)} km²`
            : `${m.area_m2.toLocaleString()} m²`}
        </span>
        <span style={{ color: '#64748b', fontSize: '0.78em', marginLeft: '4px' }}>area</span>
      </span>
    )
    if (m.length_m != null) return (
      <span>
        <span style={{ color: '#60a5fa', fontWeight: 600 }}>
          {m.length_m >= 1000
            ? `${(m.length_m / 1000).toFixed(3)} km`
            : `${m.length_m.toLocaleString()} m`}
        </span>
        <span style={{ color: '#64748b', fontSize: '0.78em', marginLeft: '4px' }}>length</span>
      </span>
    )
    return <span style={{ color: '#64748b', fontSize: '0.85em' }}>No measurement</span>
  }

  return (
    <div>
      {/* Back button */}
      <button onClick={onBack} style={{
        background: 'none', border: '1px solid #334155', color: '#94a3b8',
        padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
        fontSize: '0.9em', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '6px'
      }}>
        ← Upload another file
      </button>

      {/* File Info Card */}
      <div style={{
        background: '#1e293b', border: '1px solid #334155', borderRadius: '14px',
        padding: '24px', marginBottom: '24px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px'
      }}>
        <div>
          <div style={{ color: '#64748b', fontSize: '0.75em', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Filename</div>
          <div style={{ color: '#f1f5f9', fontWeight: 600, wordBreak: 'break-all' }}>📄 {file.filename}</div>
        </div>
        <div>
          <div style={{ color: '#64748b', fontSize: '0.75em', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Features</div>
          <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.4em' }}>{file.feature_count ?? '—'}</div>
        </div>
        <div>
          <div style={{ color: '#64748b', fontSize: '0.75em', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>CRS</div>
          <div style={{ color: '#38bdf8', fontWeight: 600, fontFamily: 'monospace' }}>{file.crs ?? '—'}</div>
        </div>
        <div>
          <div style={{ color: '#64748b', fontSize: '0.75em', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Status</div>
          <span style={{
            background: statusStyle.bg, border: `1px solid ${statusStyle.border}`,
            color: statusStyle.color, padding: '4px 12px', borderRadius: '20px',
            fontSize: '0.82em', fontWeight: 600
          }}>
            {statusStyle.label}
          </span>
        </div>
        <div>
          <div style={{ color: '#64748b', fontSize: '0.75em', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>File ID</div>
          <div style={{ color: '#475569', fontSize: '0.75em', fontFamily: 'monospace', wordBreak: 'break-all' }}>{file.id}</div>
        </div>
      </div>

      {/* Error / Failed state */}
      {file.status === 'FAILED' && file.error_message && (
        <div style={{
          background: '#450a0a', border: '1px solid #ef4444', borderRadius: '10px',
          padding: '16px', color: '#fca5a5', marginBottom: '20px'
        }}>
          <strong>Processing failed:</strong> {file.error_message}
        </div>
      )}

      {/* Measurements Section */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '1.1em', fontWeight: 700, color: '#f1f5f9' }}>
            Feature Measurements
          </h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search */}
            <input
              type="text"
              placeholder="Search features..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background: '#0f172a', border: '1px solid #334155', borderRadius: '8px',
                color: '#e2e8f0', padding: '8px 12px', fontSize: '0.88em', outline: 'none',
                width: '180px'
              }}
            />
            {/* Geometry Type Filter */}
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              style={{
                background: '#0f172a', border: '1px solid #334155', borderRadius: '8px',
                color: '#e2e8f0', padding: '8px 12px', fontSize: '0.88em', outline: 'none', cursor: 'pointer'
              }}
            >
              {geomTypes.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
            <div style={{ fontSize: '2em', marginBottom: '12px' }}>⏳</div>
            Loading measurements...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#f87171' }}>
            ⚠️ {error}
          </div>
        ) : filteredFeatures.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
            No features match your filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88em' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  {['ID', 'Type', 'CRS', 'Properties', 'Measurement'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left',
                      color: '#64748b', fontWeight: 600, fontSize: '0.8em',
                      textTransform: 'uppercase', letterSpacing: '0.6px',
                      whiteSpace: 'nowrap'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredFeatures.map((feat, i) => (
                  <tr key={feat.feature_id} style={{
                    borderBottom: '1px solid #1e2d40',
                    background: i % 2 === 0 ? 'transparent' : '#0f1a27'
                  }}>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontFamily: 'monospace' }}>
                      #{feat.feature_id}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        background: '#0f172a', border: '1px solid #334155',
                        padding: '3px 10px', borderRadius: '20px', fontSize: '0.82em',
                        color: '#94a3b8', whiteSpace: 'nowrap'
                      }}>
                        {GEOM_ICONS[feat.geometry_type] || '◆'} {feat.geometry_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.82em' }}>
                      {feat.crs}
                    </td>
                    <td style={{ padding: '12px 14px', maxWidth: '200px' }}>
                      {Object.keys(feat.properties).length === 0 ? (
                        <span style={{ color: '#475569', fontSize: '0.85em' }}>—</span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {Object.entries(feat.properties)
                            .filter(([, v]) => v != null && v !== '')
                            .slice(0, 3)
                            .map(([k, v]) => (
                              <span key={k} style={{
                                background: '#1e293b', border: '1px solid #334155',
                                padding: '2px 8px', borderRadius: '4px', fontSize: '0.78em',
                                color: '#94a3b8', whiteSpace: 'nowrap'
                              }}>
                                <span style={{ color: '#64748b' }}>{k}:</span> {String(v).slice(0, 20)}
                              </span>
                            ))}
                          {Object.keys(feat.properties).length > 3 && (
                            <span style={{ color: '#475569', fontSize: '0.78em', alignSelf: 'center' }}>
                              +{Object.keys(feat.properties).length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      {formatMeasurement(feat.measurements)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: '16px', color: '#475569', fontSize: '0.82em' }}>
              Showing {filteredFeatures.length} of {measurements.features.length} features
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
