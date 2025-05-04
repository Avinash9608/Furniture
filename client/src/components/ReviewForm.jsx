import React, { useState } from "react";
import Button from "./Button";
import Alert from "./Alert";

const ReviewForm = ({ productId, isAuthenticated, onReviewSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleRatingChange = (value) => {
    setRating(value);
  };

  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccess(null);

  // Save review to localStorage for immediate feedback
  const saveToLocalStorage = (reviewData) => {
    try {
      const localReview = {
        _id: `local-${Date.now()}`,
        name: localStorage.getItem("userName") || "You",
        rating: parseInt(reviewData.rating),
        comment: reviewData.comment,
        createdAt: new Date().toISOString(),
      };

      // Get existing reviews
      const storedReviews = JSON.parse(
        localStorage.getItem(`product-reviews-${productId}`) || "[]"
      );

      // Add new review
      storedReviews.push(localReview);

      // Save back to localStorage
      localStorage.setItem(
        `product-reviews-${productId}`,
        JSON.stringify(storedReviews)
      );

      return localReview;
    } catch (err) {
      console.error("Error saving to localStorage:", err);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!isAuthenticated) {
      setError("Please login to submit a review");
      return;
    }

    if (!comment.trim()) {
      setError("Please enter a comment");
      return;
    }

    // Start submission
    setIsSubmitting(true);
    setError(null);

    // Prepare review data
    const reviewData = {
      rating: parseInt(rating),
      comment: comment.trim(),
      userName: localStorage.getItem("userName") || "Anonymous User",
    };

    // Save to localStorage first for immediate feedback
    const localReview = saveToLocalStorage(reviewData);

    // Update UI immediately
    if (localReview && onReviewSubmitted) {
      onReviewSubmitted(localReview);
    }

    // Try to submit to server
    try {
      // Determine the correct API endpoint based on environment
      const baseUrl =
        window.location.hostname === "localhost" ? "http://localhost:5000" : "";

      const apiEndpoint = `${baseUrl}/api/products/${productId}/reviews`;

      console.log(`Submitting review to: ${apiEndpoint}`);

      // Submit the review to the server
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
        credentials: "include",
      });

      console.log(`Review submission response:`, response.status);

      let serverSuccess = false;
      let responseData = null;

      if (response.ok) {
        try {
          responseData = await response.json();
          console.log("Server response:", responseData);
          serverSuccess = true;
        } catch (jsonError) {
          console.error("Error parsing response:", jsonError);
        }
      } else {
        console.error("Server returned error status:", response.status);
        try {
          const errorData = await response.json();
          console.error("Error details:", errorData);
        } catch (jsonError) {
          console.error("Could not parse error response");
        }
      }

      // If server submission failed, try a fallback endpoint
      if (!serverSuccess) {
        try {
          console.log("Trying fallback endpoint");
          const fallbackEndpoint = `${baseUrl}/products/${productId}/reviews`;

          const fallbackResponse = await fetch(fallbackEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(reviewData),
            credentials: "include",
          });

          console.log(`Fallback response:`, fallbackResponse.status);

          if (fallbackResponse.ok) {
            try {
              const fallbackData = await fallbackResponse.json();
              console.log("Fallback server response:", fallbackData);
              serverSuccess = true;
              responseData = fallbackData;
            } catch (jsonError) {
              console.error("Error parsing fallback response:", jsonError);
            }
          }
        } catch (fallbackError) {
          console.error("Fallback request failed:", fallbackError);
        }
      }

      // If we got a successful response from the server, update the review with server data
      if (
        serverSuccess &&
        responseData &&
        responseData.data &&
        onReviewSubmitted
      ) {
        // Call onReviewSubmitted again with the server data to ensure it's properly saved
        onReviewSubmitted(responseData.data);
      }

      // Reset form regardless of server response
      setSuccess(
        serverSuccess
          ? "Review submitted successfully!"
          : "Review saved locally (will be visible immediately)"
      );
      setRating(5);
      setComment("");
    } catch (err) {
      console.log("Error submitting to server (but saved locally):", err);
      // Still show success since we saved to localStorage
      setSuccess("Review saved locally!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="theme-bg-secondary rounded-lg p-4 mb-6">
      <h3 className="text-lg font-medium mb-2">Write a Review</h3>

      {success && (
        <Alert type="success" message={success} onClose={clearSuccess} />
      )}

      {error && <Alert type="error" message={error} onClose={clearError} />}

      {!isAuthenticated ? (
        <div className="text-center py-4">
          <p className="theme-text-primary mb-2">
            Please login to write a review
          </p>
          <a href="/login" className="text-primary hover:underline font-medium">
            Login here
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block theme-text-primary font-medium mb-2">
              Rating
            </label>
            <div className="flex">
              {[5, 4, 3, 2, 1].map((star) => (
                <label key={star} className="mr-4 cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    value={star}
                    checked={parseInt(rating) === star}
                    onChange={() => handleRatingChange(star)}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <svg
                      className={`w-8 h-8 ${
                        parseInt(rating) >= star
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                    <span className="ml-1">{star}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="comment"
              className="block theme-text-primary font-medium mb-2"
            >
              Your Review
            </label>
            <textarea
              id="comment"
              name="comment"
              rows="4"
              value={comment}
              onChange={handleCommentChange}
              className="w-full border theme-border theme-bg-primary theme-text-primary rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Share your experience with this product..."
              required
            ></textarea>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      )}
    </div>
  );
};

export default ReviewForm;
