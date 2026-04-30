import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">404 - Not Found</h2>
      <p className="mb-4">Oops! The page you're looking for doesn't exist.</p>
      <Link to="/" className="text-blue-500 hover:underline">
        Back to Home
      </Link>
    </div>
  );
};

export default NotFound;