import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useMutation } from "../../hooks/useHttpRequest";
import { motion } from "motion/react";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const { mutate } = useMutation("http://localhost:8008/api/v1/customer/login");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await mutate({
                email,
                password,
                device_name: "web"
            });
            
            if (res?.token) {
                sessionStorage.setItem("bagisto_client_token", res.token);
                // Sauvegarder l'utilisateur dans le contexte pour l'utiliser ailleurs (ex: Orders.jsx)
                login({ email: email, ...res.customer }); 
                
                // Rediriger vers la page demandée ou par défaut vers l'accueil
                const from = location.state?.from?.pathname || "/accueil";
                navigate(from, { replace: true });
            } else {
                setError("Identifiants invalides ou erreur serveur.");
            }
        } catch (err) {
            console.error(err);
            setError("Impossible de se connecter. Vérifiez vos accès.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl border border-gray-100"
            >
                <div className="text-center mb-10 relative">
                    <Link 
                        to="/accueil" 
                        className="absolute left-0 top-0 text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1 text-sm font-bold group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Retour
                    </Link>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Bienvenue</h1>
                    <p className="text-gray-500 font-medium">Connectez-vous pour accéder à la boutique</p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="relative group">
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-50 border-2 border-transparent rounded-2xl p-4 focus:bg-white focus:border-blue-500 focus:ring-0 transition-all outline-none"
                                placeholder="Adresse email"
                            />
                        </div>

                        <div className="relative group">
                            <input
                                required
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-50 border-2 border-transparent rounded-2xl p-4 focus:bg-white focus:border-blue-500 focus:ring-0 transition-all outline-none"
                                placeholder="Mot de passe"
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 bg-red-50 text-red-500 text-sm font-bold rounded-2xl border border-red-100 flex items-center gap-3"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </motion.div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white font-black py-5 rounded-2xl text-lg transition-all shadow-xl shadow-blue-100 active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            "SE CONNECTER"
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-gray-400 text-sm font-medium uppercase tracking-widest">
                        Evaluation Frontend • Bagisto
                    </p>
                </div>
            </motion.div>
        </div>
    );
}