import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function AdminStock() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [savingId, setSavingId] = useState(null);
    const [localStocks, setLocalStocks] = useState({}); // stock local en cours d'édition { productId: qty }

    // Récupération du token admin
    const SESSION_TOKEN = sessionStorage.getItem("bagisto_admin_token");
    const DEV_TOKEN = "41|Y8QQW9fezzEnu5uD3VTvuZvIt6uS1yKgqwdXidge18351ff3";
    const TOKEN = (SESSION_TOKEN && SESSION_TOKEN !== "fake_admin_token_for_ui") ? SESSION_TOKEN : DEV_TOKEN;

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch("http://localhost:8008/api/v1/admin/catalog/products?limit=100", {
                headers: { "Accept": "application/json", "Authorization": `Bearer ${TOKEN}` }
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Erreur lors du chargement des produits");
            
            const productsList = result.data || [];
            setProducts(productsList);

            // Initialiser les stocks locaux
            const stocks = {};
            productsList.forEach(p => {
                const qty = p.inventories?.[0]?.qty ?? p.qty ?? 0;
                stocks[p.id] = qty;
            });
            setLocalStocks(stocks);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleUpdateStock = async (product) => {
        const newQty = localStocks[product.id];
        if (newQty === undefined || newQty < 0) {
            alert("La quantité en stock doit être positive.");
            return;
        }

        setSavingId(product.id);
        try {
            // Construction dynamique du payload en reprenant les données existantes du produit
            const urlKey = product.url_key || product.name.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)+/g, "");

            const updatePayload = {
                sku: product.sku,
                name: product.name,
                url_key: urlKey,
                price: parseFloat(product.price) || 0,
                weight: parseFloat(product.weight) || 1,
                status: parseInt(product.status) || 1,
                visible_individually: 1,
                attribute_family_id: product.attribute_family_id || 1,
                short_description: product.short_description || product.name,
                description: product.description || product.name,
                channels: [1],
                categories: [1],
                locales: ["fr", "en"],
                fr: { name: product.name, url_key: urlKey, description: product.description || product.name, short_description: product.short_description || product.name },
                en: { name: product.name, url_key: urlKey, description: product.description || product.name, short_description: product.short_description || product.name },
                inventories: { "1": newQty },
                new: 1,
                featured: 1
            };

            const response = await fetch(`http://localhost:8008/api/v1/admin/catalog/products/${product.id}`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json", 
                    "Accept": "application/json", 
                    "Authorization": `Bearer ${TOKEN}` 
                },
                body: JSON.stringify(updatePayload)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Impossible de mettre à jour le stock.");

            // Mettre à jour la liste des produits avec la nouvelle quantité retournée par le serveur
            setProducts(prev => prev.map(p => {
                if (p.id === product.id) {
                    const updatedQty = result.data?.inventories?.[0]?.qty ?? newQty;
                    return {
                        ...p,
                        inventories: [{ ...p.inventories?.[0], qty: updatedQty }]
                    };
                }
                return p;
            }));

            // Afficher une alerte de succès temporaire
            const alertEl = document.getElementById(`success-alert-${product.id}`);
            if (alertEl) {
                alertEl.classList.remove("opacity-0");
                setTimeout(() => alertEl.classList.add("opacity-0"), 2000);
            }
        } catch (err) {
            alert("Erreur lors de la mise à jour : " + err.message);
        } finally {
            setSavingId(null);
        }
    };

    const handleQuickAdd = (productId, amount) => {
        setLocalStocks(prev => {
            const current = prev[productId] || 0;
            return {
                ...prev,
                [productId]: Math.max(0, current + amount)
            };
        });
    };

    const handleStockChange = (productId, value) => {
        const qty = parseInt(value);
        setLocalStocks(prev => ({
            ...prev,
            [productId]: isNaN(qty) ? 0 : Math.max(0, qty)
        }));
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calcul des statistiques
    const totalCatalog = products.length;
    const outOfStockCount = products.filter(p => {
        const qty = p.inventories?.[0]?.qty ?? p.qty ?? 0;
        return qty <= 0;
    }).length;
    const lowStockCount = products.filter(p => {
        const qty = p.inventories?.[0]?.qty ?? p.qty ?? 0;
        return qty > 0 && qty <= 5;
    }).length;

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
                    <h1 className="text-xl font-black">Gestion des Stocks</h1>
                </div>
            </header>

            <main className="max-w-6xl mx-auto w-full p-8 flex-grow">
                {/* Cartes statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Catalogue</p>
                            <p className="text-2xl font-black text-gray-900">{totalCatalog} produits</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Stock Faible (≤ 5)</p>
                            <p className="text-2xl font-black text-amber-600">{lowStockCount} produits</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rupture de Stock</p>
                            <p className="text-2xl font-black text-red-600">{outOfStockCount} produits</p>
                        </div>
                    </div>
                </div>

                {/* Filtre de recherche */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:max-w-md">
                        <input
                            type="text"
                            placeholder="Rechercher par nom ou SKU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-3 px-12 focus:bg-white focus:border-blue-500 transition-all outline-none"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    <button 
                        onClick={fetchProducts}
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-2xl transition-all flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.235" />
                        </svg>
                        Rafraîchir
                    </button>
                </div>

                {/* Liste des produits */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-400 font-bold text-lg uppercase tracking-wider animate-pulse">Chargement du catalogue...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-700 p-8 rounded-[2.5rem] border border-red-100 text-center max-w-xl mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h3 className="text-2xl font-black mb-2">Erreur</h3>
                        <p className="font-medium mb-4">{error}</p>
                        <button onClick={fetchProducts} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg transition-all active:scale-95">Réessayer</button>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] p-16 border border-gray-100 text-center shadow-sm">
                        <p className="text-gray-400 font-bold text-xl mb-2">Aucun produit trouvé</p>
                        <p className="text-gray-500">Essayez une autre recherche ou rafraîchissez la liste.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {filteredProducts.map((product) => {
                            const currentStock = product.inventories?.[0]?.qty ?? product.qty ?? 0;
                            const isLowStock = currentStock > 0 && currentStock <= 5;
                            const isOutOfStock = currentStock <= 0;
                            const editedStock = localStocks[product.id] ?? currentStock;
                            const hasChanges = editedStock !== currentStock;

                            let badgeColor = "bg-green-50 text-green-700 border-green-100";
                            let badgeLabel = `${currentStock} en stock`;
                            if (isLowStock) {
                                badgeColor = "bg-amber-50 text-amber-700 border-amber-100";
                                badgeLabel = `Stock faible (${currentStock})`;
                            } else if (isOutOfStock) {
                                badgeColor = "bg-red-50 text-red-700 border-red-100";
                                badgeLabel = "Rupture de stock";
                            }

                            return (
                                <div key={product.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8 hover:shadow-md transition-all group relative overflow-hidden">
                                    {/* Success Toast interne */}
                                    <div 
                                        id={`success-alert-${product.id}`}
                                        className="absolute inset-0 bg-green-50/95 backdrop-blur-sm flex items-center justify-center text-green-700 font-black text-xl z-10 transition-all duration-300 opacity-0 pointer-events-none"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        STOCK MIS À JOUR AVEC SUCCÈS !
                                    </div>

                                    {/* Image du produit */}
                                    <div className="w-24 h-24 bg-gray-50 border border-gray-100 rounded-2xl flex-shrink-0 flex items-center justify-center p-3 overflow-hidden">
                                        <img
                                            src={product.images?.[0]?.path 
                                                ? `${product.images[0].medium_image_url}` 
                                                : "https://via.placeholder.com/150?text=Produit"
                                            }
                                            alt={product.name}
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </div>

                                    {/* Infos Produit */}
                                    <div className="flex-grow text-center md:text-left min-w-[200px]">
                                        <div className="flex flex-wrap gap-2 justify-center md:justify-start items-center mb-2">
                                            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">SKU: {product.sku}</span>
                                            <span className={`text-[10px] font-black border px-2 py-0.5 rounded-full uppercase ${badgeColor}`}>{badgeLabel}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{product.name}</h3>
                                        <p className="text-gray-500 font-semibold mt-1">{parseFloat(product.price).toFixed(2)} €</p>
                                    </div>

                                    {/* Ajustement du Stock */}
                                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                                        {/* Modificateurs + / - */}
                                        <div className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded-2xl border border-gray-200 shadow-inner w-full sm:w-auto">
                                            <button
                                                onClick={() => handleQuickAdd(product.id, -1)}
                                                className="w-10 h-10 flex items-center justify-center text-xl font-bold text-gray-400 hover:text-blue-600 transition-colors"
                                            >
                                                −
                                            </button>
                                            <input
                                                type="number"
                                                min="0"
                                                value={editedStock}
                                                onChange={(e) => handleStockChange(product.id, e.target.value)}
                                                className="w-16 text-center bg-transparent border-0 font-bold text-gray-800 focus:ring-0 outline-none text-lg"
                                            />
                                            <button
                                                onClick={() => handleQuickAdd(product.id, 1)}
                                                className="w-10 h-10 flex items-center justify-center text-xl font-bold text-gray-400 hover:text-blue-600 transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>

                                        {/* Raccourcis de réapprovisionnement rapide */}
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleQuickAdd(product.id, 10)}
                                                className="px-3 py-2 bg-blue-50 text-blue-700 text-xs font-black rounded-xl hover:bg-blue-100 transition-all active:scale-95"
                                            >
                                                +10
                                            </button>
                                            <button 
                                                onClick={() => handleQuickAdd(product.id, 50)}
                                                className="px-3 py-2 bg-purple-50 text-purple-700 text-xs font-black rounded-xl hover:bg-purple-100 transition-all active:scale-95"
                                            >
                                                +50
                                            </button>
                                        </div>

                                        {/* Bouton d'enregistrement */}
                                        <button
                                            disabled={savingId === product.id || !hasChanges}
                                            onClick={() => handleUpdateStock(product)}
                                            className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${
                                                hasChanges 
                                                    ? "bg-green-600 text-white hover:bg-green-700 hover:shadow-green-100 cursor-pointer" 
                                                    : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                                            }`}
                                        >
                                            {savingId === product.id ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                "Enregistrer"
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Section Tableau Récapitulatif du Stock Final */}
                {!loading && !error && filteredProducts.length > 0 && (
                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm mt-12 overflow-hidden">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Tableau du Stock Final
                                </h2>
                                <p className="text-gray-500 font-semibold text-sm">Vue globale et statuts des stocks finaux après modifications</p>
                            </div>
                            
                            <span className="bg-gray-100 text-gray-600 text-xs font-black px-4 py-2 rounded-xl">
                                {filteredProducts.length} Produits affichés
                            </span>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-gray-100">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-400 text-xs font-black uppercase tracking-wider border-b border-gray-100">
                                        <th className="p-5">SKU</th>
                                        <th className="p-5">Produit</th>
                                        <th className="p-5 text-right">Prix</th>
                                        <th className="p-5 text-center">Stock Actuel</th>
                                        <th className="p-5 text-center">Stock Final</th>
                                        <th className="p-5 text-center">Statut Final</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredProducts.map(p => {
                                        const currentStock = p.inventories?.[0]?.qty ?? p.qty ?? 0;
                                        const finalStock = localStocks[p.id] ?? currentStock;
                                        
                                        let statusBadge = "bg-green-50 text-green-700 border-green-100";
                                        let statusText = "Disponible";
                                        if (finalStock <= 0) {
                                            statusBadge = "bg-red-50 text-red-700 border-red-100";
                                            statusText = "Rupture";
                                        } else if (finalStock <= 5) {
                                            statusBadge = "bg-amber-50 text-amber-700 border-amber-100";
                                            statusText = "Stock Faible";
                                        }

                                        return (
                                            <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="p-5 font-mono text-xs text-gray-400 font-bold">{p.sku}</td>
                                                <td className="p-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center p-1 border border-gray-100 overflow-hidden flex-shrink-0">
                                                            <img 
                                                                src={p.images?.[0]?.path ? p.images[0].medium_image_url : "https://via.placeholder.com/100?text=P"} 
                                                                alt={p.name} 
                                                                className="max-w-full max-h-full object-contain"
                                                            />
                                                        </div>
                                                        <span className="font-bold text-gray-900 line-clamp-1">{p.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-right font-bold text-gray-900">{parseFloat(p.price).toFixed(2)} €</td>
                                                <td className="p-5 text-center text-gray-500 font-semibold">{currentStock}</td>
                                                <td className="p-5 text-center font-black text-blue-600 bg-blue-50/20">{finalStock}</td>
                                                <td className="p-5 text-center">
                                                    <span className={`inline-block border px-3 py-1 rounded-full text-[10px] font-black uppercase ${statusBadge}`}>
                                                        {statusText}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
