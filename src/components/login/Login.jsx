import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkUser } from '../../services/LoginSupabase';
import { setSession } from '../../services/Storage';
import './Login.css';

export default function Login({ auth, setAuth }) {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  async function handleLogin(e) {
    e.preventDefault();

    const sessionAuth = sessionStorage.getItem("session_auth");

  if(sessionAuth){
    setAuth(JSON.parse(sessionAuth));
    return;
  }

   if (!auth.user?.trim()) {
      setError('Add meg a felhasználónevet.');
      return;
    }
    if (!auth.key) {
      setError('Add meg a jelszót.');
      return;
    }
  
  
  try {
    const user_id = await checkUser(auth.user, auth.key);

    if (!user_id) {
        setError('Hibás felhasználónév vagy jelszó.');
    }

    const updatedAuth = { ...auth, user_id, is_ok: true };

    setAuth(updatedAuth);
    setSession({key: "session_auth", value: JSON.stringify(updatedAuth)});
    navigate(`/live/${updatedAuth.user}?key=${encodeURIComponent(updatedAuth.key)}`, { replace: true });

    } catch (err) { setError('Kapcsolati hiba. Próbáld újra.'); }
  }

  return (
    <div className='overlay'>
      <form onSubmit={handleLogin} className='form'>
        <h4>Bejelentkezés:</h4>

        <input
          type="text"
          placeholder="Túrázó:"
          value={auth.user ?? ''}
          onChange={e => setAuth(prev => ({ ...prev, user: e.target.value }))}
          className='input'
        />
        <input
          type="password"
          placeholder="Jelszó:"
          value={auth.key ?? ''}
          onChange={e => setAuth(prev => ({ ...prev, key: e.target.value }))}
          className='input'
        />

        {error && (
          <div className='error'>
            {error}
          </div>
        )}

        <button type="submit" className='btn'>
          OK
        </button>
      </form>
    </div>
  );
}