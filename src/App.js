import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { FaSearch, FaMoon, FaSun } from "react-icons/fa";
import "./App.css";
import Download from "./assets/download.png";

function App() {
  const API_KEY = "ndFZWMqcwlbe4uaEQAjp48nuA7t17Agu18kaGyieUpXK5UIDUEqsGVvl";
  const CACHE_DURATION = useMemo(() => 1000 * 60 * 60, []); // 1 hour cache

  const [images, setImages] = useState([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [searchValueGlobal, setSearchValueGlobal] = useState("");
  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showPreloader, setShowPreloader] = useState(true);
  const [suggestions, setSuggestions] = useState(() => {
    const saved = localStorage.getItem("recentSearches");
    return saved
      ? JSON.parse(saved)
      : ["Portrait", "Illustration", "Abstract", "Space"];
  });
  const [theme, setTheme] = useState("system");
  const loader = useRef(null);

  const fetchImages = useCallback(
    async (url) => {
      const cacheKey = `image_cache_${url}`;
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }

      try {
        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
            Authorization: API_KEY,
          },
        });
        const data = await response.json();

        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data,
            timestamp: Date.now(),
          })
        );

        return data;
      } catch (error) {
        return { photos: [] };
      }
    },
    [API_KEY, CACHE_DURATION]
  );

  const getImages = useCallback(
    async (index, isAppending = false) => {
      setLoading(true);
      setNoResults(false);
      const baseURL = `https://api.pexels.com/v1/curated?page=${index}&per_page=12`;
      const data = await fetchImages(baseURL);

      if (data.photos.length === 0) {
        setNoResults(!isAppending);
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

      setPageIndex(index);
      setLoading(false);
    },
    [fetchImages]
  );

  const getSearchedImages = useCallback(
    async (searchValue, index = 1, isAppending = false) => {
      setLoading(true);
      setNoResults(false);
      const baseURL = `https://api.pexels.com/v1/search?query=${searchValue}&page=${index}&per_page=12`;
      const data = await fetchImages(baseURL);

      if (data.photos.length === 0) {
        setNoResults(!isAppending);
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

      setLoading(false);
    },
    [fetchImages]
  );

  const handleSuggestionClick = (suggestion) => {
    setSearchValueGlobal(suggestion);
    getSearchedImages(suggestion);
    setSuggestions((prev) => {
      const updated = [
        suggestion,
        ...prev.filter((s) => s !== suggestion),
      ].slice(0, 5);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
      return updated;
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const searchValue = e.target.querySelector("input").value;
    if (!searchValue.trim()) return;

    setSearchValueGlobal(searchValue);
    getSearchedImages(searchValue);
    setSuggestions((prev) => {
      const updated = [
        searchValue,
        ...prev.filter((s) => s !== searchValue),
      ].slice(0, 5);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
      return updated;
    });

    e.target.reset();
  };

  const handleObserver = useCallback(
    (entries) => {
      const target = entries[0];
      if (target.isIntersecting && !loading && hasMore) {
        if (searchValueGlobal) {
          getSearchedImages(searchValueGlobal, pageIndex + 1, true);
        } else {
          getImages(pageIndex + 1, true);
        }
      }
    },
    [
      loading,
      hasMore,
      searchValueGlobal,
      pageIndex,
      getSearchedImages,
      getImages,
    ]
  );

  useEffect(() => {
    const currentLoader = loader.current;
    const option = {
      root: null,
      rootMargin: "20px",
      threshold: 0,
    };
    const observer = new IntersectionObserver(handleObserver, option);
    if (currentLoader) observer.observe(currentLoader);

    return () => {
      if (currentLoader) observer.unobserve(currentLoader);
    };
  }, [handleObserver]);

  const handleHeaderClick = () => {
    setImages([]);
    setPageIndex(1);
    setSearchValueGlobal("");
    setNoResults(false);
    setHasMore(true);
    getImages(1);
  };

  useEffect(() => {
    const clearOldCache = () => {
      const now = Date.now();
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("image_cache_") || key.startsWith("search_")) {
          const item = JSON.parse(localStorage.getItem(key));
          if (now - item.timestamp > CACHE_DURATION) {
            localStorage.removeItem(key);
          }
        }
      });
    };

    clearOldCache();
    const timer = setTimeout(() => setShowPreloader(false), 2500);
    getImages(1);

    return () => clearTimeout(timer);
  }, [getImages, CACHE_DURATION]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      if (theme === "system") {
        document.documentElement.setAttribute(
          "data-theme",
          mediaQuery.matches ? "dark" : "light"
        );
      } else {
        document.documentElement.setAttribute("data-theme", theme);
      }
    };

    applyTheme();
    const listener = (e) => {
      if (theme === "system") {
        document.documentElement.setAttribute(
          "data-theme",
          e.matches ? "dark" : "light"
        );
      }
    };

    mediaQuery.addListener(listener);
    return () => mediaQuery.removeListener(listener);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => {
      const themeMap = { light: "dark", dark: "system", system: "light" };
      return themeMap[current];
    });
  };

  const handleDownload = async (url, photographerName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${photographerName}-${Date.now()}-Art-Gallery.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

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
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleDownload(photo.src.original, photo.photographer);
            }}
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
            <button onClick={toggleTheme} className="theme-toggle">
              {theme === "dark" ? (
                <FaSun />
              ) : theme === "light" ? (
                <FaMoon />
              ) : window.matchMedia("(prefers-color-scheme: dark)").matches ? (
                <FaSun />
              ) : (
                <FaMoon />
              )}
            </button>
            <div className="search-container">
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  placeholder="Search"
                  id="search-input"
                  name="search"
                />
                <FaSearch />
              </form>
              <div className="suggestions-pills">
                {suggestions.map((suggestion, index) => (
                  <span
                    key={index}
                    className="pill-item"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </span>
                ))}
              </div>
            </div>
          </header>
          <div className="gallery">
            {noResults ? (
              <div className="no-results">No images found for your search.</div>
            ) : (
              GenerateHTML(images)
            )}
            <div ref={loader} style={{ height: "50px" }}>
              {loading && <div style={{ padding: "1rem" }}>Loading...</div>}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default App;
