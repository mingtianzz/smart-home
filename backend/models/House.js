const mongoose = require('mongoose');

const houseSchema = new mongoose.Schema({
  landlordId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  landlordName: { type: String, required: true, trim: true },
  landlordPhone: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  area: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  rent: { type: Number, required: true, min: 0 },
  deposit: { type: Number, default: 0 },
  type: { type: String, required: true, trim: true },
  size: { type: Number, required: true, min: 0 },
  floor: { type: String, default: '' },
  facilities: [{ type: String }],
  description: { type: String, default: '' },
  images: [{ type: String }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'offline'],
    default: 'pending',
  },
  rejectReason: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

houseSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('House', houseSchema);
