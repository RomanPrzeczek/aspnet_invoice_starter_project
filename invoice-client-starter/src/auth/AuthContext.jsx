import { createContext, useState, useContext, useEffect } from "react";
import PropTypes from "prop-types";
import { apiGet } from "../../src/utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [user, setUser] = useState(null); // 🆕 přidaný user

    const login = (token) => {
        setToken(token);
        localStorage.setItem("token", token);

        // 🍪 Cookies alternativa (zakomentováno)
        // setToken("cookieSession");
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");

        // 🍪 Cookies alternativa:
        // fetch("/api/auth", { method: "DELETE", credentials: "include" });
    };

    const fetchUser = async (tokenToUse) => {
        try {
            const data = await apiGet("/api/auth", {}, tokenToUse);
            setUser(data); // { userId, email, isAdmin }
        } catch (err) {
            console.warn("Nepodařilo se načíst přihlášeného uživatele:", err);
            logout(); // token může být neplatný
        }
    };

    useEffect(() => {
        if (token) {
            fetchUser(token);
        }
    }, [token]);

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                isLoggedIn: !!token,
                login,
                logout,
                isAdmin: user?.isAdmin
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