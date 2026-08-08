import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkUser } from '../../services/supabase/LoginSupabase';
import { setSession } from '../../services/indexedDb/Storage';
import './LiveLogin.css';

// a sessionStorage cache-kulcsot a userhez kötjük, NEM egyetlen globális
// "session_auth" kulcsot használunk mindenkire - így ha valaki egymás után
// több túrázó linkjét/kódját nyitja meg ugyanabban a böngészőben (pl. családi
// gépen), nem kaphatja vissza tévedésből egy MÁSIK user korábban cache-elt
// auth-ját.
function sessionCacheKey(user) {
  return `session_auth:${user}`;
}

export default function LiveLogin({ auth, setAuth }) {
  const navigate = useNavigate();
  const [userName, setUserName] = useState(auth.user ?? '');
  const [password, setPassword] = useState(auth.key ?? '');
  const [error, setError] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  // közös belépési logika - ugyanezt hívja a linkből (URL user+key) érkező
  // automatikus ellenőrzés ÉS a telefonon lediktálva, kézzel beírt user+key is.
  // shouldNavigate: csak kézi beírásnál írjuk át az URL-t /live/:user?key=...-re
  // (hogy F5 után is működjön) - linkből érkezéskor már ott van, nincs mit átírni.
  async function attemptLogin(userVal, keyVal, { shouldNavigate }) {
    if (!userVal || !keyVal) return;

    const cached = sessionStorage.getItem(sessionCacheKey(userVal));
    if (cached) {
      const parsed = JSON.parse(cached);
      // csak akkor fogadjuk el a cache-t, ha a kód is egyezik - ha ugyanahhoz
      // a userhez időközben MÁS kódot osztottak ki (pl. csere/visszavonás),
      // a cache ne írja felül csendben az új próbálkozást
      if (parsed.key === keyVal) {
        setAuth(parsed);
        if (shouldNavigate) {
          navigate(`/live/${userVal}?key=${encodeURIComponent(keyVal)}`, { replace: true });
        }
        return;
      }
    }

    setIsChecking(true);
    setError(null);
    try {
      const userId = await checkUser(userVal, keyVal);
      if (!userId) {
        setError('Hibás felhasználónév vagy kód.');
        return;
      }

      const updatedAuth = { user: userVal, key: keyVal, user_id: userId, is_ok: true };
      setAuth(updatedAuth);
      setSession({ key: sessionCacheKey(userVal), value: JSON.stringify(updatedAuth) });

      if (shouldNavigate) {
        navigate(`/live/${userVal}?key=${encodeURIComponent(keyVal)}`, { replace: true });
      }
    } catch {
      setError('Kapcsolati hiba. Próbáld újra.');
    } finally {
      setIsChecking(false);
    }
  }

  // linkből (URL user+key) érkező automatikus ellenőrzés, csak mountkor
  useEffect(() => {
    if (auth.user && auth.key && !auth.is_ok) {
      attemptLogin(auth.user, auth.key, { shouldNavigate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    attemptLogin(userName, password, { shouldNavigate: true });
    //attemptLogin(auth.user, auth.key, { shouldNavigate: true });
  }

  return (
    <div className='overlay'>
      <form onSubmit={handleSubmit} className='form'>
        <h4>Bejelentkezés:</h4>

        <input
          type="text"
          placeholder="Túrázó:"
          value={userName}
          onChange={e => setUserName(e.target.value)}
          className='input'
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="Jelszó:"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className='input'
          autoComplete="off"
        />

        {error && (
          <div className='loginError'>
            {error}
          </div>
        )}

        <button type="submit" className='btn' disabled={isChecking}>
          {isChecking ? 'Ellenőrzés...' : 'OK'}
        </button>
      </form>
    </div>
  );
}