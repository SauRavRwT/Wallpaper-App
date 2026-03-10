import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoImagesOutline, IoHeart, IoDownload } from "react-icons/io5";
import "./Gallery.css";

const Gallery = ({
  displayPhotos,
  loading,
  showFavorites,
  searchValueGlobal,
  favorites,
  toggleFavorite,
  handleDownload,
}) => {
  return (
    <>
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
      </main>
    </>
  );
};

export default Gallery;
