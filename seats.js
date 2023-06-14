const express = require('express');
const router = express.Router();
const { Seat, Booking } = require('./models');

// GET /seats
router.get('/', async (req, res) => {
  try {
    const seats = await Seat.findAll();
    res.json(seats);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /seats/:id
router.get('/:id', async (req, res) => {
  try {
    const seatId = req.params.id;
    const seat = await Seat.findByPk(seatId);
    if (!seat) {
      return res.status(404).json({ error: 'Seat not found' });
    }

    const bookingCount = await Booking.count({ where: { seatId } });
    const occupancyPercentage = (bookingCount / seat.capacity) * 100;
    let price = '';

    if (occupancyPercentage < 40) {
      price = seat.minPrice || seat.normalPrice;
    } else if (occupancyPercentage >= 40 && occupancyPercentage <= 60) {
      price = seat.normalPrice || seat.maxPrice;
    } else {
      price = seat.maxPrice || seat.normalPrice;
    }

    res.json({ seat, price });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /booking
router.post('/booking', async (req, res) => {
  try {
    const { seatIds, userName, phoneNumber } = req.body;

    // Check if the seats are available
    const bookedSeats = await Booking.findAll({
      where: { seatId: seatIds },
    });

    const bookedSeatIds = bookedSeats.map((booking) => booking.seatId);
    const unavailableSeats = seatIds.filter((seatId) =>
      bookedSeatIds.includes(seatId)
    );

    if (unavailableSeats.length > 0) {
      return res.status(400).json({
        error: `Seats ${unavailableSeats.join(', ')} are already booked`,
      });
    }

    // Create the bookings
    const bookings = await Booking.bulkCreate(
      seatIds.map((seatId) => ({
        seatId,
        userName,
        phoneNumber,
      }))
    );

    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /bookings
router.get('/bookings', async (req, res) => {
  try {
    const { userIdentifier } = req.query;

    if (!userIdentifier) {
      return res.status(400).json({ error: 'User identifier is required' });
    }

    const bookings = await Booking.findAll({
      where: Sequelize.or(
        { userName: userIdentifier },
        { phoneNumber: userIdentifier }
      ),
    });

    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
