import React, { useState, useEffect } from "react";
import "./App.css";
import Logo from "./assets/Logo.png";
import Download from "./assets/download.png";

function App() {
  const API_KEY = "ndFZWMqcwlbe4uaEQAjp48nuA7t17Agu18kaGyieUpXK5UIDUEqsGVvl";
  const [images, setImages] = useState([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [searchValueGlobal, setSearchValueGlobal] = useState("");

  useEffect(() => {
    getImages(pageIndex);
  }, [pageIndex]); // Reload images when pageIndex changes

  const fetchImages = async (url) => {
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
    }
  };

  const GenerateHTML = (photos) => {
    return photos.map((photo) => (
      <div className="item" key={photo.id}>
        <a
          href={photo.src.original}
          data-lightbox="mygallary"
          data-title={photo.photographer}
        >
          <img src={photo.src.large} alt={photo.photographer} />
          <h3>{photo.photographer}</h3>
        </a>
        <a
          href={photo.src.original}
          target="_blank"
          download={photo.src.original}
          rel="noreferrer"
        >
          <img className="photo-download_info" src={Download} alt="Download" />
        </a>
      </div>
    ));
  };

  const getImages = async (index) => {
    const baseURL = `https://api.pexels.com/v1/curated?page=${index}&per_page=12`;
    const data = await fetchImages(baseURL);
    setImages(data.photos);
  };

  const getSearchedImages = async (searchValue) => {
    const baseURL = `https://api.pexels.com/v1/search?query=${searchValue}&page=1&per_page=12`;
    const data = await fetchImages(baseURL);
    setImages(data.photos);
  };

  const getMoreSearchedImages = async (index) => {
    const baseURL = `https://api.pexels.com/v1/search?query=${searchValueGlobal}&page=${index}&per_page=12`;
    const data = await fetchImages(baseURL);
    setImages((prevImages) => [...prevImages, ...data.photos]);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPageIndex(1);
    const searchValue = e.target.querySelector("input").value;
    setSearchValueGlobal(searchValue);
    getSearchedImages(searchValue);
    e.target.reset();
  };

  const handleLoadMore = () => {
    setPageIndex((prevIndex) => prevIndex + 1);
  };

  return (
    <section>
      <div className="container">
        <header className="header">
          <img src={Logo} />
          <form onSubmit={handleSearch}>
            <input type="text" placeholder="Search" />
            <ion-icon name="search-outline"></ion-icon>
          </form>
        </header>
        <div className="gallery">{GenerateHTML(images)}</div>
        <a className="load-more" onClick={handleLoadMore}>
          Load More
        </a>
      </div>
    </section>
  );
}

export default App;
