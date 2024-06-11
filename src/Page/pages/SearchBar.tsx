import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../CSS/SearchBar.css';

interface SearchResult {
  VOD_ID: string;
  TITLE: string;
  POSTER: string;
}

interface SearchHistoryEntry {
  keyword: string;
  date: Date;
}

function SearchBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialResults: SearchResult[] = location.state?.searchResults || [];
  const initialQuery: string = location.state?.searchQuery || '';
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<SearchResult[]>(initialResults);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);

  const fetchHistory = useCallback(() => {
    const historyRaw = localStorage.getItem('searchLog');
    if (historyRaw) {
      try {
        const history: SearchHistoryEntry[] = JSON.parse(historyRaw);
        setSearchHistory(history);
      } catch (error) {
        console.error('searchLog 파싱 중 오류 발생', error);
        setSearchHistory([]);
      }
    }
  }, []);

  const updateSearchHistory = useCallback((term: string) => {
    setSearchHistory((prevHistory) => {
      const newHistory = [...prevHistory, { keyword: term, date: new Date() }];
      if (newHistory.length > 6) {
        newHistory.shift();
      }
      localStorage.setItem('searchLog', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  const sendSearchDataToBackend = useCallback(async () => {
    if (!searchTerm) return;

    setIsLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_EC2_ADDRESS}/search/${encodeURIComponent(searchTerm)}`);
      if (response.status === 200 && response.data.length > 0) {
        setSearchResults(response.data);
        setErrorMessage('');
        console.log('검색 결과:', response.data);
      } else {
        setErrorMessage('검색어에 맞는 VOD가 없습니다.');
        setSearchResults([]);
      }
      updateSearchHistory(searchTerm);
    } catch (error) {
      console.error('검색 중 문제 발생:', error);
      setErrorMessage('검색 중 문제가 발생했습니다.');
    }
    setIsLoading(false);
  }, [searchTerm, updateSearchHistory]);

  useEffect(() => {
    fetchHistory();
    if (searchTerm) {
      sendSearchDataToBackend();
    }
  }, [fetchHistory, searchTerm, sendSearchDataToBackend]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchResultClick = async (vod_id: string) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_EC2_ADDRESS}/detailpage/vod_detail/${vod_id}`);
      const vodData = response.data;
      console.log('VOD 데이터:', vodData);
      navigate('/MovieDetailPage', { state: { vod_id: vod_id } });
    } catch (error) {
      console.error('VOD 데이터 가져오기 중 오류:', error);
    }
  };

  return (
    <div className="search-bar-container">
      <div className="search-container">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="검색어를 입력하세요"
          className="search-input"
        />
        <button onClick={sendSearchDataToBackend} disabled={isLoading}>
          검색
        </button>
      </div>
      {isLoading && <p>검색 중...</p>}
      {errorMessage && <p>{errorMessage}</p>}
      <div className="search-results">
        <ul>
          {searchResults.map((item) => (
            <li key={item.VOD_ID}>
              <img
                src={item.POSTER}
                alt={item.TITLE}
                onClick={() => handleSearchResultClick(item.VOD_ID)}
              />
              <div>
                <h3>{item.TITLE}</h3>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default SearchBar;
