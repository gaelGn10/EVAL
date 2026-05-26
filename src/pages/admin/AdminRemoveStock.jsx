import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function AdminRemoveStock() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [quantityToRemove, setQuantityToRemove] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [summary, setSummary] = useState(null);
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

    const fetchData = async (isRetry = false) => {
        try {
            if (!isRetry) setLoading(true);
            const activeToken = await getValidAdminToken(isRetry);

    
            const catResponse = await fetch("http://localhost:8008/api/v1/admin/catalog/categories?limit=100", {
                headers: { "Accept": "application/json", "Authorization": `Bearer ${activeToken}` }
            });

         
            const prodResponse = await fetch("http://localhost:8008/api/v1/admin/catalog/products?limit=100", {
                headers: { "Accept": "application/json", "Authorization": `Bearer ${activeToken}` }
            });

            if ((catResponse.status === 401 || prodResponse.status === 401) && !isRetry) {
                console.warn("Jeton expiré ou invalide. Tentative de reconnexion...");
                return fetchData(true);
            }

            if (!catResponse.ok) throw new Error("Erreur lors du chargement des catégories");
            if (!prodResponse.ok) throw new Error("Erreur lors du chargement des produits");

            const catResult = await catResponse.json();
            const prodResult = await prodResponse.json();

            setCategories(catResult.data || []);
            setProducts(prodResult.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            if (!isRetry) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

 
    const isProductInSelectedCategory = (product) => {
        if (!selectedCategoryId) return false;
        if (!product.categories || !Array.isArray(product.categories)) return false;
        return product.categories.some(c => {
            const id = typeof c === "object" ? c.id : c;
            return id.toString() === selectedCategoryId.toString();
        });
    };


    const filteredProducts = products.filter(isProductInSelectedCategory);

    const handleRemoveStock = async () => {
        const qty = parseInt(quantityToRemove, 10);
        if (isNaN(qty) || qty <= 0) {
            alert("Veuillez saisir une quantité supérieure à 0.");
            return;
        }

        if (!selectedCategoryId) {
            alert("Veuillez sélectionner une catégorie.");
            return;
        }

        if (filteredProducts.length === 0) {
            alert("Aucun produit trouvé dans cette catégorie.");
            return;
        }

        const confirmMessage = `Êtes-vous sûr de vouloir retirer ${qty} unité(s) de stock pour les ${filteredProducts.length} produit(s) de la catégorie sélectionnée ?`;
        if (!window.confirm(confirmMessage)) {
            return;
        }

        setProcessing(true);
        setSummary(null);

        try {
            const activeToken = await getValidAdminToken();
            let totalRequestedQty = qty * filteredProducts.length;
            let totalActuallyRemoved = 0;
            const updatedProductsDetails = [];

            for (const product of filteredProducts) {
                const currentQty = parseInt(product.inventories?.[0]?.qty ?? product.qty ?? 0, 10);
                const newQty = Math.max(0, currentQty - qty);
                const actuallyRemoved = currentQty - newQty;
                totalActuallyRemoved += actuallyRemoved;

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
                    throw new Error(result.message || "Impossible de mettre à jour le stock du produit : " + product.name);
                }

                updatedProductsDetails.push({
                    id: product.id,
                    name: product.name,
                    sku: product.sku,
                    initialQty: currentQty,
                    finalQty: newQty,
                    actuallyRemoved: actuallyRemoved,
                    image: product.images?.[0]?.medium_image_url || null
                });
            }

            setSummary({
                requestedQtyPerProduct: qty,
                totalRequestedQty: totalRequestedQty,
                totalActuallyRemoved: totalActuallyRemoved,
                products: updatedProductsDetails
            });

            alert("Le retrait de stock a été effectué avec succès !");
    
            setQuantityToRemove("");
       
            await fetchData();
        } catch (err) {
            alert("Erreur lors du traitement : " + err.message);
        } finally {
            setProcessing(false);
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
                    <h1 className="text-xl font-black">Remove Stock</h1>
                </div>
            </header>

            <main className="max-w-5xl mx-auto w-full p-8 flex-grow">
                <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-sm overflow-hidden">
                    <div className="mb-8">
                        <h2 className="text-3xl font-black text-gray-900 mb-2">Retirer du stock par catégorie</h2>
                        <p className="text-gray-500 font-medium">Sélectionnez une catégorie et définissez la quantité à soustraire du stock pour tous ses produits.</p>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-400 font-bold text-lg uppercase tracking-wider animate-pulse">Chargement des données...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 text-red-700 p-8 rounded-[2.5rem] border border-red-100 text-center max-w-xl mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h3 className="text-2xl font-black mb-2">Erreur</h3>
                            <p className="font-medium mb-4">{error}</p>
                            <button onClick={() => fetchData()} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg transition-all active:scale-95">Réessayer</button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {}
                                <div className="flex flex-col">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Catégorie</label>
                                    <select
                                        value={selectedCategoryId}
                                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-300 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-red-500 outline-none transition-all text-gray-800 font-semibold cursor-pointer"
                                    >
                                        <option value="">-- Choisir une catégorie --</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name} ({cat.translations?.[0]?.name || cat.slug})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {}
                                <div className="flex flex-col">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Quantité à retirer</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantityToRemove}
                                        onChange={(e) => setQuantityToRemove(e.target.value)}
                                        placeholder="Ex: 5"
                                        className="w-full bg-gray-50 border border-gray-300 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-red-500 outline-none transition-all text-gray-800 font-black text-center"
                                    />
                                </div>
                            </div>

                            {}
                            {selectedCategoryId && (
                                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex justify-between items-center">
                                        <span>Produits dans cette catégorie</span>
                                        <span className="bg-red-100 text-red-700 text-xs font-black px-3 py-1 rounded-full">
                                            {filteredProducts.length} produit(s)
                                        </span>
                                    </h3>

                                    {filteredProducts.length === 0 ? (
                                        <p className="text-gray-500 italic text-center py-4">Aucun produit dans cette catégorie.</p>
                                    ) : (
                                        <div className="max-h-60 overflow-y-auto divide-y divide-gray-200">
                                            {filteredProducts.map(p => {
                                                const currentStock = p.inventories?.[0]?.qty ?? p.qty ?? 0;
                                                return (
                                                    <div key={p.id} className="py-3 flex justify-between items-center gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center p-1 flex-shrink-0">
                                                                <img 
                                                                    src={p.images?.[0]?.path ? p.images[0].medium_image_url : "https://via.placeholder.com/100?text=P"} 
                                                                    alt={p.name} 
                                                                    className="max-w-full max-h-full object-contain"
                                                                />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900 text-sm line-clamp-1">{p.name}</p>
                                                                <p className="text-[10px] font-mono text-gray-400 font-bold">SKU: {p.sku}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg flex-shrink-0">
                                                            Stock: {currentStock}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {}
                            <div className="pt-6 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={handleRemoveStock}
                                    disabled={processing || !selectedCategoryId || filteredProducts.length === 0 || !quantityToRemove}
                                    className={`px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-95 flex items-center gap-3 ${
                                        processing || !selectedCategoryId || filteredProducts.length === 0 || !quantityToRemove
                                            ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none" 
                                            : "bg-red-600 hover:bg-red-700 text-white hover:shadow-red-200 cursor-pointer"
                                    }`}
                                >
                                    {processing ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Retrait en cours...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Remove
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {}
                {summary && (
                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-lg mt-10 overflow-hidden animate-fade-in">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Récapitulatif de l'opération</h2>
                                <p className="text-gray-500 font-semibold text-sm">Détail des stocks retirés et mis à jour</p>
                            </div>
                        </div>

                        {}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex items-center gap-4">
                                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantité demandée</p>
                                    <p className="text-lg font-black text-gray-900">
                                        {summary.requestedQtyPerProduct} par produit ({summary.totalRequestedQty} au total)
                                    </p>
                                </div>
                            </div>

                            <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100 flex items-center gap-4">
                                <div className="w-10 h-10 bg-green-100 text-green-700 rounded-xl flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Quantité réellement retirée</p>
                                    <p className="text-xl font-black text-green-700">{summary.totalActuallyRemoved} unité(s)</p>
                                </div>
                            </div>
                        </div>

                        {}
                        <div className="overflow-x-auto rounded-2xl border border-gray-100">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-400 text-xs font-black uppercase tracking-wider border-b border-gray-100">
                                        <th className="p-4">SKU</th>
                                        <th className="p-4">Produit</th>
                                        <th className="p-4 text-center">Stock Initial</th>
                                        <th className="p-4 text-center">Retiré</th>
                                        <th className="p-4 text-center">Stock Final</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-sm">
                                    {summary.products.map(p => (
                                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4 font-mono text-xs text-gray-500 font-bold">{p.sku}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center p-1 border border-gray-100 overflow-hidden flex-shrink-0">
                                                        <img 
                                                            src={p.image ? p.image : "https://via.placeholder.com/80?text=P"} 
                                                            alt={p.name} 
                                                            className="max-w-full max-h-full object-contain"
                                                        />
                                                    </div>
                                                    <span className="font-bold text-gray-900 line-clamp-1">{p.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center text-gray-500 font-semibold">{p.initialQty}</td>
                                            <td className="p-4 text-center font-bold text-red-600 bg-red-50/20">-{p.actuallyRemoved}</td>
                                            <td className="p-4 text-center font-black text-gray-800">{p.finalQty}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
