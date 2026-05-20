import AppRoutes from "./router/AppRoutes";
import "./assets/css/style.css";
import "./assets/css/font.css";
import { AuthProvider } from "./context/AuthContext";
import { WishlistProvider } from "./context/WishlistContext";


const App = () => {
  return (
    <AuthProvider>
      <WishlistProvider>
        <AppRoutes />
      </WishlistProvider>
    </AuthProvider>
  )
};

export default App;
