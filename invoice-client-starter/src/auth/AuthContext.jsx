import { createContext, useState, useContext, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { apiGet, apiDelete } from "../../src/utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);

  // Přepínač mezi JWT (token) a cookie větví:
  const login = (newToken) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
      setToken(newToken);
    } else {
      localStorage.removeItem("token");
      setToken(null);
    }
  };

  const logout = async () => {
    try {
      // v cookie režimu smaže cookie, v JWT režimu 204/401 nevadí
      await apiDelete("/api/auth", token || undefined);
    } catch (_) {
      /* nic – nechceme strašit uživatele */
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  const fetchUser = async () => {
    try {
      // v JWT režimu pošleme token, v cookie režimu se použije cookie (credentials in api.js)
      const data = await apiGet("/api/auth", {}, token || undefined);
      setUser(data); // { _id, email, isAdmin }
    } catch (err) {
      // 401/403 apod.: vyčistíme případný prošlý token, user = null
      setUser(null);
      if (token) {
        localStorage.removeItem("token");
        setToken(null);
      }
    }
  };

  // Jednorázový bootstrap – zkusí načíst uživatele (cookie session)
  const bootstrapped = useRef(false);
  useEffect(() => {
    if (!bootstrapped.current) {
      bootstrapped.current = true;
      fetchUser();
    }
  }, []);

  // Když se změní token (JWT login), znovu načti uživatele
  useEffect(() => {
    if (token) fetchUser();
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoggedIn: Boolean(user) || Boolean(token),
        isAdmin: Boolean(user?.isAdmin),
        login,
        logout,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);