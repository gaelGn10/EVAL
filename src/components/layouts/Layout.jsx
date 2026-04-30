import { Outlet } from "react-router-dom";
import Nav from "./nav/main/Nav";

const Layout = ({ children }) => {
  return (
    <div data-theme="light" className="min-h-screen max-h-screen min-w-screen overflow-y-hidden flex font-inter text-neutral-800 p-2">
      <Nav />

      <main className="flex-1 relative overflow-x-hidden flex flex-col items-center w-full max-h-full">
        {children ?? <Outlet />}
      </main>
    </div>
  );
};

export default Layout;
