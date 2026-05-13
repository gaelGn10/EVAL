import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFetch } from "../hooks/useHttpRequest";
import { motion } from "motion/react";

export default function Checkout() {
  const navigate = useNavigate();
  const { data: cartData, loading: cartLoading } = useFetch("http://localhost:8008/api/v1/customer/cart");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    address1: "",
    city: "",
    state: "",
    postcode: "",
    country: "FR",
    phone: ""
  });

  const cart = cartData?.data;
  const total = cart?.formated_grand_total ||
    cart?.grand_total_formated ||
    (cart?.grand_total ? `${cart.grand_total} €` : "0.00 €");

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const token = sessionStorage.getItem("bagisto_client_token");

    try {
      // 1. Save Address
      const addressData = {
        billing: {
          ...formData,
          address: [formData.address1],
          use_for_shipping: true
        },
        shipping: {
          ...formData,
          address: [formData.address1]
        }
      };

      const addressRes = await fetch("http://localhost:8008/api/v1/customer/checkout/save-address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(addressData)
      });

      const addressResult = await addressRes.json();

      if (!addressRes.ok) {
        throw new Error(addressResult.message || addressResult.error || "Erreur lors de l'enregistrement de l'adresse");
      }

      // 2. Save Shipping (Free Shipping)
      const shippingRes = await fetch("http://localhost:8008/api/v1/customer/checkout/save-shipping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ shipping_method: "free_free" })
      });

      const shippingResult = await shippingRes.json();
      if (!shippingRes.ok) {
        throw new Error(shippingResult.message || shippingResult.error || "Erreur lors de la sélection de la livraison");
      }

      // 3. Save Payment (Cash on Delivery)
      const paymentRes = await fetch("http://localhost:8008/api/v1/customer/checkout/save-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ payment: { method: "cashondelivery" } })
      });

      const paymentResult = await paymentRes.json();
      if (!paymentRes.ok) {
        throw new Error(paymentResult.message || paymentResult.error || "Erreur lors de la sélection du paiement");
      }

      // 4. Place Order
      const orderRes = await fetch("http://localhost:8008/api/v1/customer/checkout/save-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const orderResult = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderResult.message || orderResult.error || "Erreur lors de la validation finale de la commande");
      }

      setSuccess(true);
      setTimeout(() => navigate("/accueil"), 3000);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[3rem] shadow-2xl border border-blue-50 inline-block"
        >
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4">Commande Confirmée !</h1>
          <p className="text-gray-500 text-lg mb-8">Merci pour votre achat. Votre commande a été enregistrée avec succès.</p>
          <p className="text-sm text-gray-400 animate-pulse">Redirection vers l'accueil...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row gap-16 items-start">
        {/* Left Side: Form */}
        <div className="flex-grow w-full">
          <h1 className="text-4xl font-black text-gray-900 mb-8 tracking-tight">Validation Commande</h1>

          <form onSubmit={handlePlaceOrder} className="space-y-8">
            {/* Address Section */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
                Adresse de livraison
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  required
                  type="text"
                  name="first_name"
                  placeholder="Prénom"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <input
                  required
                  type="text"
                  name="last_name"
                  placeholder="Nom"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <input
                  required
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 md:col-span-2 focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <input
                  required
                  type="text"
                  name="address1"
                  placeholder="Adresse"
                  value={formData.address1}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 md:col-span-2 focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <input
                  required
                  type="text"
                  name="city"
                  placeholder="Ville"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <input
                  required
                  type="text"
                  name="state"
                  placeholder="État / Région"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <input
                  required
                  type="text"
                  name="postcode"
                  placeholder="Code Postal"
                  value={formData.postcode}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <input
                  required
                  type="text"
                  name="phone"
                  placeholder="Téléphone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
                Mode de Paiement
              </h2>

              <div className="p-6 bg-blue-50 rounded-2xl border-2 border-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-blue-900">Paiement à la livraison</p>
                    <p className="text-xs text-blue-700 font-medium opacity-70 uppercase tracking-widest">Seul mode disponible</p>
                  </div>
                </div>
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-500 rounded-2xl border border-red-100 flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              disabled={loading || cartLoading || !cart?.items?.length}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white font-black py-6 rounded-[2rem] text-xl transition-all shadow-2xl shadow-blue-200 active:scale-[0.98] flex items-center justify-center gap-4"
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  VALIDATION EN COURS...
                </>
              ) : (
                <>
                  CONFIRMER MA COMMANDE ({total})
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Order Summary */}
        <div className="w-full lg:w-[400px] lg:sticky lg:top-8">
          <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-900/20">
            <h2 className="text-2xl font-bold mb-8">Résumé</h2>

            <div className="space-y-6 max-h-[40vh] overflow-y-auto mb-8 pr-2 scrollbar-hide">
              {cart?.items?.map(item => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-800 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={item.product?.images?.[0]?.path
                        ? `http://localhost:8008/public/cache/medium/product/${item.product_id}/${item.product.images[0].path.split('/').pop()}`
                        : (item.product?.images?.[0]?.url || "https://via.placeholder.com/64x64")
                      }
                      alt={item.name}
                      className="w-full h-full object-cover opacity-80"
                    />
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <h4 className="font-bold text-sm truncate">{item.name}</h4>
                    <p className="text-xs text-gray-500">Qté: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-sm">{item.formated_total || `${item.total} €`}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-8 border-t border-gray-800">
              <div className="flex justify-between text-gray-400 text-sm">
                <span>Livraison</span>
                <span className="text-green-400 font-bold">Gratuite</span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">À payer à la livraison</p>
                  <p className="text-4xl font-black text-blue-400 mt-1">{total}</p>
                </div>
              </div>
            </div>
          </div>

          <Link to="/cart" className="flex items-center justify-center gap-2 mt-6 text-gray-500 hover:text-blue-600 font-bold transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour au panier
          </Link>
        </div>
      </div>
    </div>
  );
}
