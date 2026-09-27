import { HiOutlineInbox } from "react-icons/hi2";
import { Link } from "react-router-dom";

const EmptyState = ({
  icon: Icon = HiOutlineInbox,
  title = "No data found",
  message = "There's nothing here yet.",
  actionLabel,
  actionTo,
}) => {
  return (
    <div className="empty-state fade-in">
      <div className="empty-state-icon">
        <Icon />
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn btn-primary" style={{ marginTop: 8 }}>
          {actionLabel}
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
