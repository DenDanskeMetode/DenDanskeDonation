const Stripe = jest.fn().mockImplementation(() => ({
  paymentIntents: { create: jest.fn() },
}));

module.exports = Stripe;
module.exports.default = Stripe;
