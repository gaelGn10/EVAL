import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";

export default function AdminResetData() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleResetAll = () => {
        if (!confirm("Êtes-vous sûr de vouloir réinitialiser TOUTES les données ?")) return;
        setLoading("all");
        setTimeout(() => {
            localStorage.clear();
            sessionStorage.removeItem("bagisto_client_token");
            setLoading(false);
            showSuccess();
        }, 1500);
    };

    const handleResetClients = () => {
        if (!confirm("Réinitialiser uniquement les données clients (sessions, profils locaux) ?")) return;
        setLoading("clients");
        setTimeout(() => {
            localStorage.removeItem("user");
            sessionStorage.removeItem("bagisto_client_token");
            setLoading(false);
            showSuccess();
        }, 1000);
    };

    const handleResetProducts = () => {
        if (!confirm("Réinitialiser les données locales des produits (cache, panier) ?")) return;
        setLoading("products");
        setTimeout(() => {
            localStorage.removeItem("cart"); // Si le panier est en local
            setLoading(false);
            showSuccess();
        }, 1000);
    };

    const showSuccess = () => {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-gray-900 text-white p-4 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-4">
                    <Link to="/admin/dashboard" className="hover:text-blue-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <h1 className="text-xl font-bold tracking-tight">Gestion des Données</h1>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Reset Clients */}
                    <ResetCard 
                        title="Clients"
                        description="Déconnecte tous les clients et efface les profils mémorisés localement."
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                        color="blue"
                        onReset={handleResetClients}
                        loading={loading === "clients"}
                        success={success}
                    />

                    {/* Reset Products */}
                    <ResetCard 
                        title="Produits"
                        description="Vide le cache des produits et réinitialise le panier local."
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                        color="purple"
                        onReset={handleResetProducts}
                        loading={loading === "products"}
                        success={success}
                    />

                    {/* Reset All */}
                    <ResetCard 
                        title="Tout"
                        description="Réinitialisation complète de toutes les données stockées dans le navigateur."
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                        color="red"
                        onReset={handleResetAll}
                        loading={loading === "all"}
                        success={success}
                    />
                </div>

                <div className="mt-12 p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <h4 className="text-gray-900 font-bold mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Note sur la persistance
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                        Ces actions ciblent le <strong>stockage local du navigateur</strong>. Les données présentes sur votre serveur Bagisto (base de données SQL) ne seront pas affectées par ces boutons. Pour modifier les données réelles, utilisez l'interface d'administration native de Bagisto ou vos outils de gestion de base de données.
                    </p>
                </div>
            </main>
        </div>
    );
}

function ResetCard({ title, description, icon, color, onReset, loading, success }) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100",
        purple: "bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100",
        red: "bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
    };

    const btnClasses = {
        blue: "bg-blue-600 hover:bg-blue-700 shadow-blue-100",
        purple: "bg-purple-600 hover:bg-purple-700 shadow-purple-100",
        red: "bg-red-600 hover:bg-red-700 shadow-red-100"
    };

    return (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-colors ${colorClasses[color]}`}>
                {icon}
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 text-sm mb-8 h-12 leading-relaxed">
                {description}
            </p>
            <button
                onClick={onReset}
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    loading ? "bg-gray-200" : (success ? "bg-green-500" : btnClasses[color])
                }`}
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : success ? (
                    "EFFECTUÉ"
                ) : (
                    `Réinitialiser ${title}`
                )}
            </button>
        </div>
    );
   
}
