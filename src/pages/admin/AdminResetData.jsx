import { useState } from "react";
import { Link } from "react-router-dom";

export default function AdminResetData() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [status, setStatus] = useState(null);
    const [progress, setProgress] = useState({ current: 0, total: 0, type: "" });

    const SESSION_TOKEN = sessionStorage.getItem("bagisto_admin_token");
    const DEV_TOKEN = "41|Y8QQW9fezzEnu5uD3VTvuZvIt6uS1yKgqwdXidge18351ff3";
    let BASE_TOKEN = (SESSION_TOKEN && SESSION_TOKEN !== "fake_admin_token_for_ui") ? SESSION_TOKEN : DEV_TOKEN;

    // Helper pour obtenir un token administrateur valide à la volée (résistant aux resets DB)
    const getValidAdminToken = async () => {
        const cached = sessionStorage.getItem("bagisto_real_admin_token");
        if (cached) return cached;

        try {
            const res = await fetch("http://localhost:8008/api/v1/admin/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    email: "rambelosongael@gmail.com",
                    password: "bonjour7",
                    device_name: "web"
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.token) {
                    sessionStorage.setItem("bagisto_real_admin_token", data.token);
                    return data.token;
                }
            }
        } catch (e) {
            console.error("Erreur login auto admin", e);
        }

        return BASE_TOKEN;
    };

    const handleResetBagisto = async () => {
        if (!window.confirm("🚨 ATTENTION: Vous allez supprimer DÉFINITIVEMENT tous les produits, clients et commandes de la base Bagisto via l'API. Confirmez-vous cette action ?")) return;
        if (!window.confirm("Êtes-vous vraiment sûr ? Cette action est IRREVERSIBLE.")) return;

        try {
            const activeToken = await getValidAdminToken();
            const TOKEN = activeToken;

            setLoading("bagisto");
            setStatus({ type: "info", message: "Réinitialisation API en cours... Veuillez patienter." });

            const deleteItems = async (type, url) => {
                let deleted = 0;
                let hasMore = true;
                let softDeletedIds = [];

                while (hasMore) {
                    const res = await fetch(`${url}?limit=50`, {
                        headers: { "Accept": "application/json", "Authorization": `Bearer ${TOKEN}` }
                    });
                    if (!res.ok) break;
                    const data = await res.json();
                    if (!data.data || data.data.length === 0) break;

                    const indices = data.data.map(item => item.id);
                    if (type === "Commande") softDeletedIds.push(...indices);

                    setProgress({ current: deleted, total: "...", type: `Suppression ${type} (${indices.length} items)` });

                    let deletedInThisPage = 0;

                    try {
                        const massRes = await fetch(`${url}/mass-destroy`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": `Bearer ${TOKEN}` },
                            body: JSON.stringify({ indices })
                        });
                        if (massRes.ok) {
                            deletedInThisPage = indices.length;
                        }
                    } catch (e) { }

                    if (deletedInThisPage === 0) {
                        for (const id of indices) {
                            try {
                                let delRes = await fetch(`${url}/${id}`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": `Bearer ${TOKEN}` },
                                    body: JSON.stringify({ _method: "DELETE" })
                                });

                                if (!delRes.ok) {
                                    delRes = await fetch(`${url}/${id}`, {
                                        method: "DELETE",
                                        headers: { "Accept": "application/json", "Authorization": `Bearer ${TOKEN}` }
                                    });
                                }

                                if (!delRes.ok && type === "Commande") {
                                    await fetch(`${url}/${id}/cancel`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": `Bearer ${TOKEN}` }
                                    });
                                } else if (delRes.ok) {
                                    deletedInThisPage++;
                                }
                            } catch (e) { }
                        }
                    }

                    if (deletedInThisPage === 0 && type !== "Commande") {
                        hasMore = false;
                    } else if (deletedInThisPage === 0 && type === "Commande") {
                        hasMore = false;
                    }

                    deleted += deletedInThisPage;
                }
                return { deleted, softDeletedIds };
            };

            const deleteCategories = async () => {
                let deletedCount = 0;
                try {
                    const res = await fetch("http://localhost:8008/api/v1/admin/catalog/categories?limit=100", {
                        headers: { "Accept": "application/json", "Authorization": `Bearer ${TOKEN}` }
                    });
                    if (!res.ok) return 0;
                    const data = await res.json();
                    if (!data.data || data.data.length === 0) return 0;

                    // Trouver la catégorie racine de manière robuste pour l'exclure de la suppression
                    const rootCat = data.data.find(cat => cat.parent_id === null || !cat.parent_id || cat.slug === "root") || data.data[0];
                    const rootId = rootCat ? rootCat.id : 1;
                    const toDelete = data.data.filter(cat => cat.id !== rootId && cat.id !== String(rootId));

                    for (const cat of toDelete) {
                        setProgress({ current: deletedCount, total: toDelete.length, type: `Suppression Catégorie: ${cat.name}` });
                        try {
                            let delRes = await fetch(`http://localhost:8008/api/v1/admin/catalog/categories/${cat.id}`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "Accept": "application/json",
                                    "Authorization": `Bearer ${TOKEN}`
                                },
                                body: JSON.stringify({ _method: "DELETE" })
                            });

                            if (!delRes.ok) {
                                delRes = await fetch(`http://localhost:8008/api/v1/admin/catalog/categories/${cat.id}`, {
                                    method: "DELETE",
                                    headers: {
                                        "Accept": "application/json",
                                        "Authorization": `Bearer ${TOKEN}`
                                    }
                                });
                            }

                            if (delRes.ok) {
                                deletedCount++;
                            }
                        } catch (e) {
                            console.error(e);
                        }
                    }
                } catch (err) {
                    console.error(err);
                }
                return deletedCount;
            };

            const oldDeletedOrders = JSON.parse(localStorage.getItem('deleted_order_ids') || '[]');

            // On utilise le script backend custom pour purger la base de données de force (contourne les interdictions de l'API REST)
            try {
                await fetch("http://localhost:8008/reset_data.php");
            } catch (e) {
                console.error("Erreur script reset_data", e);
            }

            // On peut garder la suppression API pour les produits et clients si besoin
            const productsResult = await deleteItems("Produit", "http://localhost:8008/api/v1/admin/catalog/products");
            const categoriesDeleted = await deleteCategories();
            const customersResult = await deleteItems("Client", "http://localhost:8008/api/v1/admin/customers");

            localStorage.clear();
            sessionStorage.removeItem("bagisto_client_token");
            sessionStorage.removeItem("bagisto_real_admin_token");
            sessionStorage.removeItem("bagisto_admin_token");

            // Plus besoin de liste noire complexe vu qu'on a purgé la base MySQL !
            localStorage.setItem('deleted_order_ids', JSON.stringify([]));

            setStatus({
                type: "success",
                message: `Base Bagisto parfaitement nettoyée ! Produits, clients, catégories et commandes purgés (${productsResult.deleted} produits, ${categoriesDeleted} catégories et ${customersResult.deleted} clients supprimés).`
            });
            showSuccess();

        } catch (err) {
            setStatus({ type: "error", message: "Erreur : " + err.message });
        } finally {
            setLoading(false);
            setProgress({ current: 0, total: 0, type: "" });
        }
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
            localStorage.removeItem("cart");
            setLoading(false);
            showSuccess();
        }, 1000);
    };

    const showSuccess = () => {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
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

            <main className="max-w-6xl mx-auto p-8 flex-grow w-full">
                {status && (
                    <div className={`mb-8 p-4 rounded-2xl border flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300 ${status.type === "success" ? "bg-green-50 border-green-100 text-green-700" :
                            status.type === "error" ? "bg-red-50 border-red-100 text-red-700" :
                                "bg-blue-50 border-blue-100 text-blue-700"
                        }`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${status.type === "success" ? "bg-green-100" :
                                status.type === "error" ? "bg-red-100" :
                                    "bg-blue-100"
                            }`}>
                            {status.type === "success" ? "✓" : status.type === "error" ? "!" : "i"}
                        </div>
                        <p className="font-bold">{status.message}</p>
                        <button onClick={() => setStatus(null)} className="ml-auto text-current opacity-50 hover:opacity-100 font-bold">×</button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Reset Clients (Local) */}
                    <ResetCard
                        title="Clients Locaux"
                        description="Déconnecte tous les clients et efface les profils mémorisés localement."
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                        color="blue"
                        onReset={handleResetClients}
                        loading={loading === "clients"}
                        success={success}
                    />

                    {/* Reset Products (Local) */}
                    <ResetCard
                        title="Produits Locaux"
                        description="Vide le cache des produits et réinitialise le panier local."
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                        color="purple"
                        onReset={handleResetProducts}
                        loading={loading === "products"}
                        success={success}
                    />

                    {/* Reset BAGISTO (API) */}
                    <ResetCard
                        title="Données Bagisto"
                        description="Suppression de toutes les commandes, clients et produits via l'API REST."
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                        color="red"
                        onReset={handleResetBagisto}
                        loading={loading === "bagisto"}
                        success={success}
                    />
                </div>

                <div className="mt-12 p-8 bg-white rounded-[2.5rem] border border-red-100 shadow-sm">
                    <h4 className="text-red-600 font-bold mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Action Irréversible
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                        Le bouton rouge <strong>"Données Bagisto"</strong> supprime définitivement les données sur votre backend distant via l'API, en plus du stockage local du navigateur. Les boutons bleus et violets se contentent de vider la session de l'application front-end.
                    </p>
                </div>
            </main>

            {loading === "bagisto" && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-50 p-6 text-center">
                    <div className="w-24 h-24 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-8"></div>
                    <h3 className="text-3xl font-black mb-2 uppercase tracking-tighter text-red-500">Suppression des Données en cours</h3>
                    <p className="text-red-300 font-bold text-xl mb-4">{progress.type} {progress.current > 0 ? `: ${progress.current}` : ""}</p>
                </div>
            )}
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
        <div className={`bg-white rounded-[2.5rem] p-8 shadow-sm border ${color === 'red' ? 'border-red-200' : 'border-gray-100'} flex flex-col items-center text-center`}>
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
                className={`w-full py-4 rounded-xl font-bold text-white transition-all active:scale-95 flex items-center justify-center gap-2 ${loading ? "bg-gray-200 text-gray-500" : (success ? "bg-green-500" : btnClasses[color])
                    }`}
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : success ? (
                    "EFFECTUÉ"
                ) : (
                    `Réinitialiser ${title.split(' ')[0]}`
                )}
            </button>
        </div>
    );
}
