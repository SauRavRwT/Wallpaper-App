import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";

import SimpleLightbox from "simplelightbox";
import "simplelightbox/dist/simple-lightbox.min.css";
import "./App.css";

import Hero from "./components/Header/Header";
import Navbar from "./components/Navbar/Navbar";
import Gallery from "./components/Gallery/Gallery";
import Loader from "./components/Loader/Loader";

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
      <Navbar
        theme={theme}
        setTheme={setTheme}
        showFavorites={showFavorites}
        setShowFavorites={setShowFavorites}
        favoriteCount={favoriteCount}
        clearSearch={clearSearch}
      />

      <Hero
        images={images}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        handleSearch={handleSearch}
        clearSearch={clearSearch}
        suggestions={suggestions}
        handleSuggestion={handleSuggestion}
      />

      <Gallery
        displayPhotos={displayPhotos}
        loading={loading}
        showFavorites={showFavorites}
        searchValueGlobal={searchValueGlobal}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        handleDownload={handleDownload}
      />

      <Loader
        ref={loader}
        loading={loading}
        hasMore={hasMore}
        showFavorites={showFavorites}
        displayPhotosLength={displayPhotos.length}
      />
    </div>
  );
}

export default App;
