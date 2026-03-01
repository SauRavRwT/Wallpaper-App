import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoSearch,
  IoSunny,
  IoMoon,
  IoHeart,
  IoDownload,
  IoTrash,
  IoImagesOutline,
  IoClose,
} from "react-icons/io5";
import SimpleLightbox from "simplelightbox";
import "simplelightbox/dist/simple-lightbox.min.css";
import "./App.css";

function App() {
  const API_KEY = process.env.REACT_APP_PEXELS_API_KEY;
  const CACHE_DURATION = useMemo(() => 1000 * 60 * 60, []);

  const [images, setImages] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("favorites");
    return saved ? JSON.parse(saved) : [];
  });
  const [favoriteCount, setFavoriteCount] = useState(() => {
    const saved = localStorage.getItem("favorites");
    return saved ? JSON.parse(saved).length : 0;
  });
  const [pageIndex, setPageIndex] = useState(1);
  const [searchValueGlobal, setSearchValueGlobal] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showFavorites, setShowFavorites] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light",
  );
  const [suggestions] = useState([
    "Architecture",
    "Nature",
    "Minimal",
    "Space",
    "Portrait",
  ]);

  const loader = useRef(null);
  const lightboxRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    lightboxRef.current = new SimpleLightbox(".gallery a", {
      overlayOpacity: 0.92,
      navText: ["‹", "›"],
      captionDelay: 250,
    });
    return () => lightboxRef.current?.destroy();
  }, [images, favorites, showFavorites]);

  const fetchImages = useCallback(
    async (url) => {
      const cacheKey = `image_cache_${url}`;
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_DURATION) return data;
      }
      try {
        const response = await fetch(url, {
          headers: { Authorization: API_KEY },
        });
        const data = await response.json();
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ data, timestamp: Date.now() }),
        );
        return data;
      } catch (error) {
        return { photos: [] };
      }
    },
    [API_KEY, CACHE_DURATION],
  );

  const getImages = useCallback(
    async (index, isAppending = false) => {
      if (!hasMore && isAppending) return;
      setLoading(true);
      const url = searchValueGlobal
        ? `https://api.pexels.com/v1/search?query=${searchValueGlobal}&page=${index}&per_page=20`
        : `https://api.pexels.com/v1/curated?page=${index}&per_page=20`;

      const data = await fetchImages(url);
      if (!data.photos || data.photos.length === 0) {
        setHasMore(false);
      } else {
        setImages((prev) =>
          isAppending ? [...prev, ...data.photos] : data.photos,
        );
        setPageIndex(index);
      }
      setLoading(false);
    },
    [fetchImages, searchValueGlobal, hasMore],
  );

  useEffect(() => {
    const currentLoader = loader.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loading &&
          hasMore &&
          !showFavorites
        ) {
          getImages(pageIndex + 1, true);
        }
      },
      { threshold: 0.5 },
    );
    if (currentLoader) observer.observe(currentLoader);
    return () => {
      if (currentLoader) observer.unobserve(currentLoader);
    };
  }, [loading, hasMore, pageIndex, getImages, showFavorites]);

  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    getImages(1);
  }, [getImages]);

  const handleSearch = (e) => {
    e.preventDefault();
    const val = searchInput.trim();
    if (!val) return;
    setSearchValueGlobal(val);
    setHasMore(true);
    setImages([]);
    setPageIndex(1);
  };

  const handleSuggestion = (s) => {
    setSearchInput(s);
    setSearchValueGlobal(s);
    setHasMore(true);
    setImages([]);
    setPageIndex(1);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchValueGlobal("");
    setHasMore(true);
    setImages([]);
    setPageIndex(1);
  };

  const handleDownload = async (e, url, name) => {
    e.preventDefault();
    e.stopPropagation();
    const res = await fetch(url);
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Art-gallery-${name}.jpg`;
    link.click();
  };

  const toggleFavorite = (e, photo) => {
    e.preventDefault();
    e.stopPropagation();
    const isFav = favorites.some((f) => f.id === photo.id);
    const updated = isFav
      ? favorites.filter((f) => f.id !== photo.id)
      : [...favorites, photo];
    setFavorites(updated);
    setFavoriteCount(updated.length);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  const displayPhotos = showFavorites ? favorites : images;

  return (
    <div className="app-wrapper">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-inner">
          <span
            className="brand"
            onClick={() => {
              clearSearch();
              setShowFavorites(false);
            }}
          >
            Art-Gallery
          </span>
          <div className="nav-actions">
            <button
              className="nav-btn"
              onClick={() => {
                // Only clear image cache keys, preserve favorites and theme
                Object.keys(localStorage)
                  .filter((k) => k.startsWith("image_cache_"))
                  .forEach((k) => localStorage.removeItem(k));
                window.location.reload();
              }}
              title="Reset App"
            >
              <IoTrash size="1.1em" />
            </button>
            <button
              className="nav-btn"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? (
                <IoMoon size="1.1em" />
              ) : (
                <IoSunny size="1.1em" />
              )}
            </button>
            <button
              className={`nav-btn fav-btn ${showFavorites ? "active" : ""}`}
              onClick={() => setShowFavorites(!showFavorites)}
            >
              {showFavorites ? (
                <IoImagesOutline size="1.1em" />
              ) : (
                <IoHeart size="1.1em" />
              )}
              {favoriteCount > 0 && (
                <span className="fav-badge">{favoriteCount}</span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="hero">
        <div className="hero-inner">
          <div className="hero-text">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="hero-title"
            >
              Hand-picked high-quality wallpapers,
              <br />
              curated just for you.
            </motion.h1>

            {/* 2 latest small photos */}
            {images.slice(0, 2).map((photo) => (
              <motion.div
                key={photo.id}
                className="hero-photo"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <img
                  className="hero-img"
                  src={photo.src.medium}
                  alt={photo.alt}
                />
              </motion.div>
            ))}
          </div>

          <form onSubmit={handleSearch} className="search-form">
            <div className="search-box">
              <IoSearch className="search-icon" size="1.1em" />
              <input
                type="text"
                id="searchInput"
                name="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search for photos..."
                className="search-input"
              />
              {searchInput && (
                <button
                  type="button"
                  className="clear-btn"
                  onClick={clearSearch}
                >
                  <IoClose size="1em" />
                </button>
              )}
              <button type="submit" className="search-submit">
                Search
              </button>
            </div>
          </form>

          <div className="tags">
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="tag-btn"
                onClick={() => handleSuggestion(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Section header */}
      <div className="section-header">
        <h2 className="section-title">
          {showFavorites
            ? "Saved Photos"
            : searchValueGlobal
              ? `Results for "${searchValueGlobal}"`
              : "Curated Collection"}{" "}
          ({displayPhotos.length})
        </h2>
      </div>

      {/* Gallery */}
      <main className="gallery-container">
        {displayPhotos.length === 0 && !loading && (
          <div className="empty-state">
            <IoImagesOutline size="3em" />
            <p>
              {showFavorites ? "No saved photos yet." : "No results found."}
            </p>
          </div>
        )}

        <div className="gallery">
          <AnimatePresence>
            {displayPhotos.map((photo) => {
              const isFav = favorites.some((f) => f.id === photo.id);
              return (
                <motion.div
                  key={photo.id}
                  className="gallery-item"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="card">
                    <a
                      href={photo.src.original}
                      data-caption={photo.photographer}
                      className="card-img-wrap"
                    >
                      <img
                        src={photo.src.large}
                        alt={photo.alt}
                        loading="lazy"
                      />
                    </a>
                    <div className="card-actions">
                      <button
                        className={`action-btn ${isFav ? "fav-active" : ""}`}
                        onClick={(e) => toggleFavorite(e, photo)}
                        title="Save"
                      >
                        <IoHeart size="1em" />
                      </button>
                      <button
                        className="action-btn"
                        onClick={(e) =>
                          handleDownload(
                            e,
                            photo.src.original,
                            photo.photographer,
                          )
                        }
                        title="Download"
                      >
                        <IoDownload size="1em" />
                      </button>
                    </div>
                    <div className="card-meta">
                      <span className="photo-credit">
                        <span className="credit-label">Photo by</span>{" "}
                        {photo.photographer}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Loader */}
        <div ref={loader} className="loader-area">
          {loading && (
            <div className="loader">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
          {!hasMore && !showFavorites && displayPhotos.length > 0 && (
            <p className="end-msg">You've reached the end</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
