import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiPost } from "../utils/api";
import { useAuth } from "./AuthContext";

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    startTimer();

    try {
      // BE vrací buď { token } (JWT), nebo { ok: true, auth: "cookie" }
      const data = await apiPost("/api/auth", { email, password });

      if (data?.token) {
        // JWT varianta
        login(data.token);
      } else {
        // Cookie varianta – BE nasetoval HttpOnly cookie
        login(null);
        await refreshUser(); // okamžitě načti usera z cookie session
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

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="email">{t("Email") || "Email"}</label>
          <input
            id="email"
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
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
              aria-label={showPassword ? t("HidePassword") || "Hide password" : t("ShowPassword") || "Show password"}
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