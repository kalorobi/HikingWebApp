import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkUser } from '../../services/supabase/LoginSupabase';
import { setSession } from '../../services/indexedDb/Storage';
import './LiveLogin.css';

export default function LiveLogin({ auth, setAuth }) {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    async function LoginUser() {
    if(auth.user && auth.key) {
      const sessionAuth = sessionStorage.getItem("session_auth");
      if(sessionAuth){
        setAuth(JSON.parse(sessionAuth));
        return;
      }
      else {
        handleLogin();
    }
  }
  }
  LoginUser();

  },[]);

  async function handleLogin(e) {
    e?.preventDefault();
    try {
        const userId = await checkUser(auth.user, auth.key);

        if(userId){
          const updatedAuth = { ...auth, user_id: userId, is_ok: true };

          setAuth(updatedAuth);
          setSession({key: "session_auth", value: JSON.stringify(updatedAuth)});
          navigate(`/live/${updatedAuth.user}?key=${encodeURIComponent(updatedAuth.key)}`, { replace: true });
        } else {
          setError('Hibás felhasználónév vagy jelszó.');
        }
      } catch (err) { setError('Kapcsolati hiba. Próbáld újra.');}
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