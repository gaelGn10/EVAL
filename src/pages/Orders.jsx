import { useFetch } from "../hooks/useHttpRequest";
import { Link } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";

export default function Orders() {
  const { data, loading, error } = useFetch("http://localhost:8008/api/v1/customer/orders");
  const [expandedOrders, setExpandedOrders] = useState({});
  const { user } = useAuth();

  let orders = data?.data ? [...data.data] : [];

  // MOCK OVERLAY: Surcharge les données Bagisto avec les vraies données du fichier importé (status, date, prix)
  try {
    const metaStr = localStorage.getItem('imported_orders_meta');
    if (metaStr && orders.length > 0) {
      const metas = JSON.parse(metaStr);
      
      orders = orders.map(order => {
        // Chercher si cette commande Bagisto correspond à un import (sécurité sur les types string/number)
        const meta = metas.find(m => m.bagisto_order_id && String(m.bagisto_order_id) === String(order.id));
        if (meta) {
          return {
            ...order,
            status: meta.status || order.status,
            created_at: meta.created_at 
                ? new Date(meta.created_at.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')).toISOString() 
                : order.created_at,
            grand_total: meta.grand_total,
            formated_grand_total: `${meta.grand_total.toFixed(2)} €`,
            items: (order.items || []).map(apiItem => {
                const metaItem = meta.items.find(mi => mi.id && String(mi.id) === String(apiItem.product_id));
                if (metaItem) {
                    return {
                        ...apiItem,
                        formated_total: `${metaItem.total.toFixed(2)} €`,
                        formated_price: `${metaItem.price.toFixed(2)} €`,
                        total: metaItem.total,
                        price: metaItem.price
                    };
                }
                return apiItem;
            })
          };
        }
        return order;
      });
      
      // Trier par date décroissante pour un affichage cohérent
      orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    // Cacher les commandes qui ont été "soft-delete" (blackliste d'IDs)
    const deletedOrders = JSON.parse(localStorage.getItem('deleted_order_ids') || '[]');
    if (deletedOrders.length > 0) {
        orders = orders.filter(order => !deletedOrders.includes(order.id));
    }
    
  } catch(e) {
    console.error("Erreur lors de la surcharge des commandes avec les métadonnées de l'import:", e);
  }

  const toggleOrder = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending": return "bg-amber-50 text-amber-600 border-amber-100";
      case "processing": return "bg-blue-50 text-blue-600 border-blue-100";
      case "completed": return "bg-green-50 text-green-600 border-green-100";
      case "canceled": return "bg-red-50 text-red-600 border-red-100";
      default: return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case "pending": return "En attente";
      case "processing": return "En cours";
      case "completed": return "Terminée";
      case "canceled": return "Annulée";
      default: return status || "Inconnu";
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 font-medium">Chargement de vos commandes...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Mes Commandes</h1>
          <p className="text-gray-500 mt-2 font-medium">Historique de vos achats et état de livraison</p>
        </div>
      </div>

      {error && orders.length === 0 ? (
        <div className="bg-red-50 p-8 rounded-[2rem] text-center border border-red-100 max-w-2xl mx-auto">
          <p className="text-red-600 font-bold mb-2">Oups !</p>
          <p className="text-red-500">Impossible de charger vos commandes. Assurez-vous d'être connecté.</p>
          <Link to="/login" className="inline-block mt-4 text-red-600 font-bold hover:underline">Se connecter →</Link>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-gray-50 rounded-[3rem] p-20 text-center border-2 border-dashed border-gray-200">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Aucune commande pour le moment</h2>
          <p className="text-gray-500 mb-8 max-w-xs mx-auto">Vous n'avez pas encore passé de commande. C'est le moment idéal pour commencer !</p>
          <Link to="/accueil" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
            Explorer la boutique
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={order.id}
              className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-8 md:items-center">
                {/* Order Meta */}
                <div className="flex-shrink-0 flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Commande</span>
                  <span className="text-xl font-black text-gray-900">#{order.increment_id || order.id}</span>
                  <span className="text-sm text-gray-500 font-medium">
                    {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <div className="h-12 w-px bg-gray-100 hidden md:block" />

                {/* Order Summary */}
                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">État</span>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Montant Total</span>
                    <span className="text-2xl font-black text-blue-600">
                      {order.formated_grand_total || order.grand_total_formated || order.fomated_grand_total || order.grand_total + " €"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleOrder(order.id)}
                    className={`flex-grow sm:flex-none font-bold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${expandedOrders[order.id] ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-800 hover:bg-gray-100'}`}
                  >
                    {expandedOrders[order.id] ? 'Fermer' : 'Détails'}
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${expandedOrders[order.id] ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Order Items Detailed List (Collapsible) */}
              <AnimatePresence>
                {expandedOrders[order.id] && order.items && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-8 pb-8 border-t border-gray-50 pt-6 bg-gray-50/30">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Articles commandés</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="w-14 h-14 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                              <img
                                src={
                                  item.product?.images?.[0]?.medium_image_url
                                  || item.product?.images?.[0]?.url
                                  || "https://via.placeholder.com/150x150?text=Produit"
                                }
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-sm text-gray-800 truncate">{item.name}</p>
                                {item.hasPromo && (
                                  <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-black rounded-full uppercase tracking-wider flex-shrink-0">Promo</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 font-medium mt-0.5">
                                {item.qty_ordered} {item.qty_ordered > 1 ? 'unités' : 'unité'}
                                {item.hasPromo && item.originalPrice > item.price && (
                                  <span className="ml-1 line-through text-gray-400">{item.originalPrice.toFixed(2)} €</span>
                                )}
                                {' • '}
                                <span className={item.hasPromo ? "text-orange-500 font-black" : "text-blue-600 font-bold"}>
                                  {item.formated_total || item.formated_price || (item.price * item.qty_ordered) + " €"}
                                </span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
