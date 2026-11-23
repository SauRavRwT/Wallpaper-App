import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./App.css";

import FisheyeInfiniteGrid from "./components/FisheyeGrid/FisheyeInfiniteGrid.jsx";

const API_KEY = import.meta.env.VITE_PEXELS_API_KEY;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const PER_PAGE = 80; // Pexels maximum, so one page fills the whole tile pool

const curatedUrl = (page) =>
  `https://api.pexels.com/v1/curated?page=${page}&per_page=${PER_PAGE}`;
const searchUrl = (query, page) =>
  `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${PER_PAGE}&page=${page}`;

const readCache = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    return Date.now() - timestamp < CACHE_DURATION ? data : null;
  } catch {
    return null;
  }
};

const writeCache = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    /* storage full or blocked, just skip caching */
  }
};

const fetchPage = async (url, signal) => {
  const res = await fetch(url, { headers: { Authorization: API_KEY }, signal });
  if (!res.ok) throw new Error(`Pexels responded ${res.status}`);
  return res.json();
};

const mergeUnique = (prev, next) => {
  const seen = new Set(prev.map((photo) => photo.id));
  return [...prev, ...next.filter((photo) => !seen.has(photo.id))];
};

function App() {
  const [photos, setPhotos] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [searchStatus, setSearchStatus] = useState("idle"); // idle | searching | ready
  const abortRef = useRef(null);
  const photoCountRef = useRef(0);
  // Tracks the active query so late responses from an old query can be ignored.
  const sourceRef = useRef({
    query: "",
    page: 1,
    hasMore: true,
    loading: false,
  });

  photoCountRef.current = photos.length;

  // First page for a query ("" = curated). Replaces the current photos.
  const loadPhotos = useCallback(async (query) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const source = { query, page: 1, hasMore: true, loading: false };
    sourceRef.current = source;

    const url = query ? searchUrl(query, 1) : curatedUrl(1);
    const cacheKey = `image_cache_${url}`;

    if (!query) {
      const cached = readCache(cacheKey);
      if (cached?.photos?.length) {
        source.hasMore = Boolean(cached.next_page);
        setPhotos(cached.photos);
        setStatus("ready");
        setSearchStatus("idle");
        return;
      }
    } else {
      setSearchStatus("searching");
    }

    try {
      const data = await fetchPage(url, controller.signal);
      if (abortRef.current !== controller) return;
      source.hasMore = Boolean(data.next_page);
      if (!query) {
        if (!data.photos?.length) throw new Error("No photos returned");
        writeCache(cacheKey, data);
      }
      setPhotos(data.photos || []);
      setStatus("ready");
      setSearchStatus(query ? "ready" : "idle");
    } catch (error) {
      if (error.name === "AbortError" || abortRef.current !== controller)
        return;
      if (!query && photoCountRef.current === 0) {
        setStatus("error");
      } else {
        setPhotos([]);
        setStatus("ready");
        setSearchStatus("ready");
      }
    }
  }, []);

  // Next page for the active query. Appends, never replaces.
  const loadMore = useCallback(async () => {
    const source = sourceRef.current;
    if (source.loading || !source.hasMore) return;
    source.loading = true;
    const nextPage = source.page + 1;
    try {
      const url = source.query
        ? searchUrl(source.query, nextPage)
        : curatedUrl(nextPage);
      const data = await fetchPage(url, abortRef.current?.signal);
      if (sourceRef.current !== source) return;
      source.page = nextPage;
      source.hasMore = Boolean(data.next_page);
      setPhotos((prev) => mergeUnique(prev, data.photos || []));
    } catch {
      /* rate limit or network error: the grid keeps cycling the photos it has */
    } finally {
      source.loading = false;
    }
  }, []);

  useEffect(() => {
    loadPhotos("");
    return () => abortRef.current?.abort();
  }, [loadPhotos]);

  const searchPhotos = useCallback(
    (query) => loadPhotos(query.trim()),
    [loadPhotos],
  );

  const items = useMemo(
    () =>
      photos.map((photo) => ({
        id: photo.id,
        title: photo.photographer,
        alt: photo.alt,
        avg_color: photo.avg_color,
        url: photo.url,
        image: photo.src.large, // ~650px tall: sharp under the lens without being heavy
        original: photo.src.original,
        large2x: photo.src.large2x,
      })),
    [photos],
  );

  return (
    <div className="app">
      <main className="app-main">
        {status === "ready" && (
          <FisheyeInfiniteGrid
            items={items}
            onSearch={searchPhotos}
            onLoadMore={loadMore}
            searchStatus={searchStatus}
          />
        )}
        {status === "loading" && (
          <div className="app-state" role="status">
            <span className="app-dot" />
            <span className="app-dot" />
            <span className="app-dot" />
          </div>
        )}
        {status === "error" && (
          <div className="app-state" role="alert">
            <p>Couldn't load photos from Pexels.</p>
            <p className="app-state-hint">
              Check that <code>VITE_PEXELS_API_KEY</code> is set in{" "}
              <code>.env</code>, then restart the dev server.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
