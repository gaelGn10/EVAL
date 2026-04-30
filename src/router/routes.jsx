import ReadFileExample from "../pages/examples/ReadFileExample";
import Home from "../pages/Home";
import NotFound from "../pages/NotFound";

const routes = [
  {
    path: "/",
    component: Home,
    title: "Accueil",
  },
  {
    path: "/examples/csv",
    component: ReadFileExample,
    title: "Accueil",
  },
  {
    path: "*",
    component: NotFound,
    title: "Not Found",
  },
];

export default routes;