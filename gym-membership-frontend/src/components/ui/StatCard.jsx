const StatCard = ({ icon: Icon, label, value, colorClass = "primary", comingSoon = false }) => {
  return (
    <div className="card stat-card">
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div className={`stat-card-icon ${colorClass}`}>
          {Icon && <Icon />}
        </div>
      </div>
      {comingSoon ? (
        <div className="stat-card-value coming-soon">Coming Soon</div>
      ) : (
        <div className="stat-card-value">{value ?? "—"}</div>
      )}
    </div>
  );
};

export default StatCard;
