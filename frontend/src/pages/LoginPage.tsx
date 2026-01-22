import { Box, Button, Card, CardContent, TextField, Typography } from "@mui/material";

const LoginPage = () => (
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
        <TextField label="Email" type="email" fullWidth />
        <TextField label="Password" type="password" fullWidth />
        <Button variant="contained" size="large">
          Login
        </Button>
      </CardContent>
    </Card>
  </Box>
);

export default LoginPage;
