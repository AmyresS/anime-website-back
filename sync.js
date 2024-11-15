const sequelize = require('./config/sequelize');
require('./models/Anime');
require('./models/Episode');
require('./models/Genre');
require('./models/AnimeGenre');
require('./models/AlternativeTitle');
require('./models/MediaFile');

sequelize.sync({ alter: true }).then(() => {
    console.log("Database synchronized successfully");
}).catch(err => {
    console.error("Failed to synchronize database:", err);
});
