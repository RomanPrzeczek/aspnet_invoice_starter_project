import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {useTranslation} from "react-i18next";

import { useAuth } from "./AuthContext";
import eyeShow  from '../assets/eye-password-show-svgrepo-com.svg'
import eyeHide  from '../assets/eye-password-hide-svgrepo-com.svg'
import { apiPost } from "../utils/api"; 

const Login = () => {
    const [countdown, setCountdown] = useState(10);
    const [showPassword,setShowPassword] = useState(false);
    const [isLoading,setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const {t} = useTranslation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();
    //const apiBase = import.meta.env.VITE_API_BASE_URL;

    const handleSubmit = async (e) => {
        //console.log("Z buildu API URL je:", import.meta.env.VITE_API_BASE_URL);
        e.preventDefault();
        setCountdown(20);
        setIsLoading(true);

        const interval = setInterval(() => {
        setCountdown((prev) => {
            if (prev <= 1) {
            clearInterval(interval);
            return 0;
            }
            return prev - 1;
        });
        }, 1000);

        try {
            // 1) preffered endpoint for cookie login (will be added)
            // Fáze 0: BE má JWT login na /api/auth (cookie login zatím není)
            const data = await apiPost("/api/auth", { email, password });

            // JWT variant (when BE returns token)
            if (data?.token) {
                login(data.token);
            } else {
            // cookie variant (SignInAsync sets HttpOnly cookie)
                login();
            }
            navigate("/persons");
        } catch (error) {
            console.error(error);
            setErrorMessage(t("LoginError"));
            setIsLoading(false);
            setCountdown(0);
        }
    };

    return (
        <div className="container mt-5">
            <h2> {t('Login')} </h2>
            {isLoading && (
            <div className="alert alert-info" role="alert">
                {t('LoginInProgress')} ({countdown} {t('SecondsLeft')})
            </div>
            )}

            {errorMessage && (
            <div className="alert alert-danger" role="alert">
                {errorMessage}
            </div>
            )}
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
                <div className="mb-3 position-relative">
                    <label> {t('Password')} </label>
                    <div className="position-relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            className="form-control pe-5"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <img
                            src={showPassword ? eyeHide : eyeShow}
                            alt={showPassword ? "Skrýt heslo" : "Zobrazit heslo"}
                            onClick={() => setShowPassword(!showPassword)}
                            className="password-toggle-icon"
                        />
                    </div>
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