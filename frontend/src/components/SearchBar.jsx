import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import axios from 'axios';

const SearchBar = ({ onSelect, region = "All" }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:8001/search?q=${query}&region=${region}`);
        setSuggestions(response.data);
        setShowDropdown(true);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [query, region]);

  return (
    <div className="relative w-full max-w-2xl mx-auto z-50">
      <div className="relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a movie (e.g. Inception)..."
          className="w-full bg-[#1a1a24] border-2 border-white/10 rounded-2xl py-4 px-12 text-lg focus:outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/10 transition-all duration-300 placeholder:text-white/20 font-medium"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-accent transition-colors" />
        {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent animate-spin" />}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-3 bg-[#1a1a24] border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-2xl z-[100]"
        >
          {suggestions.map((item, i) => (
            <button
              key={i}
              className="w-full text-left px-5 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 font-medium text-white/80 hover:text-accent"
              onClick={() => {
                onSelect(item.title);
                setQuery(item.title);
                setShowDropdown(false);
              }}
            >
              {item.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
