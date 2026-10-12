import { useState } from "react";
import Layout, { type PageId } from "./components/Layout";
import Login from "./pages/Login";
import Kanban from "./pages/Kanban";
import Solicitudes from "./pages/Solicitudes";
import Calendario from "./pages/Calendario";
import Usuarios from "./pages/Usuarios";
import Reportes from "./pages/Reportes";
import Solicitantes from "./pages/Solicitantes";
import Configuracion from "./pages/Configuracion";
import { AuthProvider } from "./context/AuthContext";
import type { Usuario } from "./data/mockData";

const LECTOR_PAGES: PageId[] = ["kanban", "solicitudes", "calendario"];

export default function App() {
  const [activePage, setActivePage] = useState<PageId>("kanban");
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);

  const handleLogin = (user: Usuario) => {
    setCurrentUser(user);
    setActivePage("kanban");
  };

  const handleNavigate = (page: PageId) => {
    if (!currentUser) return;
    if (currentUser.rol === "Lector" && !LECTOR_PAGES.includes(page)) return;
    setActivePage(page);
  };

  const handleLogout = () => setCurrentUser(null);

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case "kanban":        return <Kanban />;
      case "solicitudes":   return <Solicitudes />;
      case "calendario":    return <Calendario />;
      case "usuarios":      return <Usuarios />;
      case "reportes":      return <Reportes />;
      case "solicitantes":  return <Solicitantes />;
      case "configuracion": return <Configuracion />;
      default:              return <Kanban />;
    }
  };

  return (
    <AuthProvider user={currentUser}>
      <Layout activePage={activePage} onNavigate={handleNavigate} currentUser={currentUser} onLogout={handleLogout}>
        {renderPage()}
      </Layout>
    </AuthProvider>
  );
}
