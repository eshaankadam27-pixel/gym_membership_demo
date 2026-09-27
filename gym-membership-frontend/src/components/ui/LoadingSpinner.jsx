const LoadingSpinner = ({ text = "Loading..." }) => {
  return (
    <div className="spinner-container">
      <div className="spinner" />
      <span className="spinner-text">{text}</span>
    </div>
  );
};

export default LoadingSpinner;
