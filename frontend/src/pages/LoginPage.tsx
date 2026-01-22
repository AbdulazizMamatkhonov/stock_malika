import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Card, CardContent, TextField, Typography } from "@mui/material";
import api from "../lib/api";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      navigate("/");
    } catch (err) {
      setError("Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f5f7fb 0%, #e3f2fd 100%)"
      }}
    >
      <Card sx={{ width: 420, boxShadow: 6 }}>
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="h5" fontWeight={700}>
            Sign in
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Access your shop sales dashboard.
          </Typography>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField label="Email" type="email" fullWidth value={email} onChange={(event) => setEmail(event.target.value)} />
          <TextField label="Password" type="password" fullWidth value={password} onChange={(event) => setPassword(event.target.value)} />
          <Button variant="contained" size="large" onClick={handleSubmit} disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
