import { useFetch } from "../hooks/useHttpRequest";
import { Link } from "react-router-dom";

export default function ListCategories() {

  const { data } = useFetch(
  " http://localhost:8008/api/v1/categories?sort=id&page=1&limit=100"
  );

  return (
    <div className="flex flex-col p-2 gap-2">

      <h1 className="text-2xl font-bold mb-4">Liste des Categories</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.data?.filter(cat => cat.id !== 1 && cat.id !== "1").map((categorie) => (
          <Link
            key={categorie.id}
            to={`/category/${categorie.id}/products`}
            className="border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer block"
          >
            <h2 className="text-xl font-semibold text-blue-600 mb-2">{categorie.name}</h2>
            <p className="text-gray-600 line-clamp-3">
              {categorie.description.replace(/<[^>]*>/g, "")}
            </p>
          </Link>
        ))}
      </div>

    </div>
  );
}