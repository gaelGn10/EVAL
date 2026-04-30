import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import Transition from "../components/transitions/Transition";
import routes from "./routes";
import Layout from "../components/layouts/Layout";

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<Layout />}>
          {routes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <Transition>
                  <route.component />
                </Transition>
              }
            />
          ))}
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

export default AppRoutes;
