import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './services/auth/AuthContext';
import ProtectedRoute from './services/auth/ProtectedRoute';
import Home from './pages/Home';
import Live from './pages/Live';
import HikingRoute from './pages/HikingRoute';
import DashBoard from './pages/DashBoard';
import LivePlan from './pages/LivePlan';
import Login from './services/auth/Login';
import { NotFound } from './pages/NotFound';

import './base.css';
import VisitorsLog from './services/VisitorsLog';
import LivePlanRouter from './pages/LivePlanRouter';

function App() {
  return (
    <AuthProvider>
      <Router>
        {import.meta.env.PROD && <VisitorsLog />}

        <Routes>
          <Route path="/live" element={<Live />} />
          <Route path="/live/:user" element={<Live />} />
          <Route path="/hikingRoute" element={<HikingRoute />} />
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashBoard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/livePlan/:mountain?/:routeId?"
            element={
              <ProtectedRoute>
                  <LivePlanRouter />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App
