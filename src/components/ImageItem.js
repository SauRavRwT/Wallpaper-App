import React from 'react';
import DownloadButton from './DownloadButton';

const ImageItem = ({ image }) => {
  return (
    <div className="image-item">
      <img src={image.src.medium} alt={image.photographer} />
      <DownloadButton imageUrl={image.src.original} />
    </div>
  );
};

export default ImageItem;
