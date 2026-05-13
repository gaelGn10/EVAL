import { Link } from "react-router-dom";

export default function header(){

  return (
    <header className="flex justify-between items-center p-4 bg-white shadow-sm sticky top-0 z-50">
      <div className="flex gap-6 items-center">
        <Link to="/accueil" className="font-bold text-xl text-blue-600 tracking-tighter">BOUTIQUE</Link>
        <nav className="flex gap-4 text-sm font-medium text-gray-500">
          <Link to="/accueil" className="hover:text-blue-600 transition-colors">Accueil</Link>
        </nav>
      </div>

      <div className="flex items-center gap-6">
        <Link to="/cart" className="relative group p-2 hover:bg-blue-50 rounded-xl transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </Link>
        <Link to="/orders" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
          Mes Commandes
        </Link>
        <Link to="/login" className="text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
          Connexion
        </Link>
      </div>
    </header>
  )
};