const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Episode = require('./Episode');

const MediaFile = sequelize.define('MediaFile', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    episodeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Episode,
            key: 'id',
        },
    },
    fileType: {
        type: DataTypes.ENUM('audio', 'video', 'subtitles'),
        allowNull: false,
    },
    filePath: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    fileName: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    language: {
        type: DataTypes.STRING,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }
}, {
    tableName: 'media_files',
    timestamps: true,
    updatedAt: false,
    indexes: [
        {
            unique: true,
            fields: ['episodeId', 'fileType', 'filePath', 'language'],
            name: 'idx_unique_media'
        }
    ],
});

Episode.hasMany(MediaFile, { foreignKey: 'episodeId', onDelete: 'CASCADE' });
MediaFile.belongsTo(Episode, { foreignKey: 'episodeId' });

module.exports = MediaFile;
