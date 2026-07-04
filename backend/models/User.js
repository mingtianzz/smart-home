const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, unique: true, sparse: true, trim: true },
  email: { type: String, unique: true, sparse: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['tenant', 'landlord', 'admin'], required: true },
  status: { type: String, enum: ['active', 'disabled'], default: 'active' },
  avatar: { type: String, default: '' },
  gender: { type: String, enum: ['male', 'female', 'other'], default: '' },
  birthday: { type: Date },
  idCard: { type: String, default: '' },
  address: { type: String, default: '' },
  bio: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
