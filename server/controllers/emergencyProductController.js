/**
 * Emergency Product Controller
 * Handles emergency product updates when normal routes fail
 */

const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");

/**
 * Update a product (emergency endpoint)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with updated product
 */
exports.updateProduct = async (req, res) => {
  try {
    console.log("Emergency product update endpoint called");
    console.log("Request body:", req.body);

    const { id } = req.params;
    console.log("Product ID:", id);

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid product ID:", id);
      return res.status(200).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Try to find the product using Mongoose
    let product;
    try {
      product = await Product.findById(id);
    } catch (findError) {
      console.error("Error finding product with Mongoose:", findError);

      // Try direct MongoDB access
      try {
        const db = mongoose.connection.db;
        const productsCollection = db.collection("products");

        // Convert string ID to ObjectId
        const objectId = new mongoose.Types.ObjectId(id);

        // Find the product
        product = await productsCollection.findOne({ _id: objectId });

        if (product) {
          console.log("Found product via direct MongoDB access:", product.name);
        } else {
          console.log("Product not found via direct MongoDB access");
          return res.status(200).json({
            success: false,
            message: "Product not found",
          });
        }
      } catch (directError) {
        console.error("Error with direct MongoDB access:", directError);
        return res.status(200).json({
          success: false,
          message: "Error finding product",
          error: directError.message,
        });
      }
    }

    if (!product) {
      console.log("Product not found:", id);
      return res.status(200).json({
        success: false,
        message: "Product not found",
      });
    }

    console.log("Found product:", product.name);

    // Prepare update data
    const updateData = {};

    // Update basic product fields
    const {
      name,
      description,
      price,
      stock,
      category,
      featured,
      discountPrice,
    } = req.body;

    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (stock) updateData.stock = parseInt(stock);
    if (featured) updateData.featured = featured === "true";
    if (discountPrice) updateData.discountPrice = parseFloat(discountPrice);

    // Update category if provided
    if (category) {
      // Validate category ID
      if (!mongoose.Types.ObjectId.isValid(category)) {
        console.log("Invalid category ID:", category);
        // Don't return error, just log it and continue
        console.log("Skipping category update due to invalid ID");
      } else {
        updateData.category = category;
      }
    }

    // Handle existing images
    if (req.body.existingImages) {
      try {
        let existingImages;

        if (typeof req.body.existingImages === "string") {
          try {
            existingImages = JSON.parse(req.body.existingImages);
          } catch (parseError) {
            // Try to handle as comma-separated string
            existingImages = req.body.existingImages
              .split(",")
              .map((path) => path.trim());
          }
        } else if (Array.isArray(req.body.existingImages)) {
          existingImages = req.body.existingImages;
        }

        console.log("Existing images:", existingImages);

        // Update product images
        if (existingImages && existingImages.length > 0) {
          updateData.images = existingImages;
        }
      } catch (parseError) {
        console.error("Error handling existing images:", parseError);
        // Don't return error, just log it and continue
        console.log("Skipping image update due to parsing error");
      }
    }

    // Try to update the product using direct MongoDB access
    try {
      const db = mongoose.connection.db;
      const productsCollection = db.collection("products");

      // Convert string ID to ObjectId
      const objectId = new mongoose.Types.ObjectId(id);

      // Update the product
      const updateResult = await productsCollection.updateOne(
        { _id: objectId },
        { $set: updateData }
      );

      console.log("Update result:", updateResult);

      if (updateResult.modifiedCount > 0) {
        console.log("Product updated successfully via direct MongoDB access");

        // Get the updated product
        const updatedProduct = await productsCollection.findOne({
          _id: objectId,
        });

        // Return success response
        return res.status(200).json({
          success: true,
          message: "Product updated successfully via direct MongoDB access",
          data: updatedProduct,
        });
      } else {
        console.log("No changes made to product");

        // Get the current product
        const currentProduct = await productsCollection.findOne({
          _id: objectId,
        });

        // Return success response
        return res.status(200).json({
          success: true,
          message: "No changes made to product",
          data: currentProduct,
        });
      }
    } catch (directError) {
      console.error("Error with direct MongoDB update:", directError);

      // Try Mongoose update as fallback
      try {
        // Update the product using Mongoose
        if (updateData.name) product.name = updateData.name;
        if (updateData.description)
          product.description = updateData.description;
        if (updateData.price) product.price = updateData.price;
        if (updateData.stock) product.stock = updateData.stock;
        if (updateData.featured !== undefined)
          product.featured = updateData.featured;
        if (updateData.discountPrice)
          product.discountPrice = updateData.discountPrice;
        if (updateData.category) product.category = updateData.category;
        if (updateData.images) product.images = updateData.images;

        // Save the updated product
        await product.save();

        console.log("Product updated successfully via Mongoose");

        // Return success response
        return res.status(200).json({
          success: true,
          message: "Product updated successfully via Mongoose",
          data: product,
        });
      } catch (mongooseError) {
        console.error("Error updating product with Mongoose:", mongooseError);

        // Return error response
        return res.status(200).json({
          success: false,
          message: "Error updating product",
          error: mongooseError.message,
        });
      }
    }
  } catch (error) {
    console.error("Error in emergency product update:", error);

    // Return a 200 response with error info to avoid client errors
    return res.status(200).json({
      success: false,
      message:
        "Error updating product, but returning 200 to avoid client errors",
      error: error.message,
    });
  }
};
