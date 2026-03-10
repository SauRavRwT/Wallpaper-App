import React from "react";
import { motion } from "framer-motion";
import { IoSearch, IoClose } from "react-icons/io5";
import "./Header.css";

const Header = ({
  images,
  searchInput,
  setSearchInput,
  handleSearch,
  clearSearch,
  suggestions,
  handleSuggestion,
}) => {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-content">
          <div className="header-text-section">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="header-title"
            >
              Discover stunning <br />
              high-quality wallpapers.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="header-subtitle"
            >
              Hand-picked, beautifully curated collection for your next project
              or screen.
            </motion.p>
          </div>

          {images.length >= 4 && (
            <div className="header-showcase">
              {images.slice(0, 4).map((photo, index) => {
                // Determine z-index and transformations based on index
                // 4 images: we want them somewhat fanned out
                // index 0: bottom-left
                // index 1: bottom-right
                // index 2: top-left
                // index 3: top-right (front-most)
                
                const rotations = [-25, 15, -10, 5];
                const xOffsets = ["-40%", "40%", "-20%", "20%"];
                const yOffsets = ["20%", "15%", "-5%", "-15%"];
                
                return (
                  <motion.div
                    key={photo.id}
                    className="header-photo"
                    style={{
                      zIndex: index + 1,
                    }}
                    initial={{
                      opacity: 0,
                      scale: 0.8,
                      rotate: rotations[index] * 2,
                      x: xOffsets[index],
                      y: "30%",
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      rotate: rotations[index],
                      x: xOffsets[index],
                      y: yOffsets[index],
                    }}
                    whileHover={{
                      scale: 1.15,
                      rotate: 0,
                      zIndex: 10,
                      transition: { duration: 0.3, ease: "easeOut" },
                    }}
                    transition={{
                      duration: 0.8,
                      delay: 0.2 + index * 0.1,
                      type: "spring",
                      bounce: 0.4,
                    }}
                  >
                    <img
                      className="header-img"
                      src={photo.src.medium}
                      alt={photo.alt}
                    />
                    <div className="header-label">
                      <span className="credit-label">Photo by</span>
                      <strong>{photo.photographer}</strong>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <form onSubmit={handleSearch} className="search-form">
          <div className="search-box">
            <IoSearch className="search-icon" size="1.1em" />
            <input
              type="text"
              id="searchInput"
              name="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for photos..."
              className="search-input"
            />
            {searchInput && (
              <button
                type="button"
                className="clear-btn"
                onClick={clearSearch}
              >
                <IoClose size="1em" />
              </button>
            )}
            <button type="submit" className="search-submit">
              Search
            </button>
          </div>
        </form>

        <div className="tags">
          {suggestions.map((s, i) => (
            <button
              key={i}
              className="tag-btn"
              onClick={() => handleSuggestion(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;
