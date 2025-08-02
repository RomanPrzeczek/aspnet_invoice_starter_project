import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import {useTranslation} from "react-i18next";

const Login = () => {
    const {t} = useTranslation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();
    const apiBase = import.meta.env.VITE_API_BASE_URL;

    const handleSubmit = async (e) => {
        console.log("Z buildu API URL je:", import.meta.env.VITE_API_BASE_URL);
        e.preventDefault();
        const response = await fetch(`${apiBase}/api/auth`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password }),
            // credentials: "include" // 🍪 cookies varianta (zakomentováno)
        });

        if (response.ok) {
            const data = await response.json();
            login(data.token); // 🟢 JWT
            navigate("/persons"); // ✅ přesměrování po loginu

            // 🍪 cookies:
            // login(); // není potřeba token
            navigate("/"); // přesměrování po úspěšném loginu
        } else {
            alert("Přihlášení selhalo.");
        }
    };

    return (
        <div className="container mt-5">
            <h2> {t('Login')} </h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label>Email</label>
                    <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label> {t('Password')} </label>
                    <input
                        type="password"
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary">
                    {t('Login')}
                </button>
            </form>
            <p className="mt-3">
                {t('NoAccountYet')} {" "}
                <Link to="/register" className="btn btn-link p-0 align-baseline">
                    {t('RegisterHere')}
                </Link>
            </p>
        </div>
    );
};

export default Login;