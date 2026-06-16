import React, { useEffect, useRef, useState } from 'react';
import { useReducer } from "react";
import { useNavigate } from 'react-router-dom';
import { checkUser } from '../../services/LoginSupabase';
import './Login.css';

export default function Login({auth, setAuth}) {

  const initialAuth = {...auth, error: ""};
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.user ?? '');
  const [key, setKey] = useState(auth.key ?? '');
  const [authLogin, dispatchAuth] = useReducer(authReducer, initialAuth);
  function authReducer(state, action) {
    switch (action.type) {
      case "ERROR":
        return {...state, error: action.payload.error};
      case "SUCCESS":
        return {...state, user_id: action.payload.user_id, user: action.payload.user, key: action.payload.key, is_ok: true};

      default: return state;
    }
  }

 async function handleLogin (e) {
    e.preventDefault();

    if(!user || !key) {
      dispatchAuth({type: "ERROR",payload: { error: "Hiányzó adatok" }});
      return;
    }

    try {
      const liveKey = import.meta.env.VITE_LIVE_KEY;
      const live_user = await checkUser(user);

      if (live_user?.id && key === liveKey) {
        dispatchAuth({type: "SUCCESS",payload: { user_id: live_user.id, user: user, key: key }});
      } else {
        dispatchAuth({type: "ERROR",payload: { error: "Téves user vagy jelszó" }});
      }

    } catch (err) {
      console.log(err);
      dispatchAuth({type: "ERROR",payload: { error: "Adatbázis hiba" }});
    }
  };

  useEffect(() => {
    if(authLogin.is_ok){
      setAuth({user_id: authLogin.user_id, user: authLogin.user, is_ok: true});
      
      let session_auth = sessionStorage.getItem("session_auth");
      if(!session_auth){
        session_auth = true;
        sessionStorage.setItem("session_auth", session_auth);
      }

      navigate(`/live/${authLogin.user}?key=${encodeURIComponent(authLogin.key)}`, { replace: true });
    }
  },[authLogin.is_ok])

  return (
    <div className='overlay'>
      <form onSubmit={handleLogin} className='form'>
        <h4>Login:</h4>
        <input 
          type="text" placeholder="Túrázó:" 
          value={user} onChange={e => setUser(e.target.value)}
          className='input'
        />
        <input 
          type="password" placeholder="Jelszó:" 
          value={key} onChange={e => setKey(e.target.value)}
          className='input'
        />
        <br/>
        {authLogin.error !== "" && <div className='error'>{authLogin.error}</div>}
         <button type="submit" className='btn'>Belépés</button>
      </form>
    </div>
  )
}