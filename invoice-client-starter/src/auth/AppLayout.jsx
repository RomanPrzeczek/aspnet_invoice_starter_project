import { Link, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";

import PersonIndex from "../persons/PersonIndex";
import PersonDetail from "../persons/PersonDetail";
import PersonForm from "../persons/PersonForm";
import InvoiceIndex from "../invoices/InvoiceIndex";
import InvoiceDetail from "../invoices/InvoiceDetail";
import InvoiceForm from "../invoices/InvoiceForm";
import StatisticsPage from "../components/statistics/StatisticsPage";

import Login from "./Login";
import Register from "./Register";
import PrivateRoute from "./PrivateRoute";
import { useAuth } from "./AuthContext";

const AppLayout = () => {
  const {user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(()=>{
    if(!isLoggedIn){
      navigate("/login");
    }
  },[isLoggedIn]);

  return (
    <div className="container mt-4 mb-4">
      <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
        <ul className="navbar-nav me-auto mb-2 mb-lg-0 d-flex flex-row gap-3">
          <li className="nav-item">
              <Link to="/persons" className="nav-link">Osoby</Link>
          </li>
          <li className="nav-item">
              <Link to="/invoices" className="nav-link">Faktury</Link>
          </li>
          <li className="nav-item">
              <Link to="/statistics" className="nav-link">Statistiky</Link>
          </li>
        </ul>
      </nav>

      {isLoggedIn && (
        <div className="alert alert-info d-flex justify-content-between align-items-center mt-3">
            <div>
                <strong>Přihlášen:</strong> {user?.email}{" "}
                {user?.isAdmin ? "(admin)" : ""}
            </div>
            <button className="btn btn-sm btn-outline-danger" onClick={logout}>
                Odhlásit se
            </button>
        </div>
      )}

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
        <Route path="*" element={<Navigate to="/persons" />} />
      </Routes>
    </div>
  );
};

export default AppLayout;