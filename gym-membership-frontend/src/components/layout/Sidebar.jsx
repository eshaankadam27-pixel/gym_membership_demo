import { NavLink, useLocation } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineUserPlus,
  HiOutlineClipboardDocumentList,
  HiOutlineCreditCard,
  HiOutlineCalendarDays,
  HiOutlineAcademicCap,
  HiOutlineGlobeAlt,
  HiOutlineTag,
} from "react-icons/hi2";
import { IoFitnessOutline } from "react-icons/io5";

const iconMap = {
  HiOutlineHome: HiOutlineHome,
  HiOutlineUsers: HiOutlineUsers,
  HiOutlineUserPlus: HiOutlineUserPlus,
  HiOutlineClipboardDocumentList: HiOutlineClipboardDocumentList,
  HiOutlineTag: HiOutlineTag,
  HiOutlineCreditCard: HiOutlineCreditCard,
  HiOutlineCalendarDays: HiOutlineCalendarDays,
  HiOutlineAcademicCap: HiOutlineAcademicCap,
  HiOutlineGlobeAlt: HiOutlineGlobeAlt,
};

import { NAV_ITEMS, COMING_SOON_ITEMS } from "../../utils/constants";

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? "visible" : ""}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <IoFitnessOutline />
          </div>
          <div>
            <h2>FitTrack</h2>
            <span>Management Suite</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main Menu</div>

          {NAV_ITEMS.map((item) => {
            const IconComponent = iconMap[item.icon];
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
                onClick={onClose}
              >
                <span className="sidebar-link-icon">
                  {IconComponent && <IconComponent />}
                </span>
                {item.label}
              </NavLink>
            );
          })}

          <div className="sidebar-section-label" style={{ marginTop: "16px" }}>
            Coming Soon
          </div>

          {COMING_SOON_ITEMS.map((item) => {
            const IconComponent = iconMap[item.icon];
            return (
              <div key={item.label} className="sidebar-link disabled">
                <span className="sidebar-link-icon">
                  {IconComponent && <IconComponent />}
                </span>
                {item.label}
                <span className="sidebar-coming-soon-badge">Soon</span>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
