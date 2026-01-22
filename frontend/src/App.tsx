import { Route, Routes, Navigate } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import LoginPage from "./pages/LoginPage";
import MasterAdminPage from "./pages/MasterAdminPage";
import TenantDashboard from "./pages/TenantDashboard";

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

const App = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/master" element={<MasterAdminPage />} />
      <Route path="/" element={<TenantDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </ThemeProvider>
);

export default App;
