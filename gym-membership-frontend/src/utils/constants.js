// Role constants matching backend: src/constants/roles.constant.js
export const ROLES = Object.freeze({
  SUPERADMIN: "SuperAdmin",
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
});

export const ROLES_ARRAY = Object.values(ROLES);

// Gender constants matching backend: src/constants/genders.constant.js
export const GENDERS = Object.freeze({
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
});

export const GENDERS_ARRAY = Object.values(GENDERS);

// Navigation items
export const NAV_ITEMS = [
  { label: "Home", path: "/", icon: "HiOutlineGlobeAlt" },
  { label: "Dashboard", path: "/dashboard", icon: "HiOutlineHome" },
  { label: "Users", path: "/users", icon: "HiOutlineUsers" },
  { label: "Memberships", path: "/memberships", icon: "HiOutlineClipboardDocumentList" },
  { label: "Discounts", path: "/discounts", icon: "HiOutlineTag" },
  { label: "Payments", path: "/payments", icon: "HiOutlineCreditCard" },
  { label: "Attendance", path: "/attendance", icon: "HiOutlineCalendarDays" },
  { label: "Register User", path: "/register", icon: "HiOutlineUserPlus" },
];

export const COMING_SOON_ITEMS = [
  { label: "Trainers", icon: "HiOutlineAcademicCap" },
];

// Role badge color mapping
export const ROLE_BADGE_MAP = {
  SUPERADMIN: "amber",
  SuperAdmin: "amber",
  ADMIN: "rose",
  MEMBER: "primary",
};
