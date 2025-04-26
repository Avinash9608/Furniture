const mongoose = require('mongoose');

const ShippingAddressSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Please add a name'],
    trim: true
  },
  address: { 
    type: String, 
    required: [true, 'Please add an address'],
    trim: true
  },
  city: { 
    type: String, 
    required: [true, 'Please add a city'],
    trim: true
  },
  state: { 
    type: String, 
    required: [true, 'Please add a state'],
    trim: true
  },
  postalCode: { 
    type: String, 
    required: [true, 'Please add a postal code'],
    trim: true
  },
  country: { 
    type: String, 
    required: [true, 'Please add a country'],
    default: 'India',
    trim: true
  },
  phone: { 
    type: String, 
    required: [true, 'Please add a phone number'],
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
ShippingAddressSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ShippingAddress', ShippingAddressSchema);
