import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFetch } from "../hooks/useHttpRequest";
import { useWishlist } from "../context/WishlistContext";

export default function ListCategories() {
  const { data, loading, error } = useFetch(
    "http://localhost:8008/api/v1/categories?parent_id=1&sort=id&page=1&limit=100"
  );

  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleExpand = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const categories = data?.data || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <main className="max-w-7xl mx-auto w-full p-6 md:p-8 flex-grow">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Liste des Catégories</h1>
            <p className="text-gray-500 font-semibold text-sm mt-1">
              Explorez nos univers de produits importés et gérez vos achats en toute simplicité
            </p>
          </div>
          <span className="bg-blue-50 text-blue-700 text-xs font-black px-4 py-2.5 rounded-2xl border border-blue-100 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping"></span>
            {categories.filter(cat => cat.id !== 1 && cat.id !== "1").length} Catégories disponibles
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 font-bold text-lg uppercase tracking-wider animate-pulse">Chargement des catégories...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-8 rounded-[2rem] border border-red-100 text-center max-w-xl mx-auto">
            <h3 className="text-2xl font-black mb-2">Erreur de chargement</h3>
            <p className="font-medium mb-4">Impossible de récupérer les catégories du catalogue.</p>
          </div>
        ) : categories.filter(cat => cat.id !== 1 && cat.id !== "1").length === 0 ? (
          <div className="bg-white rounded-[2rem] p-16 border border-gray-100 text-center shadow-sm">
            <p className="text-gray-400 font-bold text-xl mb-2">Aucune catégorie trouvée</p>
            <p className="text-gray-500">Commencez par importer des données via le panneau d'administration.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {categories
              .filter(cat => cat.id !== 1 && cat.id !== "1")
              .map((categorie) => (
                <CategorySection
                  key={categorie.id}
                  category={categorie}
                  isExpanded={!!expandedCategories[categorie.id]}
                  onToggle={() => toggleExpand(categorie.id)}
                />
              ))}
          </div>
        )}
      </main>
    </div>
  );
}

function CategorySection({ category, isExpanded, onToggle }) {
  const [productCount, setProductCount] = useState(null);

  const handleProductsLoaded = useCallback((count) => {
    setProductCount(count);
  }, []);

  return (
    <div className="mb-4 bg-white rounded-[2.5rem] p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      <div
        onClick={onToggle}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100 cursor-pointer select-none group"
      >
        <div className="flex-grow">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-6 bg-blue-600 rounded-full transition-all duration-300 group-hover:scale-y-125"></span>
            {category.name}
          </h2>
          <p className="text-gray-500 font-semibold text-sm mt-1">
            {(category.description || "").replace(/<[^>]*>/g, "") || "Découvrez notre sélection de produits haut de gamme."}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <Link
            to={`/category/${category.id}/products`}
            onClick={(e) => e.stopPropagation()}
            className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 flex-shrink-0 active:scale-95"
          >
            Voir tout {productCount !== null ? `(${productCount})` : ""}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2.5 rounded-2xl transition-all flex items-center justify-center cursor-pointer"
            aria-label={isExpanded ? "Replier" : "Déplier"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isExpanded ? "mt-8 max-h-[1500px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        {isExpanded && (
          <CategoryProductsList
            categoryId={category.id}
            onProductsLoaded={handleProductsLoaded}
          />
        )}
      </div>
    </div>
  );
}

