import { useParams, Link, useNavigate } from "react-router-dom";
import { useFetch } from "../hooks/useHttpRequest";
import { useState } from "react";
import { useWishlist } from "../context/WishlistContext";

export default function ProductsByCategory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useFetch(
    `http://localhost:8008/api/v1/products?category_id=${id}`
  );
  
  const { data: categoryData } = useFetch(
    `http://localhost:8008/api/v1/categories/${id}`
  );

  const products = data?.data || [];
  const categoryName = categoryData?.data?.name || "la catégorie";

  return (
    <div className="container mx-auto p-4">
      <Link to="/accueil" className="text-blue-500 hover:underline mb-4 inline-block">
        &larr; Retour aux catégories
      </Link>
      
      <h1 className="text-3xl font-bold mb-8">Produits de {categoryName}</h1>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Chargement des produits...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-2xl">
          <p className="font-bold text-xl">Oups !</p>
          <p>Impossible de charger les produits pour le moment.</p>
        </div>
      ) : products.length === 0 ? (
        <p className="text-gray-500 italic text-center py-12">Aucun produit trouvé dans cette catégorie.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );
}



function ProductCard({ product, navigate }) {
  const [quantity, setQuantity] = useState(1);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isWish = isInWishlist(product.id);

  const handleAddToCart = async () => {
    const token = sessionStorage.getItem("bagisto_client_token");

    if (!token) {
      alert("Veuillez vous connecter pour ajouter des produits au panier.");
      navigate("/login", { state: { from: { pathname: "/cart" } } });
      return;
    }

    try {
      const response = await fetch(`http://localhost:8008/api/v1/customer/cart/add/${product.id}`,
        {
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
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      alert("Produit ajouté au panier ✅");

    } catch (error) {
      console.log(error);
      alert(error.message);
    }
  };


  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 border border-gray-100">
      <div className="block relative h-52 overflow-hidden group bg-gray-50 flex items-center justify-center p-4">
        <Link to={`/product/${product.id}`} className="absolute inset-0 flex items-center justify-center p-4">
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
        
        {/* Floating Heart Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className="absolute top-3 right-3 p-2.5 rounded-full bg-white/80 backdrop-blur-md shadow-md border border-gray-100 text-gray-500 hover:text-red-500 hover:bg-white active:scale-90 transition-all z-10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 transition-colors"
            fill={isWish ? "#ef4444" : "none"}
            viewBox="0 0 24 24"
            stroke={isWish ? "#ef4444" : "currentColor"}
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <Link to={`/product/${product.id}`} className="hover:text-blue-600 transition-colors">
          <h2 className="text-lg font-bold text-gray-800 mb-1 line-clamp-1">{product.name}</h2>
        </Link>
        <p className="text-gray-500 text-sm mb-3 line-clamp-2 h-10">
          {product.short_description?.replace(/<[^>]*>/g, "") || "Aucune description disponible."}
        </p>
        
        <div className="mt-auto">
          <p className="text-xl font-bold text-gray-900 mb-4">{product.formated_price || `${product.price} €`}</p>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-1 border border-gray-200">
              <button 
    onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded transition-colors"
        >
          -
        </button>

        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-16 text-center border rounded px-2 py-1 font-medium text-gray-700 outline-none"
        />

        <button 
          onClick={() => setQuantity(quantity + 1)}
          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded transition-colors"
        >
          +
        </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleAddToCart}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg transition-all active:scale-95 shadow-md flex items-center justify-center gap-1 text-xs"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Panier
              </button>
              
              <Link
                to={`/product/${product.id}`}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1 text-xs"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Détails
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
