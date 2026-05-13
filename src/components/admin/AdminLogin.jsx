import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";

export default function AdminLogin() {
    const navigate = useNavigate();

    // Identifiants par défaut demandés par l'utilisateur
    const [email, setEmail] = useState("admin@example.com");
    const [password, setPassword] = useState("admin123");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Simulation de connexion admin (ou appel API si disponible)
        setTimeout(() => {
            if (email === "rambelosongael@gmail.com" && password === "bonjour7") {
                sessionStorage.setItem("bagisto_admin_token", "fake_admin_token_123");
                navigate("/admin/dashboard");
            } else {
                setError("Identifiants administrateur invalides.");
            }
            setLoading(false);
        }, 1000);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl"
            >
                <div className="text-center mb-10">
                    <div className="inline-block p-4 bg-blue-50 rounded-2xl mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Backoffice</h1>
                    <p className="text-gray-500 font-medium">Administration de la boutique</p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4 mb-2 block">Email Admin</label>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-50 border-2 border-transparent rounded-2xl p-4 focus:bg-white focus:border-blue-500 transition-all outline-none"
                                placeholder="admin@example.com"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4 mb-2 block">Mot de passe</label>
                            <input
                                required
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-50 border-2 border-transparent rounded-2xl p-4 focus:bg-white focus:border-blue-500 transition-all outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-500 text-sm font-bold rounded-2xl border border-red-100 flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-200 text-white font-black py-5 rounded-2xl text-lg transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            "ACCÉDER AU BACKOFFICE"
                        )}
                    </button>

                    <Link to="/accueil" className="block text-center text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors mt-4">
                        Retour à la boutique
                    </Link>
                </form>
            </motion.div>
        </div>
    );
}
