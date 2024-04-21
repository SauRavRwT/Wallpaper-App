import React from 'react';

const DownloadButton = ({ imageUrl }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'wallpaper.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button className="download-button" onClick={handleDownload}>
      Download
    </button>
  );
};

export default DownloadButton;
