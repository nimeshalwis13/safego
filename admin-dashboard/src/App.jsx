import React, { useState } from "react";
import { Toaster } from "react-hot-toast";
import AdminLogin from "./components/AdminLogin";
import Dashboard from "./components/Dashboard";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  const handleLogin = (user) => {
    setIsAuthenticated(true);
    setAdminUser(user);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminUser(null);
  };

  return (
    <div>
      {!isAuthenticated ? (
        <AdminLogin onLogin={handleLogin} />
      ) : (
        <Dashboard adminUser={adminUser} onLogout={handleLogout} />
      )}
      <Toaster position="top-right" />
    </div>
  );
}

export default App;