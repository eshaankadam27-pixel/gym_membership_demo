import { ROLE_BADGE_MAP } from "../../utils/constants";

const Badge = ({ children, variant = "primary" }) => {
  return <span className={`badge badge-${variant}`}>{children}</span>;
};

/**
 * Convenience wrapper that picks the badge color based on the role string.
 */
export const RoleBadge = ({ role }) => {
  const variant = ROLE_BADGE_MAP[role] || "primary";
  return <Badge variant={variant}>{role}</Badge>;
};

export default Badge;
