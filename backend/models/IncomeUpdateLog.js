const mongoose = require('mongoose');

const incomeUpdateLogSchema = new mongoose.Schema({
  contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true },
  landlordId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  houseId: { type: mongoose.Schema.Types.ObjectId, ref: 'House', required: true },
  month: { type: String, required: true },
  oldAmount: { type: Number, required: true },
  newAmount: { type: Number, required: true },
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

incomeUpdateLogSchema.index({ contractId: 1, month: 1 });
incomeUpdateLogSchema.index({ landlordId: 1, createdAt: -1 });
incomeUpdateLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('IncomeUpdateLog', incomeUpdateLogSchema);
