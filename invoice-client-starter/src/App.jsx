import "bootstrap/dist/css/bootstrap.min.css";
import {
  BrowserRouter as Router,
} from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext";
import AppLayout from "./auth/AppLayout";

export function App() {
  return (
    <Router>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </Router>
  );
}

export default App;