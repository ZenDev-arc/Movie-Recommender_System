import React from 'react';
import { Star, Film } from 'lucide-react';
import { motion } from 'framer-motion';

const genreGradients = {
  Action: "from-red-600 to-black",
  Adventure: "from-orange-600 to-black",
  Animation: "from-blue-400 to-indigo-900",
  Comedy: "from-yellow-400 to-orange-600",
  Crime: "from-gray-700 to-black",
  Documentary: "from-emerald-600 to-gray-900",
  Drama: "from-purple-700 to-black",
  Family: "from-pink-400 to-purple-600",
  Fantasy: "from-indigo-600 to-purple-900",
  History: "from-amber-800 to-stone-900",
  Horror: "from-rose-950 to-black",
  Music: "from-cyan-500 to-blue-800",
  Mystery: "from-violet-900 to-black",
  Romance: "from-rose-500 to-pink-900",
  "Science Fiction": "from-cyan-600 to-slate-900",
  "TV Movie": "from-slate-500 to-slate-800",
  Thriller: "from-red-900 to-black",
  War: "from-olive-800 to-stone-900",
  Western: "from-orange-950 to-stone-900",
};

const MovieCard = ({ movie, onRecommend }) => {
  const gradient = genreGradients[movie.primary_genre] || "from-slate-700 to-slate-900";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -8 }}
      className="group relative overflow-hidden rounded-2xl glass movie-card-hover cursor-pointer"
      onClick={() => onRecommend(movie.title)}
    >
      {/* Premium Placeholder Image */}
      <div className={`aspect-[2/3] w-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-6 text-center relative`}>
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
        
        <Film className="w-12 h-12 text-white/20 mb-4 group-hover:scale-110 transition-transform duration-500" />
        
        <h3 className="title-font text-xl md:text-2xl font-extrabold text-white leading-tight mb-2 drop-shadow-lg">
          {movie.title}
        </h3>
        
        {/* DNA Badges */}
        {movie.dna && movie.dna.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mb-3">
            {movie.dna.map((tag, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-black uppercase tracking-widest border border-white/5 backdrop-blur-md text-white/60">
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
          <Star className="w-4 h-4 fill-current" />
          <span>{movie.vote_average.toFixed(1)}</span>
        </div>
      </div>

      {/* Info Overlay */}
      <div className="p-4 bg-[#1a1a24]/90 backdrop-blur-xl border-t border-white/5">
        <div className="flex flex-wrap gap-2 mb-3 items-center">
          <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] uppercase font-bold tracking-widest text-white/50 border border-white/10">
            {movie.primary_genre}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-accent/20 text-[9px] uppercase font-black tracking-[0.2em] text-accent border border-accent/20">
            {movie.region === "Bollywood" ? "IN" : "US"}
          </span>
        </div>
        <button 
          className="w-full py-2.5 rounded-xl bg-accent hover:bg-red-700 text-white font-bold text-sm transition-all duration-300 shadow-lg shadow-red-900/20 active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            onRecommend(movie.title);
          }}
        >
          Similar Movies
        </button>
      </div>
    </motion.div>
  );
};

export default MovieCard;