function CategoryProductsList({ categoryId, onProductsLoaded }) {
  const { data, loading, error } = useFetch(
    `http://localhost:8008/api/v1/products?category_id=${categoryId}`
  );

  const products = data?.data || [];

  useEffect(() => {
    if (data?.data) {
      onProductsLoaded(data.data.length);
    }
  }, [data, onProductsLoaded]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-10 justify-center text-gray-400 font-bold text-sm uppercase tracking-wider animate-pulse">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        Chargement des produits de la catégorie...
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-sm py-4">Erreur lors du chargement des produits.</p>;
  }

  if (products.length === 0) {
    return <p className="text-gray-400 italic py-10 text-center">Aucun produit associé à cette catégorie pour le moment.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.slice(0, 4).map((product) => (
        <ProductItemCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductItemCard({ product }) {
  const [quantity, setQuantity] = useState(1);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isWish = isInWishlist(product.id);
  const navigate = useNavigate();

  const handleAddToCart = async () => {
    const token = sessionStorage.getItem("bagisto_client_token");

    if (!token) {
      alert("Veuillez vous connecter pour ajouter des produits au panier.");
      navigate("/login");
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

    if (stockQty !== null && !isNaN(stockQty)) {
      if (requestedQty > stockQty) {
        alert(`Quantité non disponible. Seulement ${stockQty} article(s) sont disponibles en stock.`);
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
      if (!response.ok) throw new Error(result.message);

      alert("Produit ajouté au panier ✅");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  // Modern offline-friendly placeholder SVG
  const fallbackImage = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239ca3af">Produit</text></svg>`;

  return (
    <div className="bg-white rounded-[2rem] shadow-sm hover:shadow-md border border-gray-100 overflow-hidden flex flex-col transition-all duration-300 group">
      <div className="relative h-48 bg-gray-50 flex items-center justify-center p-4 overflow-hidden">
        <Link to={`/product/${product.id}`} className="absolute inset-0 flex items-center justify-center p-4">
          <img
            src={product.images?.[0]?.path ? `${product.images[0].medium_image_url}` : fallbackImage}
            alt={product.name}
            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Floating Heart Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className="absolute top-3 right-3 p-2.5 rounded-full bg-white/90 backdrop-blur-sm shadow border border-gray-50 text-gray-500 hover:text-red-500 active:scale-95 transition-all z-10 cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4.5 w-4.5"
            fill={isWish ? "#ef4444" : "none"}
            viewBox="0 0 24 24"
            stroke={isWish ? "#ef4444" : "currentColor"}
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <Link to={`/product/${product.id}`} className="hover:text-blue-600 transition-colors">
          <h3 className="text-base font-bold text-gray-800 line-clamp-1 mb-1">{product.name}</h3>
        </Link>
        <p className="text-gray-400 font-mono text-[10px] uppercase tracking-wider mb-2">SKU: {product.sku}</p>
        <p className="text-gray-500 text-xs line-clamp-2 h-8 mb-4">
          {product.short_description?.replace(/<[^>]*>/g, "") || "Aucune description disponible."}
        </p>

        <div className="mt-auto">
          {(() => {
            // On affiche le mode promo uniquement si le prix d'origine est distinct du prix spécial
            const specialPrice = parseFloat(product.special_price || product.prix_promo || 0);
            const originalPrice = parseFloat(product.regular_price || product.prix_vente || product.price || 0);
            const hasPromo = specialPrice > 0 && originalPrice > 0 && originalPrice !== specialPrice;

            if (hasPromo) {
              return (
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-lg font-black text-red-600">
                    {specialPrice.toFixed(2)} €
                  </span>
                  <span className="text-xs text-gray-400 line-through decoration-red-500 decoration-2">
                    {originalPrice.toFixed(2)} €
                  </span>
                  <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Promo
                  </span>
                </div>
              );
            }

            return (
              <p className="text-lg font-black text-gray-900 mb-3">
                {product.prix_vente ? `${parseFloat(product.prix_vente).toFixed(2)} €` : (product.formated_price || `${originalPrice.toFixed(2)} €`)}
              </p>
            );
          })()}

          <div className="flex gap-2">
            <button
              onClick={handleAddToCart}
              className="flex-grow bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-3 rounded-xl transition-all active:scale-95 shadow-sm text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Ajouter
            </button>
            <Link
              to={`/product/${product.id}`}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 px-3 rounded-xl transition-all text-xs flex items-center justify-center active:scale-95"
            >
              Détails
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}