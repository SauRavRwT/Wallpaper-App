import React, { useState, useEffect, useCallback, useMemo } from "react";
import "./App.css";
import Download from "./assets/download.png";

function App() {
  const API_KEY = "ndFZWMqcwlbe4uaEQAjp48nuA7t17Agu18kaGyieUpXK5UIDUEqsGVvl";
  const [images, setImages] = useState([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [searchValueGlobal, setSearchValueGlobal] = useState("");
  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchImages = useCallback(
    async (url) => {
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: API_KEY,
          },
        });
        return await response.json();
      } catch (error) {
        console.error("Error fetching images:", error);
        return { photos: [] };
      }
    },
    [API_KEY]
  );

  const getImages = useCallback(
    async (index, isAppending = false) => {
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
        if (!isAppending) setNoResults(true);
        setHasMore(false);
        if (isAppending) {
          window.alert("No more images available.");
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

      setLoading(false);
    },
    [fetchImages]
  );

  const handleSearch = (e) => {
    e.preventDefault();
    const searchValue = e.target.querySelector("input").value;
    setSearchValueGlobal(searchValue);
    getSearchedImages(searchValue);
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
      window.alert("No more images available.");
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
    getImages(1);
  }, [getImages]);

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
    <section>
      <div className="container">
        <header className="header">
          <h1 onClick={handleHeaderClick} style={{ cursor: "pointer" }}>
            Art-Gallery
          </h1>
          <form onSubmit={handleSearch}>
            <input type="text" placeholder="Search" />
            <ion-icon name="search-outline"></ion-icon>
          </form>
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
        {loading && <div style={{padding:"1rem"}}>Loading...</div>}
      </div>
    </section>
  );
}

export default App;
