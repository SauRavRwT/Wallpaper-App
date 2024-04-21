// App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Header from './components/Header';
import ImageList from './components/ImageList';
import Search from './components/Search';
import LoadMoreButton from './components/LoadMoreButton';

function App() {
  const [images, setImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchImages();
  }, [currentPage]);

  const fetchImages = async (page = 1) => {
    try {
      const response = await axios.get(
        `https://api.pexels.com/v1/curated?page=${page}`,
        {
          headers: {
            Authorization: 'ndFZWMqcwlbe4uaEQAjp48nuA7t17Agu18kaGyieUpXK5UIDUEqsGVvl',
          },
        }
      );

      if (page === 1) {
        // If it's the first page, set the images directly
        setImages(response.data.photos);
      } else {
        // If it's not the first page, append the new images to the existing ones
        setImages((prevImages) => [...prevImages, ...response.data.photos]);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const handleLoadMore = () => {
    setCurrentPage((prevPage) => prevPage + 1);
    fetchImages(currentPage + 1);
  };

  return (
    <div className="App">
      <Header />
      <Search />
      <ImageList images={images} />
      <LoadMoreButton onClick={handleLoadMore} />
    </div>
  );
}

export default App;