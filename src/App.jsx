import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Live from './pages/Live';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/live" element={<Live />} />
        <Route path="/live/:user" element={<Live />} />
        <Route path="/" element={<h1>Hamarosan</h1>} />
      </Routes>
    </Router>
  );
}

export default App
