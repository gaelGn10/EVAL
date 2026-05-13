import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import Transition from "../components/transitions/Transition";
import routes from "./routes";
import Layout from "../components/layouts/Layout";

// Composant pour protéger les routes privées
const RequireAuth = ({ children }) => {
  const token = sessionStorage.getItem("bagisto_client_token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

// Composant pour empêcher l'accès au Login si déjà connecté
const PublicOnly = ({ children }) => {
  const token = sessionStorage.getItem("bagisto_client_token");
  if (token) {
    return <Navigate to="/accueil" replace />;
  }
  return children;
};

// Composant pour protéger les routes admin
const RequireAdminAuth = ({ children }) => {
  const token = sessionStorage.getItem("bagisto_admin_token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  return children;
};

// Composant pour empêcher l'accès au Login admin si déjà connecté en tant qu'admin
const PublicAdminOnly = ({ children }) => {
  const token = sessionStorage.getItem("bagisto_admin_token");
  if (token) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
};

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<Layout />}>
          {/* Redirection automatique de la racine vers l'accueil */}
          <Route path="/" element={<Navigate to="/accueil" replace />} />

          {routes.map((route) => {
            const isUserLogin = route.path === "/login";
            const isAdminLogin = route.path === "/admin/login";
            const Component = route.component;
            
            // On saute la route "/" car on l'a gérée manuellement au-dessus
            if (route.path === "/") return null;

            return (
              <Route
                key={route.path}
                path={route.path}
                element={
                  isUserLogin ? (
                    <PublicOnly>
                      <Transition>
                        <Component />
                      </Transition>
                    </PublicOnly>
                  ) : isAdminLogin ? (
                    <PublicAdminOnly>
                      <Transition>
                        <Component />
                      </Transition>
                    </PublicAdminOnly>
                  ) : route.admin ? (
                    <RequireAdminAuth>
                      <Transition>
                        <Component />
                      </Transition>
                    </RequireAdminAuth>
                  ) : route.private ? (
                    <RequireAuth>
                      <Transition>
                        <Component />
                      </Transition>
                    </RequireAuth>
                  ) : (
                    <Transition>
                      <Component />
                    </Transition>
                  )
                }
              />
            );
          })}
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

export default AppRoutes;
