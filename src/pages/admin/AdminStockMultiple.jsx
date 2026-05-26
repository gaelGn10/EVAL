import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function AdminStockMultiple() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    // 5 lignes par défaut
    const [rows, setRows] = useState(Array.from({ length: 5 }, () => ({ productId: "", quantity: "" })));

    // Récupération du token admin
    const SESSION_TOKEN = sessionStorage.getItem("bagisto_admin_token");
    const DEV_TOKEN = "41|Y8QQW9fezzEnu5uD3VTvuZvIt6uS1yKgqwdXidge18351ff3";
    const BASE_TOKEN = (SESSION_TOKEN && SESSION_TOKEN !== "fake_admin_token_for_ui") ? SESSION_TOKEN : DEV_TOKEN;

    const getValidAdminToken = async (forceRefresh = false) => {
        if (forceRefresh) {
            sessionStorage.removeItem("bagisto_real_admin_token");
        }
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

    const fetchProducts = async (isRetry = false) => {
        try {
            if (!isRetry) setLoading(true);
            const activeToken = await getValidAdminToken(isRetry);
            const response = await fetch("http://localhost:8008/api/v1/admin/catalog/products?limit=100", {
                headers: { "Accept": "application/json", "Authorization": `Bearer ${activeToken}` }
            });
            
            if (response.status === 401 && !isRetry) {
                console.warn("Jeton d'administration expiré ou invalide. Tentative de reconnexion...");
                return fetchProducts(true);
            }
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Erreur lors du chargement des produits");
            
            // Ne garder que les produits sans prix promotionnel
            const productsList = (result.data || []).filter(p => !p.special_price || parseFloat(p.special_price) === 0);
            setProducts(productsList);
        } catch (err) {
            setError(err.message);
        } finally {
            if (!isRetry) setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleRowChange = (index, field, value) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };
        setRows(newRows);
    };

    const handleSubmit = async () => {
        const activeToken = await getValidAdminToken();
        
        // Récupérer uniquement les lignes valides
        const validRows = rows.filter(r => r.productId && r.quantity && parseInt(r.quantity) > 0);
        
        if (validRows.length === 0) {
            alert("Veuillez remplir au moins une ligne avec un produit et une quantité à ajouter.");
            return;
        }

        setSaving(true);
        try {
            // Regrouper par produit au cas où l'utilisateur sélectionne le même produit sur plusieurs lignes
            const updates = {};
            validRows.forEach(row => {
                const qty = parseInt(row.quantity);
                if (updates[row.productId]) {
                    updates[row.productId] += qty;
                } else {
                    updates[row.productId] = qty;
                }
            });

            for (const [productId, addedQty] of Object.entries(updates)) {
                const product = products.find(p => p.id.toString() === productId.toString());
                if (!product) continue;

                const currentQty = product.inventories?.[0]?.qty ?? product.qty ?? 0;
                const newQty = parseInt(currentQty) + addedQty;

                const response = await fetch(`http://localhost:8008/api/v1/admin/catalog/products/${product.id}/inventories`, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json", 
                        "Accept": "application/json", 
                        "Authorization": `Bearer ${activeToken}` 
                    },
                    body: JSON.stringify({
                        inventories: {
                            "1": newQty
                        }
                    })
                });

                if (response.status === 401) {
                    throw new Error("Session expirée. Veuillez rafraîchir la page.");
                }

                if (!response.ok) {
                    const result = await response.json();
                    throw new Error(result.message || "Impossible de mettre à jour le stock du produit ID: " + product.id);
                }
            }

            alert("Les stocks ont été augmentés avec succès !");
            // Réinitialiser le formulaire
            setRows(Array.from({ length: 5 }, () => ({ productId: "", quantity: "" })));
            // Rafraîchir les produits pour avoir les nouveaux stocks
            fetchProducts();
        } catch (err) {
            alert("Erreur lors de la mise à jour : " + err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-gray-900 text-white p-6 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-4">
                    <Link to="/admin/dashboard" className="text-blue-400 font-bold hover:underline flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Dashboard
                    </Link>
                    <h1 className="text-xl font-black">Ajout Multiple au Stock</h1>
                </div>
            </header>

            <main className="max-w-5xl mx-auto w-full p-8 flex-grow">
                <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-sm overflow-hidden">
                    <div className="mb-8">
                        <h2 className="text-3xl font-black text-gray-900 mb-2">Ajouter du stock en masse</h2>
                        <p className="text-gray-500 font-medium">Sélectionnez jusqu'à 5 produits (hors promotion) et indiquez la quantité à ajouter à leur stock existant. Vous n'êtes pas obligé de remplir toutes les lignes.</p>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-400 font-bold text-lg uppercase tracking-wider animate-pulse">Chargement des produits...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 text-red-700 p-8 rounded-[2.5rem] border border-red-100 text-center max-w-xl mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h3 className="text-2xl font-black mb-2">Erreur</h3>
                            <p className="font-medium mb-4">{error}</p>
                            <button onClick={() => fetchProducts()} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg transition-all active:scale-95">Réessayer</button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {rows.map((row, index) => (
                                <div key={index} className="flex flex-col sm:flex-row items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-200 transition-all hover:border-blue-300">
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ligne {index + 1} - Produit</label>
                                        <select
                                            value={row.productId}
                                            onChange={(e) => handleRowChange(index, 'productId', e.target.value)}
                                            className="w-full bg-white border border-gray-300 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800 font-semibold cursor-pointer"
                                        >
                                            <option value="">-- Sélectionner un produit --</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} (SKU: {p.sku}) - Stock actuel: {p.inventories?.[0]?.qty ?? p.qty ?? 0}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-full sm:w-48">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Qté à ajouter</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={row.quantity}
                                            onChange={(e) => handleRowChange(index, 'quantity', e.target.value)}
                                            placeholder="Ex: 10"
                                            className="w-full bg-white border border-gray-300 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800 font-black text-center"
                                        />
                                    </div>
                                </div>
                            ))}

                            <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={handleSubmit}
                                    disabled={saving}
                                    className={`px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-95 flex items-center gap-3 ${
                                        saving 
                                            ? "bg-gray-400 text-white cursor-not-allowed" 
                                            : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-200"
                                    }`}
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Validation en cours...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Valider les ajouts de stock
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
