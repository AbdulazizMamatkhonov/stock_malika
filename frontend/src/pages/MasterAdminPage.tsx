import { Box, Button, Chip, Grid, Paper, Typography } from "@mui/material";
import PageLayout from "../components/PageLayout";
import CreateActionButton from "../components/CreateActionButton";

const tenants = [
  { id: "t-1", name: "Demo Tenant", plan: "TRIAL", status: "ACTIVE" },
  { id: "t-2", name: "Coastal Shops", plan: "PAID", status: "PAST_DUE" }
];

const MasterAdminPage = () => (
  <PageLayout
    title="Master Admin"
    actions={<CreateActionButton variant="contained">Create Tenant</CreateActionButton>}
  >
    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
      Tenants
    </Typography>
    <Grid container spacing={2}>
      {tenants.map((tenant) => (
        <Grid item xs={12} md={6} key={tenant.id}>
          <Paper sx={{ p: 3, display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {tenant.name}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Chip label={`Plan: ${tenant.plan}`} color="primary" variant="outlined" />
              <Chip label={tenant.status} color={tenant.status === "ACTIVE" ? "success" : "warning"} />
            </Box>
            <Button size="small" sx={{ alignSelf: "flex-start" }}>
              Manage Tenant
            </Button>
          </Paper>
        </Grid>
      ))}
    </Grid>
  </PageLayout>
);

export default MasterAdminPage;
