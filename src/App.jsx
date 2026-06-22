import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Live from './pages/Live';

import './base.css';
import VisitorsLog from './services/VisitorsLog';
import DashBoard from './pages/DashBoard';

function App() {
  return (
    <Router>
      <VisitorsLog />
      <Routes>
        <Route path="/live" element={<Live />} />
        <Route path="/live/:user" element={<Live />} />
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<DashBoard />} />
      </Routes>
    </Router>
  );
}

export default App
