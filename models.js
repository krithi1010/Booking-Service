const { Sequelize, DataTypes } = require('sequelize');

// Initialize Sequelize with your MySQL database credentials
const sequelize = new Sequelize('bookingservice', 'krithi_keremane', 'NodeJs', {
  host: 'localhost',
  dialect: 'mysql',
});

// Define the Seat model
const Seat = sequelize.define('Seat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  seatClass: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  minPrice: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  maxPrice: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  normalPrice: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

// Define the Booking model
const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  seatId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Define the association between Seat and Booking
Seat.hasMany(Booking, { foreignKey: 'seatId' });
Booking.belongsTo(Seat, { foreignKey: 'seatId' });

module.exports = { Seat, Booking, sequelize };
