const employerRoutes = require("./routes/employer");

// Add this line after other app.use statements
app.use("/api/employer", employerRoutes);
