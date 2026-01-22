import { ReactNode, useEffect } from "react";
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Toolbar,
  Typography
} from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useStoreContext } from "../lib/storeContext";

const drawerWidth = 240;

const navItems = [
  { label: "Dashboard", path: "/" },
  { label: "Products", path: "/products" },
  { label: "Inventory", path: "/inventory" },
  { label: "Suppliers", path: "/suppliers" },
  { label: "Purchases", path: "/purchases" },
  { label: "Sales", path: "/sales" },
  { label: "Expenses", path: "/expenses" },
  { label: "Reports", path: "/reports" }
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { stores, setStores, activeStoreId, setActiveStoreId } = useStoreContext();

  useEffect(() => {
    const loadStores = async () => {
      const response = await api.get("/stores");
      setStores(response.data);
      if (!activeStoreId && response.data.length > 0) {
        setActiveStoreId(response.data[0]._id);
      }
    };
    loadStores();
  }, [activeStoreId, setActiveStoreId, setStores]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/login");
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", background: "#f5f7fb" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" }
        }}
      >
        <Toolbar>
          <Typography variant="h6" fontWeight={700}>
            Shop Ops
          </Typography>
        </Toolbar>
        <Divider />
        <List>
          {navItems.map((item) => (
            <ListItemButton
              key={item.path}
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" color="inherit" elevation={0}>
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                {navItems.find((item) => item.path === location.pathname)?.label || "Dashboard"}
              </Typography>
              <Select
                size="small"
                value={activeStoreId || ""}
                displayEmpty
                onChange={(event) => setActiveStoreId(event.target.value)}
                sx={{ minWidth: 180 }}
              >
                {stores.map((store) => (
                  <MenuItem key={store._id} value={store._id}>
                    {store.name}
                  </MenuItem>
                ))}
              </Select>
            </Box>
            <ListItemButton onClick={handleLogout} sx={{ width: "auto" }}>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 3 }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
