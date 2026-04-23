import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Provider } from 'react-redux'          // <-- tambahan Redux
import store from './store'                       // <-- import store kita
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'

const GOOGLE_CLIENT_ID = '579921575694-trq8oarv7qj63smj12btme1f2v29tr1q.apps.googleusercontent.com'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        {/* Provider Redux harus membungkus App supaya semua komponen bisa akses store */}
        <Provider store={store}>
          <App />
        </Provider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
