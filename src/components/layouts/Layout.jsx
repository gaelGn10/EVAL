import { Outlet, useLocation } from "react-router-dom";
import Header from "./header";

const Layout = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="">
      {!isLoginPage && <Header />}

      <main className="">
        {children ?? <Outlet />}
      </main>
    </div>
  );
};

export default Layout;
