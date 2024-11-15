const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Anime = require('./Anime');
const Genre = require('./Genre');

const AnimeGenre = sequelize.define('AnimeGenre', {}, {
    tableName: 'anime_genres',
    timestamps: false,
});

Anime.belongsToMany(Genre, { through: AnimeGenre, foreignKey: 'animeId', onDelete: 'CASCADE' });
Genre.belongsToMany(Anime, { through: AnimeGenre, foreignKey: 'genreId', onDelete: 'CASCADE' });

module.exports = AnimeGenre;
