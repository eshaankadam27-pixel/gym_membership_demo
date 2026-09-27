import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="main-content">
        <Navbar onHamburgerClick={() => setSidebarOpen((prev) => !prev)} />
        <div className="page-container">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
