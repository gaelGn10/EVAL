import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [expandedOrders, setExpandedOrders] = useState({});

    const toggleOrderExpand = (orderId) => {
        setExpandedOrders(prev => ({
            ...prev,
            [orderId]: !prev[orderId]
        }));
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch (e) {
            return dateStr;
        }
    };

    const getOrderQty = (order) => {
        if (!order.items) return 0;
        return order.items.reduce((acc, item) => acc + parseInt(item.qty_ordered || item.qty || 0), 0);
    };

    const formatPrice = (amount, formatted) => {
        if (formatted) return formatted;
        if (amount === undefined || amount === null) return "0,00 €";
        const val = parseFloat(amount);
        if (isNaN(val)) return "0,00 €";
        return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(val);
    };

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

        const SESSION_TOKEN = sessionStorage.getItem("bagisto_admin_token");
        const DEV_TOKEN = "41|Y8QQW9fezzEnu5uD3VTvuZvIt6uS1yKgqwdXidge18351ff3";
        return (SESSION_TOKEN && SESSION_TOKEN !== "fake_admin_token_for_ui") ? SESSION_TOKEN : DEV_TOKEN;
    };

    const fetchOrders = async (isRetry = false) => {
        try {
            if (!isRetry) setLoading(true);
            const activeToken = await getValidAdminToken(isRetry);
            const response = await fetch("http://localhost:8008/api/v1/admin/sales/orders?sort=id&limit=1000", {
                headers: { "Accept": "application/json", "Authorization": `Bearer ${activeToken}` }
            });
            
            if (response.status === 401 && !isRetry) {
                console.warn("Jeton d'administration expiré ou invalide. Tentative de reconnexion...");
                return fetchOrders(true);
            }
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Erreur API");
            
            let ordersData = result.data || [];

            // OVERLAY: Surcharge avec les flags invoiced/shipped pour calcul de statut précis
            try {
                const metaStr = localStorage.getItem('imported_orders_meta');
                if (metaStr && ordersData.length > 0) {
                    const metas = JSON.parse(metaStr);
                    ordersData = ordersData.map(order => {
                        const meta = metas.find(m => m.bagisto_order_id && String(m.bagisto_order_id) === String(order.id));
                        if (meta) {
                            // Calcul du statut selon les deux flags indépendants
                            let computedStatus = order.status;
                            if (meta.invoiced && meta.shipped) {
                                computedStatus = 'completed';
                            } else if (meta.invoiced || meta.shipped) {
                                computedStatus = 'processing';
                            } else if (meta.status) {
                                computedStatus = meta.status;
                            }
                            return { ...order, status: computedStatus, _invoiced: !!meta.invoiced, _shipped: !!meta.shipped };
                        }
                        return order;
                    });
                }
            } catch (e) {
                console.error("Erreur de surcharge des statuts admin", e);
            }

            setOrders(ordersData);
        } catch (err) {
            setError(err.message);
        } finally {
            if (!isRetry) setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const handleAction = async (order, action) => {
        setProcessingId(`${order.id}-${action}`);
        try {
            // Helper local pour requêtes authentifiées avec auto-retry sur 401
            const authenticatedFetch = async (url, options = {}, isRetry = false) => {
                const activeToken = await getValidAdminToken(isRetry);
                const headers = {
                    ...options.headers,
                    "Accept": "application/json",
                    "Authorization": `Bearer ${activeToken}`
                };
                const res = await fetch(url, { ...options, headers });
                
                if (res.status === 401 && !isRetry) {
                    console.warn(`401 détecté sur ${url}. Tentative de renouvellement du jeton...`);
                    return authenticatedFetch(url, options, true);
                }
                return res;
            };

            // 1. Récupération des détails pour avoir les IDs des articles
            const orderRes = await authenticatedFetch(`http://localhost:8008/api/v1/admin/sales/orders/${order.id}`);
            const orderData = await orderRes.json();
            if (!orderRes.ok) throw new Error(orderData.message || "Erreur de récupération des détails de la commande");
            const fullOrder = orderData.data || orderData;

            // 2. Construction du payload selon l'action
            let payload = {};

            if (action === "ship") {
                const itemsMap = {};
                let totalQty = 0;

                fullOrder.items.forEach(item => {
                    // Toujours utiliser qty_ordered — fiable quelle que soit l'état de la commande
                    const qty = parseInt(item.qty_ordered || 0);
                    if (qty > 0) {
                        itemsMap[item.id] = { "1": qty };
                        totalQty += qty;
                    }
                });

                console.log("📦 Payload expédition :", { totalQty, itemsMap });

                payload = {
                    shipment: {
                        carrier_title: "Service Livraison",
                        track_number: "SHIP-" + order.id,
                        source: 1,
                        total_qty: totalQty,
                        items: itemsMap
                    }
                };
            } else {
                // action === "invoice"
                const invoiceItems = {};
                fullOrder.items.forEach(item => {
                    invoiceItems[item.id] = parseInt(item.qty_ordered || 0);
                });
                payload = { invoice: { items: invoiceItems } };
            }

            const endpoint = `http://localhost:8008/api/v1/admin/sales/${action === 'invoice' ? 'invoices' : 'shipments'}/${order.id}`;

            const response = await authenticatedFetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "L'action a échoué sur le serveur");

            // --- DECREASE STOCK AFTER SUCCESSFUL SHIPMENT ---
            if (action === "ship") {
                console.log("📉 Expédition réussie — mise à jour du stock...");
                for (const item of fullOrder.items) {
                    // Utiliser parseInt > 0 pour éviter le bug de "0" (string truthy)
                    const qtyToShip = parseInt(item.qty_to_ship);
                    const qty = qtyToShip > 0 ? qtyToShip : parseInt(item.qty_ordered || 0);
                    const pId = item.product_id || item.additional?.product_id || item.additional_fields?.product_id;
                    if (pId && qty > 0) {
                        try {
                            const pRes = await authenticatedFetch(`http://localhost:8008/api/v1/admin/catalog/products/${pId}`);
                            const pData = await pRes.json();
                            const productData = pData.data || pData;
                            if (productData) {
                                const inventories = productData.inventories || [];
                                const currentQty = inventories.length > 0 ? (parseInt(inventories[0].qty) || 0) : 0;
                                const newQty = Math.max(0, currentQty - qty);
                                console.log(`📉 Produit ID ${pId} (${item.name}) : stock ${currentQty} - expédié ${qty} => nouveau stock ${newQty}`);
                                await authenticatedFetch(`http://localhost:8008/api/v1/admin/catalog/products/${pId}/inventories`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ inventories: { "1": newQty } })
                                });
                            }
                        } catch (pErr) {
                            console.error(`Erreur mise à jour stock pour produit ID ${pId}`, pErr);
                        }
                    }
                }
            }

            // Mise à jour des flags invoiced/shipped dans l'overlay — statut calculé automatiquement
            try {
                const metaStr = localStorage.getItem('imported_orders_meta');
                let metas = metaStr ? JSON.parse(metaStr) : [];
                const metaIndex = metas.findIndex(m => String(m.bagisto_order_id) === String(order.id));

                if (metaIndex !== -1) {
                    if (action === 'invoice') metas[metaIndex].invoiced = true;
                    if (action === 'ship')    metas[metaIndex].shipped  = true;
                    // completed seulement si les deux actions ont été faites
                    if (metas[metaIndex].invoiced && metas[metaIndex].shipped) {
                        metas[metaIndex].status = 'completed';
                    } else {
                        metas[metaIndex].status = 'processing';
                    }
                } else {
                    metas.push({
                        bagisto_order_id: order.id,
                        invoiced: action === 'invoice',
                        shipped:  action === 'ship',
                        status: 'processing'
                    });
                }
                localStorage.setItem('imported_orders_meta', JSON.stringify(metas));
            } catch (e) {
                console.error("Erreur mise à jour overlay local", e);
            }

            alert("Opération réussie !");
            fetchOrders();
        } catch (err) {
            alert("Erreur : " + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const deletedOrders = JSON.parse(localStorage.getItem('deleted_order_ids') || '[]');

    const filteredOrders = orders.filter(order => {
        if (order.status?.toLowerCase() === 'canceled') return false;
        if (deletedOrders.includes(order.id)) return false;
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-gray-900 text-white p-6 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-4">
                    <Link to="/admin/dashboard" className="text-blue-400 font-bold hover:underline">← Dashboard</Link>
                    <h1 className="text-xl font-black">Commandes Bagisto</h1>
                </div>
            </header>

            <main className="max-w-5xl mx-auto w-full p-8">
                {loading ? (
                    <div className="text-center py-20 animate-pulse font-bold text-gray-400 text-2xl uppercase">Chargement...</div>
                ) : filteredOrders.length === 0 ? (
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-16 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6 border border-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <h3 className="text-3xl font-black text-gray-900 mb-3">Aucune commande</h3>
                        <p className="text-gray-500 font-medium text-lg">Il n'y a pas de commandes actives à gérer pour le moment.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {filteredOrders.map((order) => {
                            const isExpanded = !!expandedOrders[order.id];
                            const totalQty = getOrderQty(order);

                            return (
                                <div key={order.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                                    {/* Entête principale de la commande */}
                                    <div className="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white">
                                        <div className="flex flex-wrap items-center gap-6">
                                            {/* ID et Statut */}
                                            <div className="min-w-[140px]">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">ID Commande</span>
                                                    {order.created_at && (
                                                        <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            {formatDate(order.created_at)}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-3xl font-black text-gray-900 tracking-tight">#{order.increment_id || order.id}</h3>
                                                
                                                {(() => {
                                                    let badgeColor = "bg-gray-100 text-gray-700";
                                                    let badgeLabel = order.status;
                                                    
                                                    switch(order.status?.toLowerCase()) {
                                                        case "pending": 
                                                            badgeColor = "bg-amber-100 text-amber-700"; 
                                                            badgeLabel = "En attente"; 
                                                            break;
                                                        case "processing": 
                                                            badgeColor = "bg-blue-100 text-blue-700"; 
                                                            badgeLabel = "En cours"; 
                                                            break;
                                                        case "completed": 
                                                            badgeColor = "bg-green-100 text-green-700"; 
                                                            badgeLabel = "Terminée"; 
                                                            break;
                                                        case "canceled": 
                                                            badgeColor = "bg-red-100 text-red-700"; 
                                                            badgeLabel = "Annulée"; 
                                                            break;
                                                    }
                                                    return (
                                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase mt-2 inline-block ${badgeColor}`}>
                                                            {badgeLabel}
                                                        </span>
                                                    );
                                                })()}
                                            </div>

                                            {/* Client */}
                                            <div className="border-l border-gray-100 pl-6 min-w-[220px]">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Client</p>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm border border-blue-100 shadow-sm flex-shrink-0">
                                                        {(order.customer_full_name || order.customer_email || "C").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-gray-800 leading-tight truncate">
                                                            {order.customer_full_name || `${order.customer_first_name || ''} ${order.customer_last_name || ''}`.trim() || "Client Importé"}
                                                        </p>
                                                        <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{order.customer_email}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Montant Total */}
                                            <div className="border-l border-gray-100 pl-6">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Montant Total</p>
                                                <p className="text-3xl font-black text-blue-600 leading-none">
                                                    {order.formated_grand_total || order.formatted_grand_total || formatPrice(order.grand_total)}
                                                </p>
                                                <span className="text-xs text-gray-400 font-bold block mt-1">
                                                    {totalQty} {totalQty > 1 ? "articles" : "article"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                                            {/* Bouton Détails Accordéon */}
                                            <button
                                                onClick={() => toggleOrderExpand(order.id)}
                                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all border ${
                                                    isExpanded 
                                                        ? "bg-gray-100 text-gray-700 border-gray-200" 
                                                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                                                }`}
                                            >
                                                <span>{isExpanded ? "Masquer détails" : "Voir produits"}</span>
                                                <svg 
                                                    xmlns="http://www.w3.org/2000/svg" 
                                                    className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} 
                                                    fill="none" 
                                                    viewBox="0 0 24 24" 
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>

                                            <div className="flex gap-2">
                                                {/* Bouton EXPÉDIER */}
                                                {order.status !== 'completed' ? (
                                                    <button
                                                        disabled={processingId === `${order.id}-ship` || !!order._shipped}
                                                        onClick={() => handleAction(order, "ship")}
                                                        className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
                                                            order._shipped
                                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed line-through"
                                                                : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow"
                                                        }`}
                                                    >
                                                        {processingId === `${order.id}-ship` ? "..." : order._shipped ? "✓ Expédié" : "Expédier"}
                                                    </button>
                                                ) : (
                                                    <span className="px-4 py-2.5 rounded-2xl font-bold text-xs bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Expédié
                                                    </span>
                                                )}

                                                {/* Bouton FACTURER */}
                                                {order.status !== 'completed' ? (
                                                    <button
                                                        disabled={processingId === `${order.id}-invoice` || !!order._invoiced}
                                                        onClick={() => handleAction(order, "invoice")}
                                                        className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
                                                            order._invoiced
                                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed line-through"
                                                                : "bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow"
                                                        }`}
                                                    >
                                                        {processingId === `${order.id}-invoice` ? "..." : order._invoiced ? "✓ Facturé" : "Facturer"}
                                                    </button>
                                                ) : (
                                                    <span className="px-4 py-2.5 rounded-2xl font-bold text-xs bg-green-50 text-green-600 border border-green-100 flex items-center gap-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Facturé
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Zone Déroulable de l'Accordéon */}
                                    {isExpanded && (
                                        <div className="bg-gray-50 p-8 border-t border-gray-100">
                                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                                Détail des Produits
                                            </h4>

                                            <div className="grid gap-3 mb-6">
                                                {order.items && order.items.map((item) => {
                                                    const itemQty = parseInt(item.qty_ordered || item.qty || 0);
                                                    const unitPrice = parseFloat(item.price || 0);
                                                    const itemTotal = item.formatted_total || item.formated_total || formatPrice(unitPrice * itemQty);

                                                    return (
                                                        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:border-gray-200 transition-all gap-4">
                                                            <div className="flex items-center gap-4">
                                                                <span className="flex items-center justify-center bg-blue-50 text-blue-600 text-sm font-black h-9 w-9 rounded-xl border border-blue-100 flex-shrink-0">
                                                                    {itemQty}x
                                                                </span>
                                                                <div>
                                                                    <p className="font-bold text-gray-800 text-sm leading-snug">{item.name}</p>
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">SKU: {item.sku}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-8 justify-between sm:justify-end">
                                                                <div className="text-left sm:text-right">
                                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Prix Unitaire</span>
                                                                    <span className="text-xs font-semibold text-gray-500">
                                                                        {item.formatted_price || item.formated_price || formatPrice(unitPrice)}
                                                                    </span>
                                                                </div>
                                                                <div className="text-right min-w-[80px]">
                                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Total</span>
                                                                    <span className="text-sm font-black text-gray-800">
                                                                        {itemTotal}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Grille du récapitulatif financier */}
                                            <div className="border-t border-gray-200 pt-6 flex justify-end">
                                                <div className="w-full sm:w-80 space-y-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                                                    <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                                                        <span>Sous-total</span>
                                                        <span>{order.formated_sub_total || order.formatted_sub_total || formatPrice(order.sub_total || order.grand_total)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                                                        <span>Livraison</span>
                                                        <span>{order.formated_shipping_amount || order.formatted_shipping_amount || formatPrice(order.shipping_amount || 0)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                                                        <span>Taxes</span>
                                                        <span>{order.formated_tax_amount || order.formatted_tax_amount || formatPrice(order.tax_amount || 0)}</span>
                                                    </div>
                                                    <div className="border-t border-gray-100 my-2 pt-2 flex justify-between items-center text-sm font-black text-gray-800">
                                                        <span>Total Commande</span>
                                                        <span className="text-base text-blue-600">
                                                            {order.formated_grand_total || order.formatted_grand_total || formatPrice(order.grand_total)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}




