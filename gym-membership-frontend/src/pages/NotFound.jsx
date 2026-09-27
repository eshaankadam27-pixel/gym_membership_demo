import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="not-found-page fade-in">
      <div className="not-found-code gradient-text">404</div>
      <h2>Page Not Found</h2>
      <p style={{ color: "var(--text-secondary)", maxWidth: 400 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: 8 }}>
        Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
