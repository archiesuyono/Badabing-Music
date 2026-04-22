module.exports = (sequelize, DataTypes) => {
  const Song = sequelize.define('Song', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    spotifyId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    spotifyUri: {
      type: DataTypes.STRING,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    artists: {
      type: DataTypes.JSON,
      allowNull: false
    },
    album: {
      type: DataTypes.STRING,
      allowNull: true
    },
    imageUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    previewUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    externalUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    mood: {
      type: DataTypes.STRING,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'songs',
    timestamps: true
  });

  return Song;
};
