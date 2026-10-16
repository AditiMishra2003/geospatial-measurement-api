export default function Header({ onLogoClick }) {
  return (
    <header style={{
      background: '#1e293b',
      borderBottom: '1px solid #334155',
      padding: '0 24px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <button
        onClick={onLogoClick}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '10px', color: '#f1f5f9'
        }}
      >
        <span style={{ fontSize: '1.6em' }}>🌍</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1em', letterSpacing: '-0.3px' }}>
            Geospatial Measurement API
          </div>
          <div style={{ fontSize: '0.72em', color: '#64748b', marginTop: '1px' }}>
            Shapefile &amp; KML File Processor
          </div>
        </div>
      </button>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <a
          href="https://geospatial-measurement-api-bzxy.onrender.com/docs"
          target="_blank" rel="noreferrer"
          style={{
            color: '#38bdf8', fontSize: '0.85em', textDecoration: 'none',
            padding: '6px 14px', border: '1px solid #38bdf8',
            borderRadius: '6px', transition: 'all 0.2s',
          }}
        >
          API Docs
        </a>
        <a
          href="https://github.com/AditiMishra2003/geospatial-measurement-api"
          target="_blank" rel="noreferrer"
          style={{
            color: '#94a3b8', fontSize: '0.85em', textDecoration: 'none',
            padding: '6px 14px', border: '1px solid #334155',
            borderRadius: '6px',
          }}
        >
          GitHub
        </a>
      </div>
    </header>
  )
}
