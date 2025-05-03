/**
 * Mongoose plugin to set timeouts on all queries
 * This helps prevent the "Operation buffering timed out after 10000ms" error
 */

module.exports = function timeoutPlugin(schema, options = {}) {
  // Default timeout is 60 seconds (60000ms)
  const defaultTimeout = options.timeout || 60000;

  // Add maxTimeMS to all query methods
  const queryMethods = [
    "find",
    "findOne",
    "findById",
    "countDocuments",
    "count",
    "distinct",
  ];

  queryMethods.forEach((method) => {
    schema.pre(method, function () {
      this.maxTimeMS(defaultTimeout);
      this.lean(); // Use lean for better performance
    });
  });

  // Add timeout to aggregate
  schema.pre("aggregate", function () {
    this.options.maxTimeMS = defaultTimeout;
  });

  // Add timeout to save operations
  schema.pre("save", function (next) {
    // Set a timeout for the save operation
    this.$maxTimeMS = defaultTimeout;

    // Set write concern options for better performance
    this.$wc = {
      w: 1, // Write acknowledgment from primary only
      j: false, // Don't wait for journal commit
      wtimeout: defaultTimeout, // Write timeout
    };

    next();
  });

  // Add error handling to all queries
  schema.post(/^find/, function (error, doc, next) {
    if (error) {
      console.error(
        `Mongoose query error in ${schema.modelName}:`,
        error.message
      );
      // Pass the error to the next middleware
      return next(error);
    }
    next();
  });

  // Add error handling to save operations
  schema.post("save", function (error, doc, next) {
    if (error) {
      console.error(
        `Mongoose save error in ${schema.modelName}:`,
        error.message
      );

      // Check for timeout errors
      if (error.message && error.message.includes("buffering timed out")) {
        console.error(
          `Save operation timed out for ${schema.modelName}. Consider increasing the timeout.`
        );
      }

      // Pass the error to the next middleware
      return next(error);
    }
    next();
  });

  // Add a static method to get mock data
  schema.statics.getMockData = function () {
    console.log(`Returning mock data for ${schema.modelName}`);

    // Default mock data
    const defaultMock = [
      {
        _id: `mock-${schema.modelName.toLowerCase()}-1`,
        createdAt: new Date(),
      },
      {
        _id: `mock-${schema.modelName.toLowerCase()}-2`,
        createdAt: new Date(Date.now() - 86400000),
      },
    ];

    // Return model-specific mock data if available
    if (schema.statics.mockData) {
      return schema.statics.mockData;
    }

    return defaultMock;
  };
};
