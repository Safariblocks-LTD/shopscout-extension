/**
 * Database Configuration and Models
 * Using Sequelize ORM for clean, maintainable code
 * Supports both MySQL and PostgreSQL
 */

import { Sequelize, DataTypes } from 'sequelize';

// Determine database dialect and configuration
const DATABASE_URL = process.env.DATABASE_URL;
const dialect = process.env.DB_DIALECT || (DATABASE_URL ? 'postgres' : 'mysql');

let sequelize;

if (DATABASE_URL) {
  // Use DATABASE_URL (for Fly.io PostgreSQL)
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // Use individual credentials (for local MySQL)
  sequelize = new Sequelize(
    process.env.DB_NAME || 'shopscout',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || (dialect === 'postgres' ? 5432 : 3306),
      dialect: dialect,
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

/**
 * User Model - Synced with Firebase Auth
 */
const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING(128),
    primaryKey: true,
    comment: 'Firebase UID'
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  displayName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  photoURL: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  authMethod: {
    type: DataTypes.ENUM('email-password', 'magic-link', 'google', 'simple'),
    allowNull: false,
    defaultValue: 'simple'
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['createdAt'] }
  ]
});

/**
 * Wishlist Model
 */
const Wishlist = sequelize.define('Wishlist', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING(128),
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'External product ID if available'
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  image: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  source: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Amazon, Walmart, etc.'
  },
  savedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'wishlist',
  timestamps: false,
  indexes: [
    { fields: ['userId'] },
    { fields: ['savedAt'] }
  ]
});

/**
 * Price Tracking Model
 */
const PriceTracking = sequelize.define('PriceTracking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING(128),
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  productTitle: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  productUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  currentPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  targetPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Has user been notified of price drop'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'price_tracking',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['active'] },
    { fields: ['productId'] }
  ]
});

/**
 * Price History Model
 */
const PriceHistory = sequelize.define('PriceHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  productId: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  source: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  recordedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'price_history',
  timestamps: false,
  indexes: [
    { fields: ['productId'] },
    { fields: ['recordedAt'] }
  ]
});

/**
 * Search History Model
 */
const SearchHistory = sequelize.define('SearchHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING(128),
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  query: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  resultsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  searchedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'search_history',
  timestamps: false,
  indexes: [
    { fields: ['userId'] },
    { fields: ['searchedAt'] }
  ]
});

// Define relationships
User.hasMany(Wishlist, { foreignKey: 'userId', onDelete: 'CASCADE' });
Wishlist.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(PriceTracking, { foreignKey: 'userId', onDelete: 'CASCADE' });
PriceTracking.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(SearchHistory, { foreignKey: 'userId', onDelete: 'CASCADE' });
SearchHistory.belongsTo(User, { foreignKey: 'userId' });

/**
 * Initialize database and create tables
 */
async function initializeDatabase() {
  try {
    // Test connection
    await sequelize.authenticate();
    const dbType = dialect === 'postgres' ? 'PostgreSQL' : 'MySQL';
    console.log(`✅ ${dbType} connection established successfully`);

    // Sync models (create tables if they don't exist)
    await sequelize.sync({ alter: true }); // Use { force: true } to drop and recreate
    console.log('✅ Database tables synchronized');

    return true;
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    console.error('   Make sure database is running and credentials are correct');
    return false;
  }
}

/**
 * User operations
 */
const userOperations = {
  async createOrUpdate(userData) {
    const [user, created] = await User.upsert({
      id: userData.uid,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      emailVerified: userData.emailVerified,
      authMethod: userData.authMethod,
      lastLoginAt: new Date()
    });
    return { user, created };
  },

  async findById(userId) {
    return await User.findByPk(userId);
  },

  async updateLastLogin(userId) {
    await User.update(
      { lastLoginAt: new Date() },
      { where: { id: userId } }
    );
  }
};

export {
  sequelize,
  User,
  Wishlist,
  PriceTracking,
  PriceHistory,
  SearchHistory,
  initializeDatabase,
  userOperations
};
