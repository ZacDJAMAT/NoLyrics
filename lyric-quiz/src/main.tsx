import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { AuthProvider } from './contexts/AuthContext' // NOUVEAU: On importe notre Provider

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        {/* On englobe l'application ici */}
        <AuthProvider>
            <App />
        </AuthProvider>
    </StrictMode>,
)