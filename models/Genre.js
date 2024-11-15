const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Genre = sequelize.define('Genre', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
}, {
    tableName: 'genres',
    timestamps: false,
});

module.exports = Genre;
