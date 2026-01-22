import { Box, Button, Grid, Paper, Typography } from "@mui/material";
import PageLayout from "../components/PageLayout";
import StatCard from "../components/StatCard";

const TenantDashboard = () => (
  <PageLayout
    title="Downtown Store"
    actions={<Button variant="contained">New Sale</Button>}
  >
    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
      Today at a glance
    </Typography>
    <Grid container spacing={2}>
      <Grid item xs={12} md={3}>
        <StatCard label="Revenue" value="$4,520" helper="+12% vs yesterday" />
      </Grid>
      <Grid item xs={12} md={3}>
        <StatCard label="COGS" value="$2,310" helper="FIFO batches" />
      </Grid>
      <Grid item xs={12} md={3}>
        <StatCard label="Gross Profit" value="$2,210" helper="48.9% margin" />
      </Grid>
      <Grid item xs={12} md={3}>
        <StatCard label="Expenses" value="$320" helper="Rent & delivery" />
      </Grid>
    </Grid>

    <Grid container spacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12} md={7}>
        <Paper sx={{ p: 3, height: "100%" }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Low stock alerts
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography>Arabica 1kg</Typography>
              <Typography color="error">12 units</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography>Oat Milk 1L</Typography>
              <Typography color="error">9 units</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography>Espresso Cups</Typography>
              <Typography color="error">4 units</Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>
      <Grid item xs={12} md={5}>
        <Paper sx={{ p: 3, height: "100%" }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Supplier balances
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography>Global Supplies</Typography>
              <Typography>$1,120</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography>City Distributors</Typography>
              <Typography>$640</Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>

    <Grid container spacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Recent sales
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Typography>#1042 · $120.50 · 5 items</Typography>
            <Typography>#1041 · $98.20 · 3 items</Typography>
            <Typography>#1040 · $210.00 · 12 items</Typography>
          </Box>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Purchases in transit
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Typography>Global Supplies · $850 · Awaiting delivery</Typography>
            <Typography>City Distributors · $460 · Partial paid</Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  </PageLayout>
);

export default TenantDashboard;
