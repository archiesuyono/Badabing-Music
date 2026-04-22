require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');
const config = require(path.join(__dirname, '../../config/config.json'))[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port || 5432,
  dialect: config.dialect,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const db = {
  sequelize,
  Sequelize
};

// Import models
db.User = require('./User')(sequelize, Sequelize);
db.Playlist = require('./Playlist')(sequelize, Sequelize);
db.Song = require('./Song')(sequelize, Sequelize);
db.PlaylistSong = require('./PlaylistSong')(sequelize, Sequelize);
db.Favorite = require('./Favorite')(sequelize, Sequelize);
db.SearchHistory = require('./SearchHistory')(sequelize, Sequelize);

// Define associations
db.User.hasMany(db.Playlist, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.Playlist.belongsTo(db.User, { foreignKey: 'userId' });

db.Playlist.belongsToMany(db.Song, { through: db.PlaylistSong, foreignKey: 'playlistId' });
db.Song.belongsToMany(db.Playlist, { through: db.PlaylistSong, foreignKey: 'songId' });

db.User.hasMany(db.Favorite, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.Favorite.belongsTo(db.User, { foreignKey: 'userId' });

db.Favorite.belongsTo(db.Song, { foreignKey: 'songId' });
db.Song.hasMany(db.Favorite, { foreignKey: 'songId' });

db.User.hasMany(db.SearchHistory, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.SearchHistory.belongsTo(db.User, { foreignKey: 'userId' });

module.exports = db;
