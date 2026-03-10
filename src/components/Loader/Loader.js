import React, { forwardRef } from "react";
import "./Loader.css";

const Loader = forwardRef(
  ({ loading, hasMore, showFavorites, displayPhotosLength }, ref) => {
    return (
      <div ref={ref} className="loader-area">
        {loading && (
          <div className="loader">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        {!hasMore && !showFavorites && displayPhotosLength > 0 && (
          <p className="end-msg">You've reached the end</p>
        )}
      </div>
    );
  },
);

export default Loader;
