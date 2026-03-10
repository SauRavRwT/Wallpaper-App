import React from "react";
import { IoSunny, IoMoon, IoHeart, IoTrash, IoImagesOutline } from "react-icons/io5";
import "./Navbar.css";

const Navbar = ({
  theme,
  setTheme,
  showFavorites,
  setShowFavorites,
  favoriteCount,
  clearSearch,
}) => {
  return (
    <nav className="navbar">
      <div className="nav-inner">
        <span
          className="brand"
          onClick={() => {
            clearSearch();
            setShowFavorites(false);
          }}
        >
          Art-Gallery
        </span>
        <div className="nav-actions">
          <button
            className="nav-btn"
            onClick={() => {
              Object.keys(localStorage)
                .filter((k) => k.startsWith("image_cache_"))
                .forEach((k) => localStorage.removeItem(k));
              window.location.reload();
            }}
            title="Reset App"
          >
            <IoTrash size="1.1em" />
          </button>
          <button
            className="nav-btn"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? (
              <IoMoon size="1.1em" />
            ) : (
              <IoSunny size="1.1em" />
            )}
          </button>
          <button
            className={`nav-btn fav-btn ${showFavorites ? "active" : ""}`}
            onClick={() => setShowFavorites(!showFavorites)}
          >
            {showFavorites ? (
              <IoImagesOutline size="1.1em" />
            ) : (
              <IoHeart size="1.1em" />
            )}
            {favoriteCount > 0 && (
              <span className="fav-badge">{favoriteCount}</span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
