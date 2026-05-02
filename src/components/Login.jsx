import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

export default function Login ({currentAuth, setAuth}) {

  const liveKey = import.meta.env.VITE_LIVE_KEY;
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (currentAuth.user && currentAuth.key) {
      if (currentAuth.key === liveKey) {
        navigate(`/live/${currentAuth.user}?key=${encodeURIComponent(currentAuth.key)}`);
      }
      else {
        setError("Hibás kulcs");
      }
    }
    else {
      setError("Hibás adatok");
    }
  };
  return (
    <div style={overlayStyle}>
      <form onSubmit={handleLogin} style={formStyle}>
        <h2>Login:</h2>
        <input 
          type="text" placeholder="Túrázó:" 
          value={currentAuth.user} onChange={e => setAuth({...currentAuth, user: e.target.value})}
          style={inputStyle}
        />
        <div style={{ color: "red" }}>{ error }</div>
        <input 
          type="password" placeholder="Biztonsági kulcs" 
          value={currentAuth.key} onChange={e => setAuth({...currentAuth, key: e.target.value})}
          style={inputStyle}
        />
         <button type="submit" style={buttonStyle}>Belépés</button>
      </form>
    </div>
  )
}

const overlayStyle = { 
    position: 'absolute', 
    zIndex: 100, 
    top: 0, 
    left: 0, 
    width: '100%', 
    height: '100%', 
    background: 'rgba(0,0,0,0.6)', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center' 
};
const formStyle = { 
    background: 'white', 
    padding: '40px', 
    borderRadius: '12px', 
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)', 
    width: '300px' 
};
const inputStyle = { display: 'block', 
    width: '100%', 
    padding: '12px', 
    marginBottom: '15px', 
    border: '1px solid #ccc', 
    borderRadius: '6px',
    boxSizing: 'border-box' };
const buttonStyle = { 
    width: '100%', 
    padding: '12px', 
    background: '#007cbf', 
    color: 'white', 
    border: 'none', 
    borderRadius: '6px', 
    cursor: 'pointer', 
    fontSize: '16px' 
};