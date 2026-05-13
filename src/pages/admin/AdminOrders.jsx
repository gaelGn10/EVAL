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
            setOrders(result.data || []);
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


    // const handleAction = async (order, action) => {
    //     setProcessingId(`${order.id}-${action}`);
    //     try {
    //         // 1. Détails de la commande
    //         const orderRes = await fetch(`http://localhost:8008/api/v1/admin/sales/orders/${order.id}`, {
    //             headers: { "Accept": "application/json", "Authorization": `Bearer ${AUTH_TOKEN}` }
    //         });
    //         const orderData = await orderRes.json();
    //         const fullOrder = orderData.data || orderData;
    //         const itemsMap = fullOrder.items
    //             .map(item => {
    //                 const qty = parseInt(item.qty_to_ship || item.qty_ordered || 0);

    //                 if (qty <= 0) return null;

    //                 return {
    //                     order_item_id: item.id,
    //                     qty: qty
    //                 };
    //             })
    //             .filter(Boolean);
    //         // 2. Préparation intelligente des items
    //         // const itemsMap = {};

    //         // fullOrder.items.forEach(item => {
    //         //     const qty = parseInt(item.qty_to_ship || item.qty_ordered || 0);

    //         //     if (qty > 0) {
    //         //         itemsMap[item.id] = qty;
    //         //     }
    //         // });
    //         // 3. Construction du Body
    //         let payload = {};
    //         if (action === "invoice") {
    //             payload = { invoice: { items: itemsMap } };
    //         } else {
    //             payload = {
    //                 shipment: {
    //                     carrier_title: "Service Livraison",
    //                     track_number: "SHIP-" + order.id,
    //                     source: 1, // ID de la source d'inventaire
    //                     items: itemsMap
    //                 }
    //             };
    //         }

    //         const endpoint = `http://localhost:8008/api/v1/admin/sales/${action === 'invoice' ? 'invoices' : 'shipments'}/${order.id}`;

    //         const response = await fetch(endpoint, {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json",
    //                 "Accept": "application/json",
    //                 "Authorization": `Bearer ${AUTH_TOKEN}`
    //             },
    //             body: JSON.stringify(payload)
    //         });

    //         const result = await response.json();

    //         if (!response.ok) {
    //             // Si l'erreur persiste, c'est peut-être le format du champ 'items'
    //             // Tentative désespérée : Bagisto attend parfois items[id] = qty sans l'objet shipment
    //             throw new Error(result.message || "Erreur serveur");
    //         }

    //         alert("Opération réussie !");
    //         fetchOrders();
    //     } catch (err) {
    //         alert("Erreur : " + err.message);
    //     } finally {
    //         setProcessingId(null);
    //     }
    // };

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
                ) : (
                    <div className="grid gap-6">
                        {orders.map((order) => (
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




