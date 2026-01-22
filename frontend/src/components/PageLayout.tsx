import { ReactNode } from "react";
import { AppBar, Box, Container, Toolbar, Typography, Button } from "@mui/material";

interface PageLayoutProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

const PageLayout = ({ title, actions, children }: PageLayoutProps) => (
  <Box sx={{ minHeight: "100vh" }}>
    <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: "1px solid #e0e0e0" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {actions}
          <Button variant="outlined" size="small">
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
    <Container sx={{ py: 4 }}>{children}</Container>
  </Box>
);

export default PageLayout;
