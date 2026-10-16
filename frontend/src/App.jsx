import { useState } from 'react'
import UploadPage from './pages/UploadPage'
import ResultsPage from './pages/ResultsPage'
import Header from './components/Header'

export default function App() {
  const [uploadedFile, setUploadedFile] = useState(null) // { id, filename, feature_count, crs, status }
  const [view, setView] = useState('upload') // 'upload' | 'results'

  const handleUploadSuccess = (fileData) => {
    setUploadedFile(fileData)
    setView('results')
  }

  const handleReset = () => {
    setUploadedFile(null)
    setView('upload')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header onLogoClick={handleReset} />
      <main style={{ flex: 1, padding: '24px 16px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        {view === 'upload' && (
          <UploadPage onSuccess={handleUploadSuccess} />
        )}
        {view === 'results' && uploadedFile && (
          <ResultsPage file={uploadedFile} onBack={handleReset} />
        )}
      </main>
      <footer style={{ textAlign: 'center', padding: '20px', color: '#475569', fontSize: '0.85em', borderTop: '1px solid #1e293b' }}>
        Geospatial File Measurement API · Built with FastAPI + React ·{' '}
        <a href="https://geospatial-measurement-api-bzxy.onrender.com/docs"
           target="_blank" rel="noreferrer"
           style={{ color: '#38bdf8', textDecoration: 'none' }}>
          API Docs
        </a>
        {' · '}
        <a href="https://github.com/AditiMishra2003/geospatial-measurement-api"
           target="_blank" rel="noreferrer"
           style={{ color: '#38bdf8', textDecoration: 'none' }}>
          GitHub
        </a>
      </footer>
    </div>
  )
}
