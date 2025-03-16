import React, { useState, useEffect, useCallback, useMemo } from "react";
import "./App.css";
import Download from "./assets/download.png";

function App() {
  const API_KEY = "ndFZWMqcwlbe4uaEQAjp48nuA7t17Agu18kaGyieUpXK5UIDUEqsGVvl";
  
  // Move CACHE_DURATION to useMemo
  const CACHE_DURATION = useMemo(() => 1000 * 60 * 60, []); // 1 hour cache

  // Add cache related states
  const [state, setState] = useState({
    images: JSON.parse(localStorage.getItem('cachedImages')) || [],
    pageIndex: 1,
    timestamp: parseInt(localStorage.getItem('cacheTimestamp')) || 0
  });

  const [images, setImages] = useState([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [searchValueGlobal, setSearchValueGlobal] = useState("");
  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showPreloader, setShowPreloader] = useState(true);
  const [suggestions, setSuggestions] = useState(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : ['nature', 'abstract', 'minimal', 'dark'];
  });
  const [showSuggestions, setShowSuggestions] = useState(false);

  const saveToCache = useCallback((images) => {
    const timestamp = Date.now();
    localStorage.setItem('cachedImages', JSON.stringify(images));
    localStorage.setItem('cacheTimestamp', timestamp.toString());
    setState(prev => ({ ...prev, images, timestamp }));
  }, []);

  const isCacheValid = useCallback(() => {
    const now = Date.now();
    return now - state.timestamp < CACHE_DURATION;
  }, [state.timestamp, CACHE_DURATION]);

  const fetchImages = useCallback(
    async (url, useCache = true) => {
      const cacheKey = `image_cache_${url}`;
      
      // Check cache first
      if (useCache) {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          if (Date.now() - timestamp < CACHE_DURATION) {
            return data;
          }
        }
      }

      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: API_KEY,
          },
        });
        const data = await response.json();
        
        // Save to cache
        localStorage.setItem(cacheKey, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
        
        return data;
      } catch (error) {
        // console.error("Error fetching images:", error);
        return { photos: [] };
      }
    },
    [API_KEY, CACHE_DURATION]
  );

  const getImages = useCallback(
    async (index, isAppending = false) => {
      // Check cache for initial load
      if (!isAppending && isCacheValid() && state.images.length > 0) {
        setImages(state.images);
        return;
      }

      setLoading(true);
      setNoResults(false);
      const baseURL = `https://api.pexels.com/v1/curated?page=${index}&per_page=12`;
      const data = await fetchImages(baseURL);

      if (data.photos.length === 0) {
        if (!isAppending) setNoResults(true);
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      setImages((prevImages) =>
        isAppending
          ? [
              ...new Map(
                [...prevImages, ...data.photos].map((img) => [img.id, img])
              ).values(),
            ]
          : data.photos
      );

      if (!isAppending) {
        saveToCache(data.photos);
      }

      setPageIndex(index);
      setLoading(false);
    },
    [fetchImages, isCacheValid, saveToCache, state.images]
  );

  const getSearchedImages = useCallback(
    async (searchValue, index = 1, isAppending = false) => {
      const cacheKey = `search_${searchValue}_${index}`;
      const cachedResults = localStorage.getItem(cacheKey);

      if (!isAppending && cachedResults) {
        const { data, timestamp } = JSON.parse(cachedResults);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setImages(data);
          return;
        }
      }

      setLoading(true);
      setNoResults(false);
      const baseURL = `https://api.pexels.com/v1/search?query=${searchValue}&page=${index}&per_page=12`;
      const data = await fetchImages(baseURL);

      if (data.photos.length === 0) {
        if (!isAppending) setNoResults(true);
        setHasMore(false);
        if (isAppending) {
          setNoResults(true);
        }
      } else {
        setHasMore(true);
      }

      setImages((prevImages) =>
        isAppending
          ? [
              ...new Map(
                [...prevImages, ...data.photos].map((img) => [img.id, img])
              ).values(),
            ]
          : data.photos
      );

      // Cache search results
      if (!isAppending) {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: data.photos,
          timestamp: Date.now()
        }));
      }

      setLoading(false);
    },
    [fetchImages, CACHE_DURATION]
  );

  const handleSuggestionClick = (suggestion) => {
    setSearchValueGlobal(suggestion);
    getSearchedImages(suggestion);
    setShowSuggestions(false);
    
    // Update recent searches
    setSuggestions(prev => {
      const updated = [suggestion, ...prev.filter(s => s !== suggestion)].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const searchValue = e.target.querySelector("input").value;
    if (!searchValue.trim()) return;
    
    setSearchValueGlobal(searchValue);
    getSearchedImages(searchValue);
    setShowSuggestions(false);
    
    // Update recent searches
    setSuggestions(prev => {
      const updated = [searchValue, ...prev.filter(s => s !== searchValue)].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
    
    e.target.reset();
  };

  const handleLoadMore = () => {
    if (hasMore) {
      if (searchValueGlobal) {
        getSearchedImages(searchValueGlobal, pageIndex + 1, true);
      } else {
        getImages(pageIndex + 1, true);
      }
    } else {
      setNoResults(true);
    }
  };

  const handleHeaderClick = () => {
    setImages([]);
    setPageIndex(1);
    setSearchValueGlobal("");
    setNoResults(false);
    setHasMore(true);
    getImages(1);
  };

  useEffect(() => {
    // Clear old caches on mount
    const clearOldCache = () => {
      const now = Date.now();
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('image_cache_') || key?.startsWith('search_')) {
          const item = JSON.parse(localStorage.getItem(key));
          if (now - item.timestamp > CACHE_DURATION) {
            localStorage.removeItem(key);
          }
        }
      }
    };

    clearOldCache();

    // Hide preloader after 2.5 seconds
    const timer = setTimeout(() => {
      setShowPreloader(false);
    }, 2500);

    getImages(1);

    return () => clearTimeout(timer);
  }, [getImages, CACHE_DURATION]);

  const GenerateHTML = useMemo(
    () => (photos) =>
      photos.map((photo, index) => (
        <div className="item" key={`${photo.id}-${index}`}>
          <a
            href={photo.src.original}
            data-lightbox="Art-Gallery"
            data-title={photo.photographer}
          >
            <img src={photo.src.large} alt={photo.photographer} />
            <h3>{photo.photographer}</h3>
          </a>
          <a
            href={photo.src.original}
            target="_blank"
            download={photo.src.original}
            rel="noopener noreferrer"
          >
            <img
              className="photo-download_info"
              src={Download}
              alt="Download"
            />
          </a>
        </div>
      )),
    []
  );

  return (
    <>
      {showPreloader && (
        <div className="preloader">
          <h2>Art Gallery</h2>
        </div>
      )}
      <section>
        <div className="container">
          <header className="header">
            <h1 onClick={handleHeaderClick} style={{ cursor: "pointer" }}>
              Art-Gallery
            </h1>
            <div className="search-container" style={{ position: 'relative' }}>
              <form onSubmit={handleSearch}>
                <input 
                  type="text" 
                  placeholder="Search" 
                  onFocus={() => setShowSuggestions(true)}
                />
                <ion-icon name="search-outline"></ion-icon>
              </form>
              {showSuggestions && (
                <div className="search-suggestions">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </header>
          <div className="gallery">
            {noResults ? (
              <div className="no-results">No images found for your search.</div>
            ) : (
              GenerateHTML(images)
            )}
          </div>
          {!loading && !noResults && (
            <button className="load-more" onClick={handleLoadMore}>
              Load More
            </button>
          )}
          {loading && <div style={{ padding: "1rem" }}>Loading...</div>}
        </div>
      </section>
    </>
  );
}

export default App;
