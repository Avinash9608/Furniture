/**
 * Mongoose plugin to add timeout handling to all operations
 */
module.exports = function timeoutPlugin(schema, options = {}) {
  // Default timeout of 30 seconds
  const timeout = options.timeout || 30000;

  // Add timeout to save operations
  schema.pre("save", function (next) {
    const timeoutId = setTimeout(() => {
      next(new Error("Operation timed out"));
    }, timeout);

    // Clear timeout if operation completes
    this.$locals.timeoutId = timeoutId;
    next();
  });

  schema.post("save", function () {
    if (this.$locals.timeoutId) {
      clearTimeout(this.$locals.timeoutId);
    }
  });

  // Add timeout to all queries
  [
    "find",
    "findOne",
    "findOneAndUpdate",
    "findOneAndDelete",
    "update",
    "updateOne",
    "updateMany",
    "delete",
    "deleteOne",
    "deleteMany",
  ].forEach((method) => {
    schema.pre(method, function () {
      this.maxTimeMS(timeout);
    });
  });

  // Add timeout handling to all operations
  schema.pre(/.*/, function (next) {
    if (this.op) {
      try {
        // Initialize $locals if it doesn't exist
        if (!this.$locals) {
          this.$locals = {};
        }

        const timeoutId = setTimeout(() => {
          next(new Error(`Operation ${this.op} timed out after ${timeout}ms`));
        }, timeout);

        // Clear timeout if operation completes
        this.$locals.timeoutId = timeoutId;
      } catch (error) {
        console.warn(
          `Could not set timeout for operation ${this.op}: ${error.message}`
        );
        // Continue without setting timeout
      }
    }
    next();
  });

  schema.post(/.*/, function () {
    try {
      if (this.$locals && this.$locals.timeoutId) {
        clearTimeout(this.$locals.timeoutId);
      }
    } catch (error) {
      console.warn(`Could not clear timeout: ${error.message}`);
      // Continue without clearing timeout
    }
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
