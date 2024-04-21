// LoadMoreButton.js
import React from 'react';

const LoadMoreButton = ({ onClick }) => {
  return (
    <div className="load-more">
      <button onClick={onClick}>Load More</button>
    </div>
  );
};

export default LoadMoreButton;
