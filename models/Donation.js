const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['human_welfare', 'animal_welfare', 'home_support', 'environment'],
      required: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    pickupAddress: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'collected', 'distributed', 'cancelled'],
      default: 'pending',
    },
    scheduledDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Donation', donationSchema);
