import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import StorageInitializer from './storage/StorageInitializer.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <StorageInitializer>
        <App />
      </StorageInitializer>
    </ErrorBoundary>
  </StrictMode>,
)
