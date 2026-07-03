import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Live from './pages/Live';
import HikingRoute from './pages/HikingRoute';
import DashBoard from './pages/DashBoard';

import './base.css';
import VisitorsLog from './services/VisitorsLog';

function App() {
  return (
    <Router>
      {import.meta.env.PROD && <VisitorsLog />}
      <Routes>
        <Route path="/live" element={<Live />} />
        <Route path="/live/:user" element={<Live />} />
        <Route path="/hikingRoute" element={<HikingRoute />} />
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<DashBoard />} />
      </Routes>
    </Router>
  );
}

export default App
