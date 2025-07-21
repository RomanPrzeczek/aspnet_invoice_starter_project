import { Link, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

import PersonIndex from "../persons/PersonIndex";
import PersonDetail from "../persons/PersonDetail";
import PersonForm from "../persons/PersonForm";
import InvoiceIndex from "../invoices/InvoiceIndex";
import InvoiceDetail from "../invoices/InvoiceDetail";
import InvoiceForm from "../invoices/InvoiceForm";
import StatisticsPage from "../components/statistics/StatisticsPage";
import AboutApp from "../components/AboutApp";

import Login from "./Login";
import Register from "./Register";
import PrivateRoute from "./PrivateRoute";
import { useAuth } from "./AuthContext";

const AppLayout = () => {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAboutApp = location.pathname === "/aboutApp";
  const toggleRoute = isAboutApp ? "/login" : "/aboutApp";
  const toggleLabel = isAboutApp ? "/ Přihlášení" : "/ O aplikaci";

  useEffect(() => {
    if (!isLoggedIn && location.pathname !== "/aboutApp") {
      navigate("/login");
    }
  }, [isLoggedIn]);

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow">
        <div className="container-fluid">
          <Link to={toggleRoute} className="navbar-brand fw-bold">
            InvoiceApp <span className="text-light ms-2">{toggleLabel}</span>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            {isLoggedIn && (
              <>
                <ul className="navbar-nav me-auto mb-2 mb-lg-0 d-flex gap-2">
                  <li className="nav-item">
                    <Link
                      to="/persons"
                      className={`nav-link fw-semibold text-white px-3 py-2 rounded nav-highlight ${
                        location.pathname.startsWith("/persons") ? "active" : ""
                      }`}
                    >
                      👤 Osoby
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/invoices"
                      className={`nav-link fw-semibold text-white px-3 py-2 rounded nav-highlight ${
                        location.pathname.startsWith("/invoices") ? "active" : ""
                      }`}
                    >
                      🧾 Faktury
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/statistics"
                      className={`nav-link fw-semibold text-white px-3 py-2 rounded nav-highlight ${
                        location.pathname.startsWith("/statistics") ? "active" : ""
                      }`}
                    >
                      📊 Statistiky
                    </Link>
                  </li>
                </ul>

                <span className="navbar-text me-3 text-white">
                  Přihlášen: {user?.email} {user?.isAdmin ? "(admin)" : ""}
                </span>
                <button className="btn btn-outline-light btn-sm" onClick={logout}>
                  Odhlásit se
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* OBSAH */}
      <div className="container mt-4 mb-5">
        <div className="card border-0 shadow rounded-4">
          <div className="card-header bg-primary text-white fw-semibold fs-5 rounded-top-4">
            Obsah sekce
          </div>
          <div className="card-body">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/persons/*"
                element={
                  <PrivateRoute>
                    <Routes>
                      <Route index element={<PersonIndex />} />
                      <Route path="show/:id" element={<PersonDetail />} />
                      <Route path="create" element={<PersonForm />} />
                      <Route path="edit/:id" element={<PersonForm />} />
                    </Routes>
                  </PrivateRoute>
                }
              />
              <Route
                path="/invoices/*"
                element={
                  <PrivateRoute>
                    <Routes>
                      <Route index element={<InvoiceIndex />} />
                      <Route path="show/:id" element={<InvoiceDetail />} />
                      <Route path="create" element={<InvoiceForm />} />
                      <Route path="edit/:id" element={<InvoiceForm />} />
                    </Routes>
                  </PrivateRoute>
                }
              />
              <Route
                path="/statistics"
                element={
                  <PrivateRoute>
                    <StatisticsPage />
                  </PrivateRoute>
                }
              />
              <Route path="/aboutApp" element={<AboutApp />} />
              <Route path="*" element={<Navigate to="/persons" />} />
            </Routes>
          </div>
        </div>
      </div>
    </>
  );
};

export default AppLayout;
