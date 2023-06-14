const express = require('express');
const Sequelize = require('sequelize');

const app = express();
const port = 3000;

// MySQL database configuration
const sequelize = new Sequelize('bookingservice', 'krithi_keremane', 'NodeJs', {
  host: 'localhost',
  dialect: 'mysql',
});

// Define the Seat model
const Seat = sequelize.define('Seat', {
  seatNumber: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  seatClass: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  isBooked: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  minPrice: {
    type: Sequelize.FLOAT,
    allowNull: true,
  },
  maxPrice: {
    type: Sequelize.FLOAT,
    allowNull: true,
  },
  normalPrice: {
    type: Sequelize.FLOAT,
    allowNull: true,
  },
});

// Define the Booking model
const Booking = sequelize.define('Booking', {
  bookingId: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  seatId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  phoneNumber: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  totalPrice: {
    type: Sequelize.FLOAT,
    allowNull: false,
  },
});

// Associate Seat and Booking models
Seat.hasMany(Booking, { foreignKey: 'seatId' });
Booking.belongsTo(Seat, { foreignKey: 'seatId' });

// GET /seats
app.get('/seats', async (req, res) => {
  try {
    // Fetch all seats from the database
    const seats = await Seat.findAll();

    // Return the seats as a response
    res.json(seats);
  } catch (error) {
    console.error('Error retrieving seats:', error);
    res.status(500).json({ error: 'An error occurred while retrieving seats' });
  }
});

// GET /seats/:id
app.get('/seats/:id', async (req, res) => {
  const seatId = req.params.id;

  try {
    // Fetch the seat by ID from the database
    const seat = await Seat.findByPk(seatId);

    if (!seat) {
      return res.status(404).json({ error: 'Seat not found' });
    }

    // Determine the pricing based on occupancy percentage
    const occupancyPercentage = await calculateOccupancyPercentage(seat.seatClass);
    const pricing = determinePricing(occupancyPercentage, seat);

    // Return the seat details and pricing as a response
    res.json({ seat, pricing });
  } catch (error) {
    console.error('Error retrieving seat details:', error);
    res.status(500).json({ error: 'An error occurred while retrieving seat details' });
  }
});

// POST /booking
app.post('/booking', async (req, res) => {
  const { seatIds, name, phoneNumber } = req.body;

  try {
    // Fetch the selected seats from the database
    const seats = await Seat.findAll({ where: { id: seatIds } });

    // Check if any of the selected seats are already booked
    const bookedSeats = seats.filter((seat) => seat.isBooked);
    if (bookedSeats.length > 0) {
      return res.status(400).json({ error: 'Some of the selected seats are already booked' });
    }

    let totalPrice = 0;

    // Calculate the pricing and total amount for the booking
    for (const seat of seats) {
      const occupancyPercentage = await calculateOccupancyPercentage(seat.seatClass);
      const pricing = determinePricing(occupancyPercentage, seat);
      totalPrice += pricing;
    }

    // Create the booking in the database
    const booking = await Booking.create({
      seatId: seatIds,
      name,
      phoneNumber,
      totalPrice,
    });

    // Update the seat status to booked
    await Seat.update({ isBooked: true }, { where: { id: seatIds } });

    // Return the booking ID and total amount as a response
    res.json({ bookingId: booking.bookingId, totalAmount: booking.totalPrice });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'An error occurred while creating the booking' });
  }
});

// GET /bookings
app.get('/bookings', async (req, res) => {
  const userIdentifier = req.query.userIdentifier;

  if (!userIdentifier) {
    return res.status(400).json({ error: 'User identifier (email or phone number) is required' });
  }

  try {
    // Fetch bookings for the specified user identifier from the database
    const bookings = await Booking.findAll({
      where: {
        [Sequelize.Op.or]: [
          { phoneNumber: userIdentifier },
          { email: userIdentifier },
        ],
      },
    });

    // Return the bookings as a response
    res.json(bookings);
  } catch (error) {
    console.error('Error retrieving bookings:', error);
    res.status(500).json({ error: 'An error occurred while retrieving bookings' });
  }
});

// Calculate the occupancy percentage for a given seat class
async function calculateOccupancyPercentage(seatClass) {
  try {
    const totalSeats = await Seat.count({ where: { seatClass } });
    const bookedSeats = await Seat.count({ where: { seatClass, isBooked: true } });
    const occupancyPercentage = (bookedSeats / totalSeats) * 100;
    return occupancyPercentage;
  } catch (error) {
    console.error('Error calculating occupancy percentage:', error);
    throw error;
  }
}

// Determine the pricing based on occupancy percentage and seat details
function determinePricing(occupancyPercentage, seat) {
  const { minPrice, maxPrice, normalPrice } = seat;
  let pricing;

  if (occupancyPercentage < 40) {
    pricing = minPrice || normalPrice;
  } else if (occupancyPercentage >= 40 && occupancyPercentage < 60) {
    pricing = normalPrice || maxPrice;
  } else {
    pricing = maxPrice || normalPrice;
  }

  return pricing;
}

// Sync the database models and start the server
sequelize
  .sync()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Error syncing database:', error);
  });
