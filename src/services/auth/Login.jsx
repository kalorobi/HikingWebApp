import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../SupabaseClient";
import "./Login.css";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();
    const location = useLocation();

    async function login() {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            alert(error.message);
            return;
        }

        navigate(location.state?.from || "/dashboard");
    }

    return (
        <div className="login-page">
            <div className="login-box">
                <h2 className="login-h2">Bejelentkezés</h2>

                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email cím"
                />

                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Jelszó"
                />

                <button onClick={login}>
                    Belépés
                </button>
            </div>
        </div>
    );
}