import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login ({currentAuth, setAuth}) {

  const liveKey = import.meta.env.VITE_LIVE_KEY;
  const [error, setError] = useState({user : "", key: ""});
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (currentAuth.user && currentAuth.key) {
      if (currentAuth.key === liveKey) {
        setAuth({...currentAuth, isOk: true});
        navigate(`/live/${currentAuth.user}?key=${encodeURIComponent(currentAuth.key)}`, { replace: true });
        //navigate(`/live/${currentAuth.user}?key=${encodeURIComponent(currentAuth.key)}`);
      }
      else {
        setError({...error, key: "Hibás kulcs"});
      }
    }
    else {
      setError({...error, user: "User hiba"});
    }
  };
  return (
    <div className='overlay'>
      <form onSubmit={handleLogin} className='form'>
        <h4>Login:</h4>
        <div>{error.user}</div>
        <input 
          type="text" placeholder="Túrázó:" 
          value={currentAuth.user} onChange={e => setAuth({...currentAuth, user: e.target.value})}
          className='input'
        />
        <div>{error.key}</div>
        <input 
          type="password" placeholder="Jelszó:" 
          value={currentAuth.key} onChange={e => setAuth({...currentAuth, key: e.target.value})}
          className='input'
        />
         <button type="submit" className='btn'>Belépés</button>
      </form>
    </div>
  )
}