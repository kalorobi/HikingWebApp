import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

import Live_2 from './pages/Live_2';

import './base.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/live2" element={<Live_2 />} />
        <Route path="/live2/:user" element={<Live_2 />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App
