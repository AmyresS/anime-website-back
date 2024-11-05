require('./transcoder');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const animeRoutes = require('./routes/animeRoutes');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Підключаємо маршрути для аніме
app.use('/api/anime', animeRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
