const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Anime = sequelize.define('Anime', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    description: DataTypes.TEXT,
    yearReleased: {
        type: DataTypes.INTEGER,
    },
    episodeCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }
}, {
    tableName: 'anime',
    timestamps: true,
    updatedAt: false,
});

module.exports = Anime;
