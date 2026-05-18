import { Link, useNavigate, useLocation } from "react-router-dom";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = sessionStorage.getItem("bagisto_client_token");
  const { wishlist } = useWishlist();
  const { logout } = useAuth();
  
  const isAdminPath = location.pathname.startsWith("/admin");

  const handleLogout = () => {
    if (isAdminPath) {
      sessionStorage.removeItem("bagisto_admin_token");
      navigate("/admin/login");
    } else {
      sessionStorage.removeItem("bagisto_client_token");
      logout();
      navigate("/login");
    }
  };

  return (
    <header className="flex justify-between items-center p-4 bg-white shadow-sm sticky top-0 z-50">
      <div className="flex gap-6 items-center">
        <Link to={isAdminPath ? "/admin/dashboard" : "/accueil"} className="font-bold text-xl text-blue-600 tracking-tighter">
          {isAdminPath ? "ADMINISTRATION" : "BOUTIQUE"}
        </Link>
        {!isAdminPath && (
          <nav className="flex gap-4 text-sm font-medium text-gray-500">
            <Link to="/accueil" className="hover:text-blue-600 transition-colors">Accueil</Link>
          </nav>
        )}
      </div>

      <div className="flex items-center gap-6">
        {!isAdminPath && (
          <>
            <Link to="/wishlist" className="relative group p-2 hover:bg-red-50 rounded-xl transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 group-hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link to="/cart" className="relative group p-2 hover:bg-blue-50 rounded-xl transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </Link>
            <Link to="/orders" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
              Mes Commandes
            </Link>
          </>
        )}
        
        {((!isAdminPath && token) || (isAdminPath && sessionStorage.getItem("bagisto_admin_token"))) ? (
          <button 
            onClick={handleLogout}
            className="text-sm font-bold text-red-600 hover:text-red-700 hover:bg-red-50 transition-all bg-gray-50 px-4 py-2 rounded-xl border border-gray-100"
          >
            Déconnexion
          </button>
        ) : (
          <Link to={isAdminPath ? "/admin/login" : "/login"} className="text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
            Connexion
          </Link>
        )}
      </div>
    </header>
  );
}