module.exports = function mongooseTimeoutPlugin(schema) {
  // Add timeout to find operations
  schema.pre(/^find/, function (next) {
    this.maxTimeMS(5000); // 5 second timeout
    next();
  });

  // Add timeout to update operations
  schema.pre(/^update/, function (next) {
    this.maxTimeMS(5000);
    next();
  });
};
