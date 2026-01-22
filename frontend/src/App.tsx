import { Navigate, Route, Routes } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import LoginPage from "./pages/LoginPage";
import TenantDashboard from "./pages/TenantDashboard";
import InventoryPage from "./pages/InventoryPage";
import ProductsPage from "./pages/ProductsPage";
import SuppliersPage from "./pages/SuppliersPage";
import PurchasesPage from "./pages/PurchasesPage";
import SalesPage from "./pages/SalesPage";
import ExpensesPage from "./pages/ExpensesPage";
import ReportsPage from "./pages/ReportsPage";
import AppLayout from "./components/AppLayout";
import { StoreProvider } from "./lib/storeContext";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2"
    },
    background: {
      default: "#f5f7fb"
    }
  }
});

const Protected = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <StoreProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <Protected>
              <AppLayout>
                <TenantDashboard />
              </AppLayout>
            </Protected>
          }
        />
        <Route
          path="/products"
          element={
            <Protected>
              <AppLayout>
                <ProductsPage />
              </AppLayout>
            </Protected>
          }
        />
        <Route
          path="/inventory"
          element={
            <Protected>
              <AppLayout>
                <InventoryPage />
              </AppLayout>
            </Protected>
          }
        />
        <Route
          path="/suppliers"
          element={
            <Protected>
              <AppLayout>
                <SuppliersPage />
              </AppLayout>
            </Protected>
          }
        />
        <Route
          path="/purchases"
          element={
            <Protected>
              <AppLayout>
                <PurchasesPage />
              </AppLayout>
            </Protected>
          }
        />
        <Route
          path="/sales"
          element={
            <Protected>
              <AppLayout>
                <SalesPage />
              </AppLayout>
            </Protected>
          }
        />
        <Route
          path="/expenses"
          element={
            <Protected>
              <AppLayout>
                <ExpensesPage />
              </AppLayout>
            </Protected>
          }
        />
        <Route
          path="/reports"
          element={
            <Protected>
              <AppLayout>
                <ReportsPage />
              </AppLayout>
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </StoreProvider>
  </ThemeProvider>
);

export default App;
