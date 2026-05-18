import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    const AUTH_TOKEN = "41|Y8QQW9fezzEnu5uD3VTvuZvIt6uS1yKgqwdXidge18351ff3";

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await fetch("http://localhost:8008/api/v1/admin/sales/orders?sort=id", {
                headers: { "Accept": "application/json", "Authorization": `Bearer ${AUTH_TOKEN}` }
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Erreur API");
            
            let ordersData = result.data || [];

            // MOCK OVERLAY: Surcharge les données Bagisto avec les statuts du fichier importé
            try {
                const metaStr = localStorage.getItem('imported_orders_meta');
                if (metaStr && ordersData.length > 0) {
                    const metas = JSON.parse(metaStr);
                    ordersData = ordersData.map(order => {
                        const meta = metas.find(m => m.bagisto_order_id && String(m.bagisto_order_id) === String(order.id));
                        if (meta) {
                            return { ...order, status: meta.status || order.status };
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
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);
    const handleAction = async (order, action) => {
        setProcessingId(`${order.id}-${action}`);
        try {
            // 1. Récupération des détails pour avoir les IDs des articles
            const orderRes = await fetch(`http://localhost:8008/api/v1/admin/sales/orders/${order.id}`, {
                headers: { "Accept": "application/json", "Authorization": `Bearer ${AUTH_TOKEN}` }
            });
            const orderData = await orderRes.json();
            const fullOrder = orderData.data || orderData;

            // 2. Construction des items selon le schéma précis de Bagisto
            const itemsMap = {};
            let totalQty = 0;

            fullOrder.items.forEach(item => {
                const qty = parseInt(item.qty_to_ship || item.qty_ordered || 0);
                if (qty > 0) {
                    // Structure imbriquée : { "id_item": { "id_source": quantite } }
                    itemsMap[item.id] = {
                        "1": qty  // "1" est l'ID de votre source d'inventaire par défaut
                    };
                    totalQty += qty;
                }
            });

            // 3. Préparation du Payload final
            let payload = {};
            if (action === "invoice") {
                // Pour la facture, c'est souvent plus simple
                const invoiceItems = {};
                fullOrder.items.forEach(item => {
                    invoiceItems[item.id] = parseInt(item.qty_ordered);
                });
                payload = { invoice: { items: invoiceItems } };
            } else {
                payload = {
                    shipment: {
                        carrier_title: "Service Livraison",
                        track_number: "SHIP-" + order.id,
                        source: 1,
                        total_qty: totalQty, // Ajout de la quantité totale
                        items: itemsMap      // Utilisation de la structure imbriquée
                    }
                };
            }

            const endpoint = `http://localhost:8008/api/v1/admin/sales/${action === 'invoice' ? 'invoices' : 'shipments'}/${order.id}`;

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${AUTH_TOKEN}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "L'action a échoué sur le serveur");

            alert("Opération réussie !");
            fetchOrders();
        } catch (err) {
            alert("Erreur : " + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const filteredOrders = orders.filter(order => order.status?.toLowerCase() !== 'canceled');

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
                        {filteredOrders.map((order) => (
                            <div key={order.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 flex flex-col md:flex-row items-center gap-8 hover:shadow-md transition-shadow">
                                <div className="flex-shrink-0 text-center md:text-left">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID Commande</p>
                                    <h3 className="text-3xl font-black text-gray-900">#{order.increment_id || order.id}</h3>
                                    <span className="text-[10px] font-black bg-blue-600 text-white px-3 py-1 rounded-full uppercase mt-2 inline-block">{order.status}</span>
                                </div>

                                <div className="flex-grow">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Client & Montant</p>
                                    <p className="font-bold text-gray-800 text-lg">{order.customer_full_name || order.customer_email}</p>
                                    <p className="text-2xl font-black text-blue-600">{order.formated_grand_total}</p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        disabled={processingId === `${order.id}-invoice` || order.status === 'completed'}
                                        onClick={() => handleAction(order, "invoice")}
                                        className="bg-green-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-green-700 disabled:opacity-20"
                                    >
                                        {processingId === `${order.id}-invoice` ? "..." : "Facturer"}
                                    </button>
                                    <button
                                        disabled={processingId === `${order.id}-ship` || order.status === 'completed'}
                                        onClick={() => handleAction(order, "ship")}
                                        className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-20"
                                    >
                                        {processingId === `${order.id}-ship` ? "..." : "Expédier"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}




