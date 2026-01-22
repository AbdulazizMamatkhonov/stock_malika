import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import api from "../lib/api";
import { useStoreContext } from "../lib/storeContext";

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const { stores, activeStoreId } = useStoreContext();
  const [filterStoreId, setFilterStoreId] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    description: "",
    amount: "",
    storeId: ""
  });

  useEffect(() => {
    if (activeStoreId && filterStoreId === "all") {
      setFilterStoreId(activeStoreId);
    }
  }, [activeStoreId, filterStoreId]);

  useEffect(() => {
    const load = async () => {
      const response = await api.get("/expenses", {
        params: filterStoreId === "all" ? undefined : { storeId: filterStoreId }
      });
      setExpenses(response.data || []);
    };
    load();
  }, [filterStoreId]);

  const totals = useMemo(() => {
    const totalAmount = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    return {
      count: expenses.length,
      totalAmount
    };
  }, [expenses]);

  const handleOpenDialog = () => {
    setFormState({
      description: "",
      amount: "",
      storeId: activeStoreId || ""
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleSubmit = async () => {
    if (!formState.description || !formState.amount) {
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post("/expenses", {
        description: formState.description,
        amount: Number(formState.amount),
        storeId: formState.storeId || undefined
      });
      setIsDialogOpen(false);
      const response = await api.get("/expenses", {
        params: filterStoreId === "all" ? undefined : { storeId: filterStoreId }
      });
      setExpenses(response.data || []);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Expenses
        </Typography>
        <Button variant="contained" onClick={handleOpenDialog}>
          Add Expense
        </Button>
      </Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Total expenses
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              ${totals.totalAmount.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {totals.count} records
            </Typography>
          </Box>
          <Box sx={{ minWidth: 220 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
              Filter by store
            </Typography>
            <Select
              fullWidth
              size="small"
              value={filterStoreId}
              onChange={(event) => setFilterStoreId(event.target.value)}
            >
              <MenuItem value="all">All stores</MenuItem>
              {stores.map((store) => (
                <MenuItem key={store._id} value={store._id}>
                  {store.name}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Box>
      </Paper>
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Store</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense._id}>
                <TableCell>{expense.description}</TableCell>
                <TableCell align="right">${expense.amount.toFixed(2)}</TableCell>
                <TableCell>
                  {stores.find((store) => store._id === expense.storeId)?.name || "Unassigned"}
                </TableCell>
                <TableCell>{new Date(expense.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>New Expense</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Description"
            value={formState.description}
            onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
            fullWidth
            required
          />
          <TextField
            label="Amount"
            type="number"
            value={formState.amount}
            onChange={(event) => setFormState((prev) => ({ ...prev, amount: event.target.value }))}
            fullWidth
            required
            inputProps={{ min: 0, step: "0.01" }}
          />
          <Select
            fullWidth
            displayEmpty
            value={formState.storeId}
            onChange={(event) => setFormState((prev) => ({ ...prev, storeId: event.target.value }))}
          >
            <MenuItem value="">No store</MenuItem>
            {stores.map((store) => (
              <MenuItem key={store._id} value={store._id}>
                {store.name}
              </MenuItem>
            ))}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExpensesPage;
