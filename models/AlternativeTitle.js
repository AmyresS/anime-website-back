const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Anime = require('./Anime');

const AlternativeTitle = sequelize.define('AlternativeTitle', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    animeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Anime,
            key: 'id',
        },
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    language: {
        type: DataTypes.STRING,
        defaultValue: 'unknown',
    },
}, {
    tableName: 'alternative_titles',
    timestamps: false,
});

Anime.hasMany(AlternativeTitle, { foreignKey: 'animeId', onDelete: 'CASCADE' });
AlternativeTitle.belongsTo(Anime, { foreignKey: 'animeId' });

module.exports = AlternativeTitle;
