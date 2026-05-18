import { Link, useNavigate } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

export default function Wishlist() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const navigate = useNavigate();
  const [addingCartId, setAddingCartId] = useState(null);

  const handleAddToCartFromWishlist = async (product) => {
    const token = sessionStorage.getItem("bagisto_client_token");

    if (!token) {
      alert("Veuillez vous connecter pour ajouter des produits au panier.");
      navigate("/login", { state: { from: { pathname: "/cart" } } });
      return;
    }

    setAddingCartId(product.id);

    try {
      const response = await fetch(`http://localhost:8008/api/v1/customer/cart/add/${product.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity: 1
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Erreur lors de l'ajout au panier");
      }

      alert("Produit ajouté au panier ✅");
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setAddingCartId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-left">
      <nav className="flex mb-8 text-sm font-medium text-gray-500">
        <Link to="/accueil" className="hover:text-blue-600 transition-colors">Boutique</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-bold">Ma Liste d'envies</span>
      </nav>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Ma Liste d'envies</h1>
          <p className="text-gray-500 font-medium">Retrouvez tous les produits que vous avez mis de côté</p>
        </div>

        {wishlist.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm("Voulez-vous vraiment vider votre liste d'envies ?")) {
                clearWishlist();
              }
            }}
            className="text-sm font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all bg-gray-50 border border-gray-100 px-5 py-3 rounded-2xl active:scale-95"
          >
            Vider ma liste ({wishlist.length})
          </button>
        )}
      </div>

      {wishlist.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center min-h-[45vh] text-center p-8 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200"
        >
          <div className="p-6 bg-red-50 text-red-500 rounded-full mb-6 shadow-inner animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Votre liste d'envies est vide</h2>
          <p className="text-gray-500 max-w-sm mb-8 font-medium">Ajoutez-y des articles qui vous plaisent pour les retrouver facilement plus tard.</p>
          <Link
            to="/accueil"
            className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-xl shadow-blue-200 active:scale-95"
          >
            DÉCOUVRIR NOS PRODUITS
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {wishlist.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-[2rem] shadow-lg overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 border border-gray-100 relative group"
              >
                {/* Delete Heart Floating Action */}
                <button
                  onClick={() => removeFromWishlist(product.id)}
                  className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 backdrop-blur-md shadow-md text-red-500 hover:bg-red-50 hover:scale-105 active:scale-95 transition-all z-10 border border-gray-100"
                  title="Retirer des favoris"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="#ef4444" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>

                {/* Product Image Frame */}
                <div className="relative h-56 bg-gray-50 flex items-center justify-center p-6 overflow-hidden">
                  <Link to={`/product/${product.id}`} className="absolute inset-0 flex items-center justify-center p-6">
                    <img
                      src={
                        product.images?.[0]?.path
                          ? `${product.images[0].medium_image_url}`
                          : "https://via.placeholder.com/300x300?text=Produit"
                      }
                      alt={product.name}
                      className="max-w-full max-h-full w-auto h-auto object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors pointer-events-none" />
                </div>

                {/* Product Info */}
                <div className="p-6 flex flex-col flex-grow text-left">
                  <div className="mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">SKU: {product.sku}</span>
                    <Link to={`/product/${product.id}`} className="hover:text-blue-600 transition-colors block">
                      <h2 className="text-lg font-black text-gray-900 line-clamp-1 leading-snug">{product.name}</h2>
                    </Link>
                  </div>
                  
                  <p className="text-gray-500 text-sm mb-6 line-clamp-2 h-10 leading-relaxed font-medium">
                    {product.short_description?.replace(/<[^>]*>/g, "") || "Aucune description disponible."}
                  </p>

                  <div className="mt-auto pt-4 border-t border-gray-50">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-xs font-bold text-gray-400">Prix unitaire</span>
                      <span className="text-2xl font-black text-blue-600">
                        {product.formated_price || `${product.price} €`}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      <button
                        onClick={() => handleAddToCartFromWishlist(product)}
                        disabled={addingCartId === product.id}
                        className="col-span-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm"
                      >
                        {addingCartId === product.id ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Ajouter au panier
                          </>
                        )}
                      </button>

                      <Link
                        to={`/product/${product.id}`}
                        className="col-span-1 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-xl transition-all flex items-center justify-center border border-gray-100"
                        title="Voir la fiche produit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
