import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login.jsx";
import AcceptInvite from "./pages/AcceptInvite.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RequireModule from "./components/RequireModule.jsx";
import RequireAdmin from "./components/RequireAdmin.jsx";
import DashboardLayout from "./pages/DashboardLayout.jsx";
import Overview from "./pages/Overview.jsx";
import Clients from "./pages/Clients.jsx";
import ClientDetail from "./pages/ClientDetail.jsx";
import Bookings from "./pages/Bookings.jsx";
import Payments from "./pages/Payments.jsx";
import Content from "./pages/Content.jsx";
import Messages from "./pages/Messages.jsx";
import RoleMatrix from "./pages/RoleMatrix.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RequireModule module="overview"><Overview /></RequireModule>} />
        <Route path="clients" element={<RequireModule module="clients"><Clients /></RequireModule>} />
        <Route path="clients/:id" element={<RequireModule module="clients"><ClientDetail /></RequireModule>} />
        <Route path="bookings" element={<RequireModule module="bookings"><Bookings /></RequireModule>} />
        <Route path="payments" element={<RequireModule module="payments"><Payments /></RequireModule>} />
        <Route path="content" element={<RequireModule module="content"><Content /></RequireModule>} />
        <Route path="messages" element={<Messages />} />
        <Route path="role-matrix" element={<RequireAdmin><RoleMatrix /></RequireAdmin>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}