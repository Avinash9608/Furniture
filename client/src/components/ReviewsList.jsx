import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

// Default avatar images for users
const avatarColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
];

const ReviewsList = ({ reviews = [] }) => {
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return (
      <div className="text-center py-8 theme-text-secondary">
        No reviews yet. Be the first to review this product!
      </div>
    );
  }

  // Sort reviews by date (newest first)
  const sortedReviews = [...reviews].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return dateB - dateA;
  });

  return (
    <div className="space-y-6 mt-8">
      <h3 className="text-lg font-medium mb-4">Customer Reviews</h3>
      
      {/* Reviews summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between">
          <div className="mb-2 md:mb-0">
            <div className="flex items-center">
              <div className="text-2xl font-bold mr-2">
                {reviews.length > 0
                  ? (
                      reviews.reduce((sum, review) => sum + (review.rating || 0), 0) /
                      reviews.length
                    ).toFixed(1)
                  : "0.0"}
              </div>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-5 h-5 ${
                      star <=
                      (reviews.reduce((sum, review) => sum + (review.rating || 0), 0) /
                        reviews.length)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                ))}
              </div>
              <div className="ml-2 text-sm theme-text-secondary">
                ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
              </div>
            </div>
          </div>
          
          <div className="flex flex-col">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = reviews.filter((r) => r.rating === rating).length;
              const percentage = (count / reviews.length) * 100 || 0;
              
              return (
                <div key={rating} className="flex items-center mb-1 text-sm">
                  <div className="w-8 text-right mr-2">{rating}</div>
                  <svg
                    className="w-4 h-4 text-yellow-400 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <div className="w-48 bg-gray-200 rounded-full h-2.5 mr-2">
                    <div
                      className="bg-yellow-400 h-2.5 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="w-8">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Individual reviews */}
      {sortedReviews.map((review, index) => {
        // Generate a consistent color for each user based on their name or ID
        const nameHash = review.name ? 
          review.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 
          index;
        const colorIndex = nameHash % avatarColors.length;
        const avatarColor = avatarColors[colorIndex];
        
        // Get initials for avatar
        const initials = review.name ? 
          review.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 
          '?';
        
        // Format date
        const dateStr = review.createdAt ? 
          formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }) : 
          'Recently';
        
        return (
          <motion.div
            key={review._id || `review-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="border theme-border rounded-lg p-4 mb-4"
          >
            <div className="flex items-start">
              {/* User avatar */}
              <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold mr-3 flex-shrink-0`}>
                {initials}
              </div>
              
              <div className="flex-1">
                {/* Review header */}
                <div className="flex flex-wrap items-center justify-between mb-2">
                  <div>
                    <div className="font-medium theme-text-primary">
                      {review.name || "Anonymous"}
                    </div>
                    <div className="text-xs theme-text-secondary mt-1">
                      {dateStr}
                    </div>
                  </div>
                  
                  <div className="flex mt-1 md:mt-0">
                    {[...Array(5)].map((_, starIndex) => (
                      <svg
                        key={starIndex}
                        className={`w-4 h-4 ${
                          starIndex < (review.rating || 0)
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    ))}
                  </div>
                </div>
                
                {/* Review content */}
                <div className="theme-text-primary mt-2 text-sm md:text-base">
                  {review.comment || "No comment provided"}
                </div>
                
                {/* If there's a review title, show it */}
                {review.title && (
                  <div className="font-medium theme-text-primary mt-1">
                    {review.title}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ReviewsList;
