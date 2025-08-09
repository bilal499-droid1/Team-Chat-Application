import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import PrivateRoute from './components/auth/PrivateRoute'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import Dashboard from './pages/Dashboard'
import Messages from './pages/Messages'
import Projects from './pages/Projects'
import Team from './pages/Team'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
              <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
              <Route path="/team" element={<PrivateRoute><Team /></PrivateRoute>} />
              <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
              <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App
