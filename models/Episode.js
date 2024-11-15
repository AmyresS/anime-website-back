const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Anime = require('./Anime');

const Episode = sequelize.define('Episode', {
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
    episodeNumber: {
        type: DataTypes.INTEGER,
    },
    episodeName: {
        type: DataTypes.STRING,
    },
    filePath: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    processed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    lastProcessed: {
        type: DataTypes.DATE,
    },
    error: DataTypes.TEXT,
}, {
    tableName: 'episodes',
    timestamps: false,
});

Anime.hasMany(Episode, { foreignKey: 'animeId', onDelete: 'CASCADE' });
Episode.belongsTo(Anime, { foreignKey: 'animeId' });

module.exports = Episode;
