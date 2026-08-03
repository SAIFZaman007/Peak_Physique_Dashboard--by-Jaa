import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import DashboardLayout from "./pages/DashboardLayout.jsx";
import Overview from "./pages/Overview.jsx";
import Clients from "./pages/Clients.jsx";
import ClientDetail from "./pages/ClientDetail.jsx";
import Bookings from "./pages/Bookings.jsx";
import Payments from "./pages/Payments.jsx";
import Content from "./pages/Content.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="payments" element={<Payments />} />
        <Route path="content" element={<Content />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
