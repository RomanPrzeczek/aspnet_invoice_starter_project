import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "./AuthContext";
import { apiGet, apiPost } from "../utils/api";
import eyeShow from "../assets/eye-password-show-svgrepo-com.svg";
import eyeHide from "../assets/eye-password-hide-svgrepo-com.svg";

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, refreshUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [errorMessage, setErrorMessage] = useState("");

  const timerRef = useRef(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(20);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Volitelná „pojistka“: před prvním POST si vyžádej CSRF token (api.js už to umí sám)
  async function ensureCsrf() {
    try {
      await apiGet("/api/csrf");
    } catch {
      /* ticho – api.js si CSRF primne sám při POST/PUT/DELETE */
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    startTimer();

    try {
      // (volitelné) – viz poznámku výš
      await ensureCsrf();

      // BE může vrátit buď { token } (JWT), nebo { ok:true, auth:"cookie" }
      const data = await apiPost("/api/auth", {
        email,
        password,
        useCookie: true, // říká BE preferuji cookie větev, pokud je povolená
      });

      if (data?.token) {
        // JWT větev (legacy / integrations)
        login(data.token);
      } else {
        // Cookie větev – server nastavil HttpOnly cookie
        login(null);
        await refreshUser(); // rovnou načíst /api/auth a dát usera do contextu
      }

      navigate("/persons");
    } catch (err) {
      console.error(err);
      setErrorMessage(t("LoginError"));
      setCountdown(0);
    } finally {
      stopTimer();
      setIsLoading(false);
    }
  };

  // úklid časovače při odmountování
  useEffect(() => () => stopTimer(), []);

  return (
    <div className="container mt-5">
      <h2>{t("Login")}</h2>

      {isLoading && (
        <div className="alert alert-info" role="alert">
          {t("LoginInProgress")} ({countdown} {t("SecondsLeft")})
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} autoComplete="on">
        <div className="mb-3">
          <label htmlFor="email">{t("Email") || "Email"}</label>
          <input
            id="email"
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username email"
            required
          />
        </div>

        <div className="mb-3 position-relative">
          <label htmlFor="password">{t("Password")}</label>
          <div className="position-relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="form-control pe-5"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="password-toggle-icon"
              aria-label={
                showPassword
                  ? t("HidePassword") || "Hide password"
                  : t("ShowPassword") || "Show password"
              }
              onClick={() => setShowPassword((s) => !s)}
              style={{ background: "transparent", border: 0, padding: 0 }}
            >
              <img src={showPassword ? eyeHide : eyeShow} alt="" />
            </button>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {t("Login")}
        </button>
      </form>

      <p className="mt-3">
        {t("NoAccountYet")}{" "}
        <Link to="/register" className="btn btn-link p-0 align-baseline">
          {t("RegisterHere")}
        </Link>
      </p>
    </div>
  );
};

export default Login;
