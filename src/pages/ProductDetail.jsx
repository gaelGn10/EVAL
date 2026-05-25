import { useParams, Link, useNavigate } from "react-router-dom";
import { useFetch } from "../hooks/useHttpRequest";
import { useState } from "react";
import { useWishlist } from "../context/WishlistContext";
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useFetch(
    `http://localhost:8008/api/v1/products/${id}`
  );
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const { toggleWishlist, isInWishlist } = useWishlist();

  const handleAddToCart = async () => {
    const token = sessionStorage.getItem("bagisto_client_token");

    if (!token) {
      alert("Veuillez vous connecter pour ajouter des produits au panier.");
      navigate("/login", { state: { from: { pathname: "/cart" } } });
      return;
    }

    let stockQty = null;
    if (product) {
      if (product.inventories && Array.isArray(product.inventories) && product.inventories.length > 0) {
        stockQty = parseInt(product.inventories[0].qty, 10);
      } else if (product.invetory_indices && Array.isArray(product.invetory_indices) && product.invetory_indices.length > 0) {
        stockQty = parseInt(product.invetory_indices[0].qty, 10);
      } else if (product.qty !== undefined && product.qty !== null) {
        stockQty = parseInt(product.qty, 10);
      } else if (product.stock_qty !== undefined && product.stock_qty !== null) {
        stockQty = parseInt(product.stock_qty, 10);
      }
    }

    const requestedQty = parseInt(quantity, 10);

    console.log("Stock Validation Debug:", {
      productName: product?.name,
      productId: product?.id,
      stockQty,
      requestedQty,
      inventories: product?.inventories,
      invetory_indices: product?.invetory_indices
    });

    if (stockQty !== null && !isNaN(stockQty)) {
      if (requestedQty > stockQty) {
        alert(`Quantité non disponible. Seulement ${stockQty} article(s) sont disponibles en stock pour ce produit.`);
        return;
      }
    }

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
          quantity: quantity
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
    }
  };
  const product = data?.data;

  let stockQty = null;
  if (product) {
    if (product.inventories && Array.isArray(product.inventories) && product.inventories.length > 0) {
      stockQty = parseInt(product.inventories[0].qty, 10);
    } else if (product.invetory_indices && Array.isArray(product.invetory_indices) && product.invetory_indices.length > 0) {
      stockQty = parseInt(product.invetory_indices[0].qty, 10);
    } else if (product.qty !== undefined && product.qty !== null) {
      stockQty = parseInt(product.qty, 10);
    } else if (product.stock_qty !== undefined && product.stock_qty !== null) {
      stockQty = parseInt(product.stock_qty, 10);
    }
  }

  let stockBadge = null;
  if (stockQty !== null && !isNaN(stockQty)) {
    if (stockQty <= 0) {
      stockBadge = (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 text-xs font-black border border-red-100 rounded-full uppercase tracking-wider">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
          Rupture de stock
        </span>
      );
    } else if (stockQty <= 5) {
      stockBadge = (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-black border border-amber-100 rounded-full uppercase tracking-wider">
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
          Stock limité : plus que {stockQty} articles !
        </span>
      );
    } else {
      stockBadge = (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-black border border-green-100 rounded-full uppercase tracking-wider">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          En Stock ({stockQty} disponibles)
        </span>
      );
    }
  }

  const images = product?.images?.length > 0 ? product.images : [{ url: "https://via.placeholder.com/600x600?text=Produit" }];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumbs */}
      <nav className="flex mb-8 text-sm font-medium text-gray-500">
        <Link to="/accueil" className="hover:text-blue-600 transition-colors">Boutique</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 truncate">{product?.name || "Détail produit"}</span>
      </nav>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Chargement de votre produit...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
          <div className="bg-red-50 p-4 rounded-full text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Erreur de chargement</h2>
          <p className="text-gray-600 max-w-md">Nous n'avons pas pu charger les détails de ce produit.</p>
        </div>
      ) : !product ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Produit introuvable</h2>
          <Link to="/accueil" className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-black transition-colors mt-4">
            Voir nos autres produits
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start text-left">
          {/* Gallery Section */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-50 rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-inner group flex items-center justify-center p-8">
              <img
                src={
                  product.images?.[0]?.path

                    ? `${product.images[0].medium_image_url}`
                    : "https://via.placeholder.com/300x300?text=Produit"
                }
                alt={product.name}
                className="max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-700 group-hover:scale-105"
              />
            </div>

            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`relative flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all ${activeImage === index ? "border-blue-600 shadow-md scale-95" : "border-transparent hover:border-gray-300"
                      }`}
                  >
                    <img
                      src={
                        product.images?.[0]?.path

                          ? `${product.images[0].medium_image_url}`
                          : "https://via.placeholder.com/300x300?text=Produit"
                      }
                      alt=""
                      className="w-full h-full object-contain p-2"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="flex flex-col h-full text-left items-start">
            <div className="w-full">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
                  Produit
                </span>
                <span className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
                  SKU: {product.sku}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight mb-4">
                {product.name}
              </h1>
              <div className="flex items-center flex-wrap gap-4 mb-8">

                {(() => {

                  const specialPrice = parseFloat(
                    product.special_price ||
                    product.prix_promo ||
                    0
                  );

                  const originalPrice = parseFloat(
                    product.regular_price ||
                    product.prix_vente ||
                    product.price ||
                    0
                  );

                  const hasPromo =
                    specialPrice > 0 &&
                    originalPrice > 0 &&
                    originalPrice !== specialPrice;

                  if (hasPromo) {

                    return (
                      <div className="flex items-center gap-3 flex-wrap">

                        {/* Prix promo */}
                        <span className="text-4xl font-bold text-red-600">
                          {specialPrice.toFixed(2)} €
                        </span>

                        {/* Prix normal barré */}
                        <span className="text-2xl text-gray-500 line-through decoration-red-500 decoration-2">
                          {originalPrice.toFixed(2)} €
                        </span>

                        {/* Badge promo */}
                        <span className="bg-red-100 text-red-600 text-sm font-semibold px-3 py-1 rounded-full">
                          Promo
                        </span>

                      </div>
                    );
                  }

                  return (
                    <span className="text-4xl font-bold text-blue-600">
                      {originalPrice.toFixed(2)} €
                    </span>
                  );

                })()}

                {stockBadge}

              </div>
              <div className="prose prose-blue max-w-none text-gray-600 mb-10 leading-relaxed">
                <div dangerouslySetInnerHTML={{ __html: product.description }} />
              </div>
            </div>

            <div className="w-full mt-auto space-y-8">
              <div className="flex flex-col sm:flex-row gap-4 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                <div className="flex items-center justify-between bg-white px-4 py-2 rounded-2xl border border-gray-200 shadow-sm min-w-[140px]">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center text-2xl font-light text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    −
                  </button>
                  <span className="text-lg font-bold text-gray-800 w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center text-2xl font-light text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    +
                  </button>
                </div>

                <button
                  disabled={stockQty !== null && !isNaN(stockQty) && stockQty <= 0}
                  onClick={handleAddToCart}
                  className={`flex-1 font-bold py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-3 group ${stockQty !== null && !isNaN(stockQty) && stockQty <= 0
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 hover:shadow-blue-300 active:scale-[0.98]"
                    }`}
                >
                  {stockQty !== null && !isNaN(stockQty) && stockQty <= 0 ? (
                    "RUPTURE DE STOCK"
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      AJOUTER AU PANIER
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
