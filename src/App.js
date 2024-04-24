import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
// import logo from "./assets/logo.png";
import Download from "./assets/download.png";

function App() {
  const API_KEY = "ndFZWMqcwlbe4uaEQAjp48nuA7t17Agu18kaGyieUpXK5UIDUEqsGVvl";
  const [images, setImages] = useState([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [searchValueGlobal, setSearchValueGlobal] = useState("");

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
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching images:", error);
        return { photos: [] };
      }
    },
    [API_KEY]
  );

  const getImages = useCallback(
    async (index) => {
      const baseURL = `https://api.pexels.com/v1/curated?page=${index}&per_page=12`;
      const data = await fetchImages(baseURL);
      setImages(data.photos);
    },
    [fetchImages]
  );

  const getSearchedImages = useCallback(
    async (searchValue) => {
      const baseURL = `https://api.pexels.com/v1/search?query=${searchValue}&page=1&per_page=12`;
      const data = await fetchImages(baseURL);
      setImages(data.photos);
    },
    [fetchImages]
  );

  const getMoreSearchedImages = useCallback(
    async (index) => {
      const baseURL = `https://api.pexels.com/v1/search?query=${searchValueGlobal}&page=${index}&per_page=12`;
      const data = await fetchImages(baseURL);
      setImages((prevImages) => [...prevImages, ...data.photos]);
    },
    [fetchImages, searchValueGlobal]
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setPageIndex(1);
    const searchValue = e.target.querySelector("input").value;
    setSearchValueGlobal(searchValue);
    getSearchedImages(searchValue);
    e.target.reset();
  };

  const handleLoadMore = () => {
    if (searchValueGlobal) {
      getMoreSearchedImages(pageIndex + 1);
    } else {
      setPageIndex((prevIndex) => prevIndex + 1);
    }
  };

  useEffect(() => {
    getImages(pageIndex);
  }, [pageIndex, getImages]);

  const GenerateHTML = (photos) => {
    return photos.map((photo) => (
      <div className="item" key={photo.id}>
        <a
          href={photo.src.original}
          data-lightbox="Gallery"
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
          <img className="photo-download_info" src={Download} alt="Download" />
        </a>
      </div>
    ));
  };

  return (
    <section>
      <div className="container">
        <header className="header">
          {/* <img src={logo} alt="logo" /> */}
          <h1>Art-Gallery</h1>
          <form onSubmit={handleSearch}>
            <input type="text" placeholder="Search" />
          </form>
        </header>
        <div className="gallery">{GenerateHTML(images)}</div>
        <button className="load-more" onClick={handleLoadMore}>
          Load More
        </button>
      </div>
    </section>
  );
}

export default App;
