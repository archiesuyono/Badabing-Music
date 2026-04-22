module.exports = (sequelize, DataTypes) => {
  const PlaylistSong = sequelize.define('PlaylistSong', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    playlistId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'playlists',
        key: 'id'
      }
    },
    songId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'songs',
        key: 'id'
      }
    },
    addedAt: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'playlist_songs',
    timestamps: false
  });

  return PlaylistSong;
};
