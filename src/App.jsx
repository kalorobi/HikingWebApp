import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Live from './pages/Live';

import './base.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/live" element={<Live />} />
        <Route path="/live/:user" element={<Live />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App
