import { useEffect, useMemo, useState } from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import StatCard from "../components/StatCard";
import api from "../lib/api";
import { useStoreContext } from "../lib/storeContext";

type SalesRow = { day: string; revenue: number; cogs: number; salesCount: number };

type Sale = {
  _id: string;
  totalRevenue: number;
  totalCogs: number;
  createdAt: string;
};

type Purchase = {
  _id: string;
  totalCost: number;
  createdAt: string;
};

const TenantDashboard = () => {
  const { activeStoreId } = useStoreContext();
  const [salesRows, setSalesRows] = useState<SalesRow[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!activeStoreId) {
        return;
      }
      const [summaryRes, salesRes, purchasesRes] = await Promise.all([
        api.get("/reports/sales", { params: { storeId: activeStoreId } }),
        api.get("/sales"),
        api.get("/purchases")
      ]);
      setSalesRows(summaryRes.data.revenueRows || []);
      setSales(salesRes.data || []);
      setPurchases(purchasesRes.data || []);
    };
    load();
  }, [activeStoreId]);

  const totals = useMemo(() => {
    const revenue = salesRows.reduce((sum, row) => sum + row.revenue, 0);
    const cogs = salesRows.reduce((sum, row) => sum + row.cogs, 0);
    const grossProfit = revenue - cogs;
    return { revenue, cogs, grossProfit };
  }, [salesRows]);

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Overview
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <StatCard label="Revenue" value={`$${totals.revenue.toFixed(2)}`} />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard label="COGS" value={`$${totals.cogs.toFixed(2)}`} />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard label="Gross Profit" value={`$${totals.grossProfit.toFixed(2)}`} />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard label="Sales" value={`${salesRows.reduce((sum, row) => sum + row.salesCount, 0)}`} />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Recent sales
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {sales.slice(0, 5).map((sale) => (
                <Typography key={sale._id}>
                  #{sale._id.slice(-6)} · ${sale.totalRevenue.toFixed(2)} · {new Date(sale.createdAt).toLocaleDateString()}
                </Typography>
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Recent purchases
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {purchases.slice(0, 5).map((purchase) => (
                <Typography key={purchase._id}>
                  #{purchase._id.slice(-6)} · ${purchase.totalCost.toFixed(2)} · {new Date(purchase.createdAt).toLocaleDateString()}
                </Typography>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TenantDashboard;
