import { Outlet, useLocation } from "react-router-dom";
import Header from "./header";

const Layout = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login" || location.pathname === "/admin/login";
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <div className="">
      {(!isLoginPage && !isAdminPage) && <Header />}

      <main className="">
        {children ?? <Outlet />}
      </main>
    </div>
  );
};

export default Layout;
