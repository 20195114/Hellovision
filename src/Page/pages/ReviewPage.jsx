import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import '../CSS/ReviewPage.css';

// Helper function to get data from session storage
const getSessionStorageData = (key, defaultValue) => {
  const value = sessionStorage.getItem(key);
  try {
    return value ? JSON.parse(value) : defaultValue;
  } catch (error) {
    console.error(`Error parsing session storage data for ${key}:`, error);
    return defaultValue;
  }
};

// Helper function to set data in session storage
const setSessionStorageData = (key, data) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error setting session storage data for ${key}:`, error);
  }
};

const ReviewPage = () => {
  const [reviewData, setReviewData] = useState(getSessionStorageData('reviewData', []));
  const [editReview, setEditReview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const userId = sessionStorage.getItem('selectedUserId'); // Get user ID from session storage

  // Fetch user reviews
  useEffect(() => {
    const fetchUserReviews = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_EC2_ADDRESS}/review/${userId}`);
        setReviewData(response.data);
        setSessionStorageData('reviewData', response.data); // Save data to session storage
      } catch (error) {
        console.error('Error fetching user reviews:', error);
      }
    };

    if (userId) {
      fetchUserReviews();
    }
  }, [userId]);

  // Handle star rating click for review editing
  const handleEditStarClick = (rating) => {
    setEditReview((prev) => ({ ...prev, RATING: rating }));
  };

  // Open modal for editing review
  const openModal = (review) => {
    setEditReview(review);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setEditReview(null);
    setIsModalOpen(false);
  };

  // Update review
  const updateReview = async (e) => {
    e.preventDefault();
    if (!editReview) return;

    const updatedReview = {
      VOD_ID: editReview.VOD_ID,
      RATING: editReview.RATING.toString(), // Ensure RATING is a string
      COMMENT: editReview.COMMENT,
    };

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_CUD_ADDRESS}/review/${editReview.REVIEW_ID}`, // Use REVIEW_ID for update
        updatedReview
      );

      if (response.data.response === 'FINISH UPDATE REVIEW') {
        const updatedResponse = await axios.get(`${process.env.REACT_APP_EC2_ADDRESS}/review/${userId}`);
        setReviewData(updatedResponse.data);
        setSessionStorageData('reviewData', updatedResponse.data); // Update session storage
        closeModal();
      }
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  // Delete review
  const deleteReview = async (reviewId) => {
    try {
      const response = await axios.delete(`${process.env.REACT_APP_CUD_ADDRESS}/review/${reviewId}`); // Use REVIEW_ID for delete
      if (response.data.response === 'FINISH DELETE REVIEW') {
        const updatedResponse = await axios.get(`${process.env.REACT_APP_EC2_ADDRESS}/review/${userId}`);
        setReviewData(updatedResponse.data);
        setSessionStorageData('reviewData', updatedResponse.data); // Update session storage
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  return (
    <div className="reviews-container">
      <h3>내가 쓴 리뷰</h3>
      <ul>
        {reviewData.map((review) => (
          <li key={review.REVIEW_ID} className="review-item">
            <img src={review.POSTER} alt={review.TITLE} className="review-poster" />
            <div className="review-content">
              <p><strong>제목:</strong> {review.TITLE}</p>
              <p><strong>리뷰:</strong> {review.COMMENT}</p>
              <p><strong>별점:</strong> {Array(review.RATING).fill('★').join(' ')}</p>
              <div className="review-actions">
                <button onClick={() => openModal(review)}>수정</button>
                <button onClick={() => deleteReview(review.REVIEW_ID)}>삭제</button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="리뷰 수정"
        className="review-modal"
        overlayClassName="review-modal-overlay"
      >
        <h2>리뷰 수정</h2>
        {editReview && (
          <form onSubmit={updateReview}>
            <div className="review-modal-content">
              <img src={editReview.POSTER} alt={editReview.TITLE} className="modal-review-poster" />
              <div className="modal-review-info">
                <label>리뷰: </label>
                <input
                  type="text"
                  name="COMMENT"
                  value={editReview.COMMENT}
                  onChange={(e) => setEditReview({ ...editReview, COMMENT: e.target.value })}
                />
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${editReview.RATING >= star ? 'filled' : ''}`}
                      onClick={() => handleEditStarClick(star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <button type="submit">저장</button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ReviewPage;
