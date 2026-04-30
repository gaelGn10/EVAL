import AppRoutes from "./router/AppRoutes";
import "./assets/css/style.css";
import "./assets/css/font.css";
import { AuthProvider } from "./context/AuthContext";

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
};

export default App;
