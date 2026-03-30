const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  planId: { type: String, required: true },
  message: { type: String, required: true },
  summaryHash: { type: String },
  timestamp: { type: Date, default: Date.now },
  seen: { type: Boolean, default: false }
});

module.exports = mongoose.model('Notification', notificationSchema);
