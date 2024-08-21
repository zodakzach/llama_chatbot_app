import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-800">
      <h1 className="text-4xl font-bold text-white">404 - Page Not Found</h1>
      <p className="mt-2 text-white">
        Oops! The page you are looking for does not exist.
      </p>
      <Link
        to="/"
        className="mt-4 rounded bg-blue-600 px-4 py-2 text-white transition duration-200 hover:bg-blue-700"
      >
        Go Back Home
      </Link>
    </div>
  );
}

export default NotFoundPage;
