import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="w-full h-16 flex items-center justify-between px-0">
      <Link to="/">
        <h1 className="font-is-b text-2xl text-neutral-900">DOCS</h1>
      </Link>

      <nav className="flex items-center gap-2">
        <Link to="/users" className="btn btn-ghost btn-sm">
          Users
        </Link>
        <Link to="/documents" className="btn btn-ghost btn-sm">
          Documents
        </Link>

        {user ? (
          <>
            <Link to="/my-documents" className="btn btn-ghost btn-sm">
              Mes Docs
            </Link>
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-primary btn-sm">
                {user.name}
              </div>
              <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-50 w-40 p-2 shadow-lg">
                <li>
                  <button onClick={handleLogout}>Déconnexion</button>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">
              Login
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Inscription
            </Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
