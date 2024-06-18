import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Component/Header';
import MyWatchedVods from '../Component/MyWatchedVods';
import YouTubeTrends from '../Component/YouTubeTrends';
import PopularVods from '../Component/PopularVods';
import RatingBasedVods from '../Component/RatingBasedVods';
import Spotify from '../Component/Spotify';
import '../CSS/Main.css';
import axios from 'axios';

const Main = () => {
  const [state, setState] = useState({
    myWatchedVods: [],
    youtubeTrendsVods: [],
    popularVods: [],
    searchBasedVods: [],
    ratingBasedVods: [],
    spotifyVods: [],
    isSpotifyLinked: false,
    user_name: 'User Name'
  });

  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [playlistVisible, setPlaylistVisible] = useState(false);
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState({
    myWatchedVods: false,
    youtubeTrendsVods: false,
    popularVods: false,
    searchBasedVods: false,
    ratingBasedVods: false,
    spotifyVods: false,
  });

  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async (url, key, user_id = null) => {
    setLoading(prevState => ({ ...prevState, [key]: true }));
    try {
      const response = await axios.get(`${process.env.REACT_APP_EC2_ADDRESS}${url}${user_id ? `/${user_id}` : ''}`);
      
      if (key === 'spotifyVods') {
        if (response.data.status === false) {
          const spotifyAuthResponse = await axios.post(`${process.env.REACT_APP_EC2_ADDRESS}/mainpage/spotify/${user_id}`);
          const spotifyAuthUrl = spotifyAuthResponse.data.response;
          const newWindow = window.open(spotifyAuthUrl, '_blank', 'width=500,height=600');

          const interval = setInterval(() => {
            if (newWindow.closed) {
              clearInterval(interval);
              fetchData('/mainpage/vodlist/spotify', 'spotifyVods', user_id);
            }
          }, 1000);
        } else {
          setState(prevState => ({ ...prevState, [key]: response.data.vods }));
        }
      } else {
        setState(prevState => ({ ...prevState, [key]: response.data }));
      }
    } catch (error) {
      console.error(`Error fetching ${key}:`, error);
    } finally {
      setLoading(prevState => ({ ...prevState, [key]: false }));
    }
  }, []);

  const loadUserData = useCallback((user_id) => {
    fetchData('/mainpage/home/watch', 'myWatchedVods', user_id);
    fetchData('/mainpage/home/youtube', 'youtubeTrendsVods', user_id);
    fetchData('/mainpage/home/popular', 'popularVods');
    fetchData('/mainpage/home/rating', 'ratingBasedVods', user_id);
    fetchData('/mainpage/home/spotify', 'spotifyVods', user_id);
  }, [fetchData]);

  useEffect(() => {
    const user_name = localStorage.getItem('selectedUserName');
    const user_id = localStorage.getItem('selectedUserId');
    const storedUsers = JSON.parse(localStorage.getItem('user_list') || '[]');
    setUsers(storedUsers);

    if (user_id) {
      loadUserData(user_id);
    }
    if (user_name) {
      setState(prevState => ({ ...prevState, user_name }));
    }
  }, [loadUserData]);

  const handlePosterClick = (vod_id) => {
    const user_id = localStorage.getItem('selectedUserId');
    navigate(`/MovieDetailPage`, { state: { vod_id, user_id } });
  };

  const handleSearchResultClick = (vod_id) => {
    setSearchActive(false);
    setSearchQuery('');
    setSearchResults([]);
    const user_id = localStorage.getItem('selectedUserId');
    navigate(`/MovieDetailPage`, { state: { vod_id, user_id } });
  };

  const handleSearchSubmit = async (event) => {
    if (event.key === 'Enter' && searchQuery.trim() !== '') {
      try {
        const response = await axios.post(`${process.env.REACT_APP_EC2_ADDRESS}/search-vods`, { query: searchQuery });
        const user_id = localStorage.getItem('selectedUserId');
        navigate('/SearchBar', { state: { searchResults: response.data, user_id } });
      } catch (error) {
        console.error('Error searching VODs:', error);
      }
    }
  };

  const togglePlaylistVisibility = () => {
    setPlaylistVisible(!playlistVisible);
  };

  const toggleUserMenuVisibility = () => {
    setUserMenuVisible(!userMenuVisible);
  };

  const handleUserChange = (user_id, user_name) => {
    localStorage.setItem('selectedUserId', user_id);
    localStorage.setItem('selectedUserName', user_name);
    setState(prevState => ({ ...prevState, user_name }));
    setUserMenuVisible(false);
    loadUserData(user_id);
    navigate('/Main');
  };

  const handleCategoryClick = () => {
    navigate('/Movie', { state: { movies: state.myWatchedVods } });
  };

  const goToMainPage = () => {
    navigate('/Main');
  };

  return (
    <div className='body'>
      <Header 
        state={state}
        searchActive={searchActive}
        setSearchActive={setSearchActive}
        searchResults={searchResults}
        setSearchResults={setSearchResults}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        users={users}
        handleSearchInputChange={() => {}}
        handleSearchSubmit={handleSearchSubmit}
        handleSearchResultClick={handleSearchResultClick}
        togglePlaylistVisibility={togglePlaylistVisibility}
        playlistVisible={playlistVisible}
        toggleUserMenuVisibility={toggleUserMenuVisibility}
        userMenuVisible={userMenuVisible}
        handleUserChange={handleUserChange}
        handleCategoryClick={handleCategoryClick}
        goToMainPage={goToMainPage}
        searchInputRef={searchInputRef}
      />
      <div className="trailer-container">
        <video autoPlay loop muted>
          <source src="/TrailVideo.mp4" type="video/mp4" />
          예고편
        </video>
      </div>

      <MyWatchedVods 
        vods={state.myWatchedVods} 
        handlePosterClick={handlePosterClick} 
        user_name={state.user_name} 
        loading={loading.myWatchedVods}
      />
      <PopularVods 
        vods={state.popularVods} 
        handlePosterClick={handlePosterClick} 
        loading={loading.popularVods}
      />
       <YouTubeTrends 
        vods={state.youtubeTrendsVods} 
        handlePosterClick={handlePosterClick} 
        loading={loading.youtubeTrendsVods}
      />
      <Spotify 
        vods={state.spotifyVods} 
        handlePosterClick={handlePosterClick} 
        loading={loading.spotifyVods}
      />
       <RatingBasedVods 
        vods={state.ratingBasedVods} 
        handlePosterClick={handlePosterClick} 
        loading={loading.ratingBasedVods}
      />
    </div>
  );
};

export default Main;









