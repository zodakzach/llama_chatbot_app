import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background">
      <h1 className="text-4xl font-bold text-text">404 - Page Not Found</h1>
      <p className="mt-2 text-text">
        Oops! The page you are looking for does not exist.
      </p>
      <Link
        to="/"
        className="mt-4 rounded bg-blue-600 px-4 py-2 text-text transition duration-200 hover:bg-blue-700"
      >
        Go Back Home
      </Link>
    </div>
  );
}

export default NotFoundPage;
