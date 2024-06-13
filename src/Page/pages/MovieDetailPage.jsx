import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaRegPlayCircle, FaRegHeart, FaHeart, FaRegStar } from 'react-icons/fa'; // FaRegStar 추가
import Modal from 'react-modal';
import YouTube from 'react-youtube';
import Header from '../Component/Header';
import '../CSS/MovieDetailPage.css';

// Modal App element 설정
Modal.setAppElement('#root');

const MovieDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const vodId = location.state?.vod_id;
  const userId = localStorage.getItem('selectedUserId');

  const [movie, setMovie] = useState(null);
  const [castData, setCastData] = useState([]);
  const [recommendList, setRecommendList] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isInPlaylist, setIsInPlaylist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);

  const [seasonList, setSeasonList] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);
  const [selectedSeasonName, setSelectedSeasonName] = useState('');
  const [episodeList, setEpisodeList] = useState([]);
  // const [isKidsContent, setIsKidsContent] = useState(false); // 사용되지 않는 변수 제거

  const fetchMovieData = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_EC2_ADDRESS}/detailpage/vod_detail/${vodId}/${userId}`);
      const movieData = response.data;

      setMovie({
        id: movieData.MOVIE_ID || movieData.SERIES_ID || movieData.K_SERIES_ID,
        title: movieData.TITLE,
        genres: movieData.GENRE,
        summary: movieData.MOVIE_OVERVIEW || movieData.SERIES_OVERVIEW,
        posterURL: movieData.POSTER,
        trailerURL: movieData.TRAILER,
        releaseDate: movieData.RELEASE_DATE,
        duration: movieData.RTM,
        rating: movieData.MOVIE_RATING || movieData.SERIES_RATING,
      });

      setCastData(movieData.ACTOR || (movieData.CAST || '').split(',').map(name => ({ ACTOR_NAME: name })));
      setRecommendList(movieData.recommend_list || []);
      setIsInPlaylist(movieData.like_status); // "찜" 상태 설정
      setReviews(movieData.review || []);

      if (movieData.SERIES_ID || movieData.K_SERIES_ID) {
        const seriesId = movieData.SERIES_ID || movieData.K_SERIES_ID;
        await fetchSeasonList(seriesId, !!movieData.K_SERIES_ID);
      }
    } catch (error) {
      console.error('영화 데이터를 가져오는 중 오류 발생:', error);
      alert('영화 데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  }, [vodId, userId]);

  const fetchSeasonList = useCallback(async (seriesId, isKids) => {
    try {
      const endpoint = isKids
        ? `${process.env.REACT_APP_EC2_ADDRESS}/detailpage/kids_season_detail/${seriesId}`
        : `${process.env.REACT_APP_EC2_ADDRESS}/detailpage/season_detail/${seriesId}`;
      const response = await axios.get(endpoint);
      const seasonData = response.data;
      setSeasonList(seasonData);

      if (seasonData.length > 0) {
        const firstSeasonId = seasonData[0].SEASON_ID;
        const firstSeasonNum = seasonData[0].SEASON_NUM;
        setSelectedSeasonName(`시즌 ${firstSeasonNum}`);
        setSelectedSeasonId(firstSeasonId);
        await fetchEpisodeList(firstSeasonId, isKids);
      }
    } catch (error) {
      console.error('시즌 데이터를 가져오는 중 오류 발생:', error);
      alert('시즌 데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }, []); // fetchSeasonList를 useCallback으로 설정

  const fetchEpisodeList = async (seasonId, isKids) => {
    try {
      setSelectedSeasonId(seasonId);
      const endpoint = isKids
        ? `${process.env.REACT_APP_EC2_ADDRESS}/detailpage/kids_season_detail/kids_episode_detail/${seasonId}`
        : `${process.env.REACT_APP_EC2_ADDRESS}/detailpage/season_detail/episode_detail/${seasonId}`;
      const response = await axios.get(endpoint);
      setEpisodeList(response.data);
    } catch (error) {
      console.error('에피소드 데이터를 가져오는 중 오류 발생:', error);
      alert('에피소드 데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  useEffect(() => {
    if (vodId) {
      fetchMovieData();
    }
  }, [vodId, fetchMovieData]);

  const togglePlaylist = async () => {
    try {
      const payload = { VOD_ID: vodId };

      let response;
      if (isInPlaylist) {
        response = await axios.delete(
          `${process.env.REACT_APP_CUD_ADDRESS}/like/${userId}`,
          { data: payload }
        );
      } else {
        response = await axios.post(
          `${process.env.REACT_APP_CUD_ADDRESS}/like/${userId}`,
          payload
        );
      }

      if (response.status === 200) {
        setIsInPlaylist(!isInPlaylist);
      } else {
        throw new Error('플레이리스트 상태를 업데이트하는 중 오류 발생');
      }
    } catch (error) {
      console.error('플레이리스트 상태를 업데이트하는 중 오류 발생:', error);
      alert('플레이리스트 상태를 업데이트하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  const getYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|.*v=|.*\/)([\w-]{11}))/);
    return match ? match[1] : null;
  };

  const handleMovieClick = (movieId) => {
    navigate('/MovieDetailPage', { state: { vod_id: movieId } });
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleReviewSave = async () => {
    if (reviewText.trim() === '' || reviewRating === 0) {
      alert('리뷰와 별점을 입력해 주세요.');
      return;
    }

    try {
      const reviewPayload = {
        VOD_ID: vodId,
        RATING: reviewRating.toString(),
        COMMENT: reviewText,
      };

      const response = await axios.post(`${process.env.REACT_APP_CUD_ADDRESS}/review/${userId}`, reviewPayload);
      if (response.status === 200 && response.data.response === "FINISH INSERT REVIEW") {
        const updatedResponse = await axios.get(`${process.env.REACT_APP_EC2_ADDRESS}/detailpage/vod_detail/${vodId}/${userId}`);
        const updatedMovieData = updatedResponse.data;
        setReviews(updatedMovieData.review || []);
        closeModal();
      } else {
        alert('리뷰 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('리뷰 저장 중 오류 발생:', error);
      alert('리뷰 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  if (loading) return <div>로딩 중...</div>;
  if (!movie) return <div>영화를 찾을 수 없습니다.</div>;

  const videoId = getYouTubeId(movie.trailerURL);

  return (
    <div className="movie-detail-page">
      <Header goToMainPage={() => navigate('/Main')} />
      <div className="movie-detail-container">
        <div className="movie-header">
          <img src={movie.posterURL} alt={movie.title} className="movie-poster" loading="lazy" />
          <div className="movie-info">
            <h1>{movie.title}
              <FaRegPlayCircle className="play-button" onClick={openModal} />
            </h1>
            <p>개봉일: {movie.releaseDate}</p>
            <p>장르: {movie.genres}</p>
            <p>러닝타임: {movie.duration}분</p>
            <p>관람등급: {movie.rating}</p>
            <p>{movie.summary}</p>
            <button onClick={togglePlaylist} className="playlist-button">
              {isInPlaylist ? <FaHeart className="heart-icon" /> : <FaRegHeart className="heart-icon" />}
            </button>
          </div>
        </div>

        <div className="movie-sections">
          <TrailerSection videoId={videoId} />
          <CastSection castData={castData} />
          <ReviewSection reviews={reviews} />
          <RelatedMoviesSection recommendList={recommendList} onMovieClick={handleMovieClick} />
          {seasonList.length > 0 && <SeasonContainer seasonList={seasonList} selectedSeasonId={selectedSeasonId} selectedSeasonName={selectedSeasonName} setSelectedSeasonName={setSelectedSeasonName} onSeasonClick={fetchEpisodeList} episodeList={episodeList} />}
        </div>
      </div>

      <ReviewModal
        isOpen={isModalOpen}
        onClose={closeModal}
        movie={movie}
        reviewText={reviewText}
        setReviewText={setReviewText}
        reviewRating={reviewRating}
        setReviewRating={setReviewRating}
        onSave={handleReviewSave}
      />
    </div>
  );
};

const TrailerSection = ({ videoId }) => (
  <div className="trailer-section">
    <h3>예고편</h3>
    {videoId ? (
      <YouTube videoId={videoId} opts={{ width: '100%', height: '390px' }} />
    ) : (
      <p>예고편을 불러올 수 없습니다.</p>
    )}
  </div>
);

const CastSection = ({ castData }) => (
  <div className="cast-section">
    <h3>출연진</h3>
    <ul className="cast-list">
      {castData.map((actor, index) => (
        <li key={index} className="cast-item">
          {actor.PROFILE && <img src={actor.PROFILE} alt={actor.ACTOR_NAME} className="cast-img" loading="lazy" />}
          <p>{actor.ACTOR_NAME}</p>
        </li>
      ))}
    </ul>
  </div>
);

const ReviewSection = ({ reviews }) => (
  <div className="review-section">
    <h3>리뷰</h3>
    <ul className="review-list">
      {reviews.map((review, index) => (
        <li key={index} className="review-item">
          <p><strong>이름:</strong> {review.USER_NAME}</p>
          <p><strong>리뷰:</strong> {review.COMMENT}</p>
          <p><strong>별점:</strong> {Array(review.RATING).fill('★').join(' ')}</p>
          <p className="review-date">({review.REVIEW_WDATE})</p>
        </li>
      ))}
    </ul>
  </div>
);

const RelatedMoviesSection = ({ recommendList, onMovieClick }) => {
  const getRandomMovies = (movies, count) => {
    const shuffled = [...movies].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const randomRecommendList = getRandomMovies(recommendList, 8);

  return (
    <div className="related-movies-section">
      <h3>추천 영화</h3>
      <ul className="related-movies-list">
        {randomRecommendList.map((relatedMovie, index) => (
          <li key={index} className="related-movie-item" onClick={() => onMovieClick(relatedMovie.VOD_ID)}>
            <img src={relatedMovie.POSTER} alt={relatedMovie.TITLE} loading="lazy" />
            <p>{relatedMovie.TITLE}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

const SeasonContainer = ({ seasonList, selectedSeasonId, selectedSeasonName, setSelectedSeasonName, onSeasonClick, episodeList }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSeasonSelect = async (seasonId, seasonName, seasonNum) => {
    setIsDropdownOpen(false);
    setSelectedSeasonName(`시즌 ${seasonNum}`);
    await onSeasonClick(seasonId);
  };

  return (
    <div className="season-container">
      <h3>시즌</h3>
      <div className="season-dropdown">
        <button className="season-dropdown-button" onClick={handleDropdownToggle}>
          {selectedSeasonName || (seasonList.length > 0 ? `시즌 ${seasonList[0].SEASON_NUM}` : '시즌 선택')} <span className="dropdown-arrow">{isDropdownOpen ? '▲' : '▼'}</span>
        </button>
        {isDropdownOpen && (
          <ul className="season-list">
            {seasonList.map((season) => (
              <li
                key={season.SEASON_ID}
                className={`season-item ${season.SEASON_ID === selectedSeasonId ? 'selected' : ''}`}
                onClick={() => handleSeasonSelect(season.SEASON_ID, season.SEASON_NAME, season.SEASON_NUM)}
              >
                {`시즌 ${season.SEASON_NUM} (${season.EPISODE_COUNT || '0'} 에피소드)`}
              </li>
            ))}
          </ul>
        )}
      </div>
      {selectedSeasonId && (
        <div className="episode-container">
          <h4>에피소드</h4>
          <ul className="episode-list">
            {episodeList.map((episode) => (
              <li key={episode.EPISODE_ID} className="episode-item">
                <img src={episode.EPISODE_STILL} alt={episode.EPISODE_NAME} className="episode-thumbnail" loading="lazy" />
                <div className="episode-info">
                  <h5>{episode.EPISODE_NAME}</h5>
                  <p>{episode.EPISODE_OVERVIEW || '설명이 없습니다.'}</p>
                  <p>방영일: {episode.EPISODE_AIR_DATE}</p>
                  <p>러닝타임: {episode.EPISODE_RTM}분</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const ReviewModal = ({ isOpen, onClose, movie, reviewText, setReviewText, reviewRating, setReviewRating, onSave }) => (
  <Modal isOpen={isOpen} onRequestClose={onClose} className="modal" overlayClassName="modal-overlay" style={{ overlay: { top: '100px' } }}> {/* 모달 위치 수정 */}
    <div className="modal-content">
      <img src={movie.posterURL} alt={movie.title} className="modal-poster" loading="lazy" />
      <textarea
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        placeholder="리뷰를 작성해 주세요..."
        className="modal-textarea"
      />
      <div className="modal-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaRegStar
            key={star}
            className={`modal-star ${star <= reviewRating ? 'selected' : ''}`}
            onClick={() => setReviewRating(star)}
          />
        ))}
      </div>
      <div className="modal-buttons">
        <button onClick={onClose} className="modal-button cancel">나중에</button>
        <button onClick={onSave} className="modal-button save">저장</button>
      </div>
    </div>
  </Modal>
);

export default MovieDetailPage;
