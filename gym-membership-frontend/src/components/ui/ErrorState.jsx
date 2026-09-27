import { HiOutlineExclamationTriangle } from "react-icons/hi2";

const ErrorState = ({
  message = "Something went wrong.",
  onRetry,
}) => {
  return (
    <div className="error-state fade-in">
      <div className="error-state-icon">
        <HiOutlineExclamationTriangle />
      </div>
      <h3>Oops!</h3>
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry} style={{ marginTop: 8 }}>
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
