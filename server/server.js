const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 5001;


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


sequelize
  .authenticate()
  .then(() => {
    console.log('✓ Database connection has been established successfully.');
  })
  .catch((err) => {
    console.error('✗ Unable to connect to the database:', err);
  });


app.get('/', (req, res) => {
  res.json({ message: 'MasterClass API Server is running' });
});


app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/instructors', require('./routes/instructorRoutes'));
app.use('/api/participants', require('./routes/participantRoutes'));
app.use('/api/masterclasses', require('./routes/masterClassRoutes'));


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

