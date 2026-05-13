import ReadFileExample from "../pages/examples/ReadFileExample";
import Home from "../pages/Home";
import NotFound from "../pages/NotFound";
import login from "../components/auth/Login";
import accueil from "../pages/accueil";
import ProductsByCategory from "../pages/ProductsByCategory";
import ProductDetail from "../pages/ProductDetail";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Orders from "../pages/Orders";

const routes = [
  {
    path: "/",
    component: Home,
    title: "Accueil",
  },
  {
    path: "/accueil",
    component: accueil,
    title: "accueil",
  },
  {
    path: "/login",
    component: login,
    title: "login",
  },

  {
    path: "/examples/csv",
    component: ReadFileExample,
    title: "Accueil",
  },
  {
    path: "/category/:id/products",
    component: ProductsByCategory,
    title: "Produits par catégorie",
  },
  {
    path: "/product/:id",
    component: ProductDetail,
    title: "Détail produit",
  },
  {
    path: "/cart",
    component: Cart,
    title: "Mon Panier",
  },
  {
    path: "/checkout",
    component: Checkout,
    title: "Validation Commande",
  },
  {
    path: "/orders",
    component: Orders,
    title: "Mes Commandes",
  },
  {
    path: "*",
    component: NotFound,
    title: "Not Found",
  },
];

export default routes;