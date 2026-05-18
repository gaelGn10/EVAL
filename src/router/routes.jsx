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
import AdminLogin from "../components/admin/AdminLogin";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminResetData from "../pages/admin/AdminResetData";
import AdminOrders from "../pages/admin/AdminOrders";
import AdminImport from "../pages/admin/AdminImport";


const routes = [
  {
    path: "/",
    component: Home,
    title: "Accueil",
    private: false,
  },
  {
    path: "/accueil",
    component: accueil,
    title: "accueil",
    private: false,
  },
  {
    path: "/login",
    component: login,
    title: "login",
    private: false,
  },
  {
    path: "/admin/login",
    component: AdminLogin,
    title: "Admin Login",
    private: false,
    admin: false,
  },
  {
    path: "/admin/dashboard",
    component: AdminDashboard,
    title: "Admin Dashboard",
    private: true,
    admin: true,
  },
  {
    path: "/admin/orders",
    component: AdminOrders,
    title: "Admin Orders",
    private: true,
    admin: true,
  },
  {
    path: "/admin/reset-data",
    component: AdminResetData,
    title: "Reset Data",
    private: true,
    admin: true,
  },
  {
    path: "/admin/import",
    component: AdminImport,
    title: "Import Data",
    private: true,
    admin: true,
  },

  {
    path: "/examples/csv",
    component: ReadFileExample,
    title: "Accueil",
    private: true,
  },
  {
    path: "/category/:id/products",
    component: ProductsByCategory,
    title: "Produits par catégorie",
    private: false,
  },
  {
    path: "/product/:id",
    component: ProductDetail,
    title: "Détail produit",
    private: false,
  },
  {
    path: "/cart",
    component: Cart,
    title: "Mon Panier",
    private: true,
  },
  {
    path: "/checkout",
    component: Checkout,
    title: "Validation Commande",
    private: true,
  },
  {
    path: "/orders",
    component: Orders,
    title: "Mes Commandes",
    private: true,
  },
  {
    path: "*",
    component: NotFound,
    title: "Not Found",
    private: false,
  },
];

export default routes;