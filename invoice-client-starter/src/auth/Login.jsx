import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "./AuthContext";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const response = await fetch("/api/auth", {
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
            <h2>Přihlášení</h2>
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
                    <label>Heslo</label>
                    <input
                        type="password"
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary">
                    Přihlásit se
                </button>
            </form>
            <p className="mt-3">
                Ještě nemáte účet?{" "}
                <Link to="/register" className="btn btn-link p-0 align-baseline">
                    Zaregistrujte se zde
                </Link>
            </p>
        </div>
    );
};

export default Login;