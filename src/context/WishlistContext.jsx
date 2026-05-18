import { createContext, useState, useEffect, useContext } from "react";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchWishlist = async () => {
    const currentToken = sessionStorage.getItem("bagisto_client_token");
    if (!currentToken) {
      setWishlist([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8008/api/v1/customer/wishlist", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${currentToken}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        // Le format retourné par l'API Bagisto est [{ id: wishlistEntryId, product: {...} }]
        // On extrait le produit de chaque élément pour que l'état local soit compatible avec le reste de l'app
        const items = result.data || [];
        const products = items.map((item) => item.product).filter(Boolean);
        setWishlist(products);
      } else if (response.status === 401) {
        // Token invalide ou expiré
        sessionStorage.removeItem("bagisto_client_token");
        setWishlist([]);
      }
    } catch (e) {
      console.error("Erreur lors de la récupération de la wishlist", e);
    } finally {
      setLoading(false);
    }
  };

  // Charger la wishlist au montage et à chaque fois que l'utilisateur se connecte/déconnecte
  useEffect(() => {
    fetchWishlist();
  }, [user]);

  const addToWishlist = async (product) => {
    if (!product || !product.id) return false;
    const currentToken = sessionStorage.getItem("bagisto_client_token");
    if (!currentToken) {
      alert("Veuillez vous connecter pour ajouter des produits à votre liste d'envies.");
      window.location.href = "/login";
      return false;
    }
    try {
      const response = await fetch(`http://localhost:8008/api/v1/customer/wishlist/${product.id}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${currentToken}`
        }
      });
      if (response.ok) {
        await fetchWishlist(); // Synchroniser avec l'API
        return true;
      } else {
        const err = await response.json();
        alert(err.message || "Impossible d'ajouter le produit à votre liste d'envies.");
        return false;
      }
    } catch (e) {
      console.error("Erreur d'ajout en wishlist API", e);
      return false;
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!productId) return false;
    const currentToken = sessionStorage.getItem("bagisto_client_token");
    if (!currentToken) return false;
    try {
      const response = await fetch(`http://localhost:8008/api/v1/customer/wishlist/${productId}`, {
        method: "POST", // L'action addOrRemove de Bagisto est un POST sur l'ID du produit
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${currentToken}`
        }
      });
      if (response.ok) {
        await fetchWishlist(); // Synchroniser avec l'API
        return true;
      }
    } catch (e) {
      console.error("Erreur de suppression en wishlist API", e);
    }
    return false;
  };

  const isInWishlist = (productId) => {
    return wishlist.some((item) => item.id === productId);
  };

  const toggleWishlist = async (product) => {
    if (!product || !product.id) return;
    const currentToken = sessionStorage.getItem("bagisto_client_token");
    if (!currentToken) {
      alert("Veuillez vous connecter pour ajouter des produits à votre liste d'envies.");
      window.location.href = "/login";
      return;
    }
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product);
    }
  };

  const clearWishlist = async () => {
    const currentToken = sessionStorage.getItem("bagisto_client_token");
    if (!currentToken) return;
    try {
      const response = await fetch("http://localhost:8008/api/v1/customer/wishlist/all", {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${currentToken}`
        }
      });
      if (response.ok) {
        setWishlist([]);
      }
    } catch (e) {
      console.error("Erreur lors de la suppression totale de la wishlist API", e);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        fetchWishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist doit être utilisé au sein d'un WishlistProvider");
  }
  return context;
};
