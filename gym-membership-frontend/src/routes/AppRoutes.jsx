import { Routes, Route } from "react-router-dom";
import Layout from "../components/layout/Layout";
import LandingPage from "../pages/LandingPage";
import ForMembers from "../pages/ForMembers";
import Dashboard from "../pages/Dashboard";
import Register from "../pages/Register";
import Login from "../pages/Login";
import UserList from "../pages/UserList";
import UserDetail from "../pages/UserDetail";
import UserEdit from "../pages/UserEdit";
import Memberships from "../pages/Memberships";
import Discounts from "../pages/Discounts";
import Payments from "../pages/Payments";
import Attendance from "../pages/Attendance";
import NotFound from "../pages/NotFound";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public pages — no sidebar/navbar */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/for-members" element={<ForMembers />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      {/* Protected pages within the Layout shell */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<UserList />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route path="/users/:id/edit" element={<UserEdit />} />
        <Route path="/memberships" element={<Memberships />} />
        <Route path="/discounts" element={<Discounts />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
