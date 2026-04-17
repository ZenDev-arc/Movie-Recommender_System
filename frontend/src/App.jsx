import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Play, Info, Star, TrendingUp } from 'lucide-react';
import SearchBar from './components/SearchBar';
import MovieCard from './components/MovieCard';
import AdminDashboard from './components/AdminDashboard';

const genreGradients = {
  Action: "from-red-600 to-[#0a0a0f]",
  Adventure: "from-orange-600 to-[#0a0a0f]",
  Animation: "from-blue-400 to-[#0a0a0f]",
  Comedy: "from-yellow-400 to-[#0a0a0f]",
  Crime: "from-gray-700 to-[#0a0a0f]",
  Documentary: "from-emerald-600 to-[#0a0a0f]",
  Drama: "from-purple-700 to-[#0a0a0f]",
  Family: "from-pink-400 to-[#0a0a0f]",
  Fantasy: "from-indigo-600 to-[#0a0a0f]",
  History: "from-amber-800 to-[#0a0a0f]",
  Horror: "from-rose-950 to-[#0a0a0f]",
  Music: "from-cyan-500 to-[#0a0a0f]",
  Mystery: "from-violet-900 to-[#0a0a0f]",
  Romance: "from-rose-500 to-[#0a0a0f]",
  "Science Fiction": "from-cyan-600 to-[#0a0a0f]",
  "TV Movie": "from-slate-500 to-[#0a0a0f]",
  Thriller: "from-red-900 to-[#0a0a0f]",
  War: "from-olive-800 to-[#0a0a0f]",
  Western: "from-orange-950 to-[#0a0a0f]",
};

const raw_api_url = import.meta.env.VITE_API_URL || "http://localhost:8001";
// Safety: Remove trailing slash if user accidentally added one in Vercel settings
const API_BASE_URL = raw_api_url.endsWith('/') ? raw_api_url.slice(0, -1) : raw_api_url;

console.log("--- System Connection Diagnostic ---");
console.log("Target API Base:", API_BASE_URL);
console.log("Environment State:", import.meta.env.MODE);
console.log("------------------------------------");

function App() {
  const [isAdmin, setIsAdmin] = useState(window.location.pathname === '/system-portal');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [trending, setTrending] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [hiddenGems, setHiddenGems] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [moods, setMoods] = useState([]);
  const [genres, setGenres] = useState([]);
  const [region, setRegion] = useState("Global");
  const [loading, setLoading] = useState(false);
  const [mashupMovies, setMashupMovies] = useState([null, null]);
  const [decade, setDecade] = useState(2020);
  const [activeMood, setActiveMood] = useState("");

  const fetchInitialData = async (currentRegion) => {
    setLoading(true);
    try {
      const r = currentRegion === "Global" ? "All" : currentRegion;
      const [trendRes, topRes, gemRes, moodRes, genRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/trending?region=${r}`),
        axios.get(`${API_BASE_URL}/top-rated?region=${r}`),
        axios.get(`${API_BASE_URL}/hidden-gems?region=${r}`),
        axios.get(`${API_BASE_URL}/moods`),
        axios.get(`${API_BASE_URL}/genres`)
      ]);
      setTrending(trendRes.data);
      setTopRated(topRes.data);
      setHiddenGems(gemRes.data);
      setMoods(moodRes.data);
      setGenres(genRes.data);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedWatchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    setWatchlist(savedWatchlist);
    fetchInitialData(region);
  }, [region]);

  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const toggleWatchlist = (movie) => {
    const isSaved = watchlist.some(m => m.movie_id === movie.movie_id);
    if (isSaved) {
      setWatchlist(watchlist.filter(m => m.movie_id !== movie.movie_id));
    } else {
      setWatchlist([movie, ...watchlist]);
    }
  };

  const fetchRecommendations = async (title) => {
    setLoading(true);
    try {
      const movieResponse = await axios.get(`${API_BASE_URL}/movie?title=${encodeURIComponent(title)}`);
      setSelectedMovie(movieResponse.data);

      const recResponse = await axios.get(`${API_BASE_URL}/recommend?title=${encodeURIComponent(title)}`);
      setRecommendations(recResponse.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Error fetching:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchByMood = async (vibe) => {
    setLoading(true);
    setActiveMood(vibe);
    try {
      const r = region === "Global" ? "All" : region;
      const res = await axios.get(`${API_BASE_URL}/mood?vibe=${vibe}&region=${r}`);
      setTrending(res.data);
    } catch (error) {
      console.error("Error fetching mood:", error);
    } finally {
      setLoading(false);
    }
  };

  const runRoulette = async () => {
    setLoading(true);
    try {
      const r = region === "Global" ? "All" : region;
      const res = await axios.get(`${API_BASE_URL}/random?region=${r}`);
      fetchRecommendations(res.data.title);
    } catch (error) {
      console.error("Error in roulette:", error);
    } finally {
      setLoading(false);
    }
  };

  const runMashup = async () => {
    if (!mashupMovies[0] || !mashupMovies[1]) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/mashup?t1=${mashupMovies[0]}&t2=${mashupMovies[1]}`);
      setRecommendations(res.data);
      setSelectedMovie({
        title: `Mashup: ${mashupMovies[0]} & ${mashupMovies[1]}`,
        tagline: "The perfect cinematic fusion.",
        overview_text: "We've blended the DNA of your chosen films to find the ideal match across regions.",
        primary_genre: "Science Fiction",
        vote_average: 8.5,
        popularity: 1000,
        runtime: 120,
        release_date: "2024-03-31",
        region: "Global",
        vote_count: 9999
      });
    } catch (error) {
      console.error("Error in mashup:", error);
    } finally {
      setLoading(false);
    }
  };

  const backdropGradient = selectedMovie 
    ? (genreGradients[selectedMovie.primary_genre] || "from-slate-900 to-[#0a0a0f]")
    : "from-slate-900 to-[#0a0a0f]";

  const formatRuntime = (minutes) => {
    if (!minutes) return "N/A";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const getYear = (dateStr) => dateStr ? dateStr.toString().split('-')[0] : 'N/A';

  const filteredMovies = (movieList) => {
    return movieList.filter(m => {
      const year = parseInt(getYear(m.release_date));
      return year >= decade && year < decade + 10;
    });
  };

  if (isAdmin) return <AdminDashboard />;

  return (
    <div className="min-h-screen w-full font-sans pb-20 overflow-x-hidden">
      <div className={`fixed inset-0 bg-gradient-to-b ${backdropGradient} opacity-30 transition-all duration-1000 -z-10`} />

      <header className="pt-12 pb-8 px-6 text-center relative z-50">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-10">
           <motion.div
             initial={{ opacity: 0, y: -20 }}
             animate={{ opacity: 1, y: 0 }}
             className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-2 rounded-full backdrop-blur-xl cursor-pointer hover:bg-white/10 transition-colors"
             onClick={() => { setSelectedMovie(null); setActiveMood(""); }}
           >
             <Film className="w-5 h-5 text-accent" />
             <h1 className="text-xl font-bold tracking-tight uppercase title-font">CineMatch AI</h1>
           </motion.div>

           {/* Region Switcher */}
           <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-xl ring-1 ring-white/5">
              {["Global", "Hollywood", "Bollywood"].map(r => (
                <button
                  key={r}
                  onClick={() => setRegion(r)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${region === r ? 'bg-white text-black shadow-xl scale-105' : 'text-white/40 hover:text-white'}`}
                >
                  {r}
                </button>
              ))}
           </div>
        </div>
        
        <div className="mb-10">
          <h2 className="text-4xl md:text-6xl font-black mb-4 title-font tracking-tight leading-tight max-w-4xl mx-auto">
            Find Your Next <span className="text-white/40 italic">{region}</span> Masterpiece
          </h2>
          <SearchBar onSelect={fetchRecommendations} region={region === "Global" ? "All" : region} />
          
          <div className="mt-8 flex flex-wrap justify-center items-center gap-6 max-w-5xl mx-auto bg-white/5 p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
             <div className="flex gap-2">
                {moods.map(m => (
                  <button 
                    key={m}
                    onClick={() => fetchByMood(m)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeMood === m ? 'bg-accent border-accent text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
                  >
                    {m}
                  </button>
                ))}
             </div>
             <div className="h-8 w-px bg-white/10" />
             <div className="flex items-center gap-3 px-4 py-1.5 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Time Machine:</span>
                <input 
                  type="range" min="1950" max="2020" step="10" 
                  value={decade} 
                  onChange={(e) => setDecade(parseInt(e.target.value))}
                  className="w-32 accent-accent cursor-pointer"
                />
                <span className="text-xs font-black text-white/60 w-12">{decade}s</span>
             </div>
             <div className="h-8 w-px bg-white/10" />
             <button 
               onClick={runRoulette}
               className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600/40 to-blue-600/40 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
             >
               🎰 Surprise Me
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-12">
        <AnimatePresence mode="wait">
          {selectedMovie ? (
            <motion.section
              key={selectedMovie.movie_id || 'mashup'}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-24"
            >
              <div className="relative rounded-[3rem] overflow-hidden glass p-8 md:p-14 lg:p-20 flex flex-col lg:flex-row gap-16 items-center border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)]">
                <div className={`absolute inset-0 bg-gradient-to-br ${genreGradients[selectedMovie.primary_genre]} opacity-20 -z-10`} />
                <div className="absolute inset-0 bg-black/70 -z-10 blur-xl scale-125" />

                <div className="w-full lg:w-[450px] aspect-[2/3] rounded-[2.5rem] glass flex flex-col items-center justify-center p-12 text-center ring-1 ring-white/10 group relative transition-all duration-700 hover:ring-accent/20">
                   <div className={`absolute inset-0 bg-gradient-to-br ${genreGradients[selectedMovie.primary_genre]} opacity-30 blur-[100px] -z-10`} />
                   <Film className="w-24 h-24 text-white/5 mb-8 group-hover:rotate-12 transition-transform duration-1000" />
                   <h1 className="title-font text-4xl lg:text-5xl font-black leading-none mb-10 drop-shadow-2xl">{selectedMovie.title}</h1>
                   
                   <div className="mt-auto flex items-center gap-6">
                      <div className="flex items-center gap-2 text-yellow-500 font-black bg-black/40 px-6 py-3 rounded-2xl border border-white/5 shadow-xl">
                        <Star className="w-6 h-6 fill-current" />
                        <span className="text-2xl">{selectedMovie.vote_average.toFixed(1)}</span>
                      </div>
                      <button 
                         onClick={() => toggleWatchlist(selectedMovie)}
                         className={`p-4 rounded-2xl border backdrop-blur-xl transition-all ${watchlist.some(m => m.movie_id === selectedMovie.movie_id) ? 'bg-accent/20 border-accent text-accent' : 'bg-white/5 border-white/10 text-white/30 hover:text-white'}`}
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill={watchlist.some(m => m.movie_id === selectedMovie.movie_id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      </button>
                   </div>
                </div>

                <div className="flex-1 w-full text-center lg:text-left">
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-8">
                    <span className="px-5 py-2 rounded-2xl bg-accent text-white font-black text-[10px] tracking-[0.3em] uppercase shadow-2xl shadow-red-900/50">MATCH DNA</span>
                    <span className="px-5 py-2 rounded-2xl bg-white/5 text-white/50 font-black text-[10px] tracking-[0.3em] uppercase border border-white/10">{selectedMovie.primary_genre}</span>
                  </div>

                  <h2 className="text-6xl lg:text-9xl font-black mb-6 title-font leading-[0.9] tracking-tighter drop-shadow-2xl">{selectedMovie.title}</h2>
                  
                  {selectedMovie.tagline && (
                    <p className="text-3xl font-medium text-white/40 mb-10 italic font-serif leading-relaxed">"{selectedMovie.tagline}"</p>
                  )}

                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-10 mb-12 text-white/40 font-black text-xs uppercase tracking-[0.3em]">
                     {[
                       { label: 'Released', v: getYear(selectedMovie.release_date) },
                       { label: 'MetaScore', v: Math.round(selectedMovie.popularity / 10) },
                       { label: 'Length', v: formatRuntime(selectedMovie.runtime) }
                     ].map((s, i) => (
                       <div key={i} className="flex flex-col gap-2">
                          <span className="text-[10px] text-accent font-black tracking-widest">{s.label}</span>
                          <span className="text-xl text-white">{s.v}</span>
                       </div>
                     ))}
                  </div>

                  <p className="text-xl text-white/70 leading-relaxed max-w-2xl mb-14 border-l-4 border-accent/20 pl-8">{selectedMovie.overview_text}</p>

                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6">
                     <button className="flex items-center gap-4 bg-white text-black px-12 py-6 rounded-3xl font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-2xl">
                        <Play className="w-6 h-6 fill-current" /> STREAM NOW
                     </button>
                  </div>
                </div>
              </div>

              {/* Mashup Lab */}
              <div className="mt-32 p-12 glass rounded-[3rem] border border-white/5 bg-gradient-to-r from-indigo-950/20 to-purple-950/20">
                 <div className="flex flex-col lg:flex-row items-center gap-12">
                    <div className="lg:w-1/3">
                       <h3 className="text-3xl font-black title-font mb-4">🧪 Discovery Lab</h3>
                       <p className="text-white/40 font-medium">Add two movies to create a mathematical "Cinematic Mashup".</p>
                    </div>
                    <div className="flex-1 flex flex-col md:flex-row items-center gap-6 w-full">
                       {[0, 1].map(i => (
                         <div key={i} className="flex-1 w-full relative">
                            <input 
                              placeholder="Add movie title..."
                              className="w-full bg-black/40 border-2 border-white/5 rounded-2xl p-6 font-bold text-white focus:border-cyan-400/40 transition-all"
                              onBlur={(e) => {
                                 const newM = [...mashupMovies];
                                 newM[i] = e.target.value;
                                 setMashupMovies(newM);
                              }}
                            />
                         </div>
                       ))}
                       <button 
                         onClick={runMashup}
                         className="bg-cyan-500 hover:bg-cyan-400 text-black px-10 py-6 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-105"
                       >FUSE</button>
                    </div>
                 </div>
              </div>

              <section className="mt-32">
                <div className="flex items-center gap-8 mb-16">
                   <h2 className="text-5xl font-black title-font tracking-tighter">Your Match Grid</h2>
                   <div className="h-px flex-1 bg-white/5" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12">
                  {recommendations.map((movie) => (
                    <MovieCard key={movie.movie_id} movie={movie} onRecommend={fetchRecommendations} />
                  ))}
                </div>
              </section>
            </motion.section>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-40 py-20">
              {watchlist.length > 0 && <MovieRow title="❤️ Your Watchlist" movies={watchlist} onSelect={fetchRecommendations} />}
              <MovieRow 
                title={activeMood ? `Mood: ${activeMood} in the ${decade}s` : `📈 Trending in the ${decade}s`} 
                movies={filteredMovies(trending)} 
                onSelect={fetchRecommendations} 
              />
              <MovieRow title={`💎 Hidden Gems (${decade}s)`} movies={filteredMovies(hiddenGems)} onSelect={fetchRecommendations} />
              <MovieRow title={`🏆 Top Rated (${decade}s)`} movies={filteredMovies(topRated)} onSelect={fetchRecommendations} />
            </motion.div>
          )}

          {loading && (
             <div className="fixed inset-0 bg-[#0a0a0f]/80 backdrop-blur-3xl z-[100] flex flex-col items-center justify-center">
                <Loader2 className="w-16 h-16 text-accent animate-spin mb-8" />
                <p className="text-white/40 font-black uppercase tracking-[0.3em] text-sm animate-pulse">Running Recommendation Engine...</p>
             </div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-60 border-t border-white/5 py-24 px-6 text-center">
         <div className="flex items-center justify-center gap-4 mb-6 opacity-30">
            <div className="h-px w-20 bg-white" />
            <Film className="w-6 h-6" />
            <div className="h-px w-20 bg-white" />
         </div>
         <p className="text-white/10 text-sm font-bold tracking-[0.5em] uppercase mb-4">
            CineMatch AI Pro
         </p>
         <p className="text-white/20 text-xs font-medium max-w-md mx-auto">
            Advanced content-based filtering algorithm extracting signal from 5,000+ movie metadata points.
         </p>
      </footer>
    </div>
  );
}

const MovieRow = ({ title, movies, onSelect }) => (
  <section className="relative">
    <div className="flex items-center justify-between mb-8">
      <h3 className="text-2xl md:text-3xl font-black title-font tracking-tight">{title}</h3>
      <div className="h-px flex-1 mx-8 bg-white/5" />
    </div>
    
    <div className="flex overflow-x-auto gap-6 pb-8 scrollbar-hide -mx-2 px-2 mask-linear">
      {movies.map((movie) => (
        <button
          key={movie.movie_id}
          onClick={() => onSelect(movie.title)}
          className="flex-none w-48 md:w-64 group text-left transition-transform duration-500 hover:scale-[1.03]"
        >
          <div className={`aspect-[2/3] rounded-2xl bg-gradient-to-br ${genreGradients[movie.primary_genre] || "from-slate-700 to-slate-900"} mb-4 relative overflow-hidden shadow-xl ring-1 ring-white/5`}>
             <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-500" />
             <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <Film className="w-8 h-8 text-white/5 mb-3 group-hover:scale-110 transition-transform duration-500" />
                <span className="text-center font-bold text-sm md:text-base leading-tight drop-shadow-lg opacity-80 group-hover:opacity-100 transition-opacity">
                  {movie.title}
                </span>
             </div>
             <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold text-yellow-500 border border-white/5">
                <Star className="w-3 h-3 fill-current" />
                <span>{movie.vote_average.toFixed(1)}</span>
             </div>
          </div>
          <h4 className="font-bold text-sm md:text-base text-white/80 group-hover:text-accent transition-colors truncate px-1">
            {movie.title}
          </h4>
          <p className="text-[10px] uppercase tracking-widest font-black text-white/30 mt-1 px-1">
            {movie.primary_genre}
          </p>
        </button>
      ))}
    </div>
  </section>
);

const Loader2 = ({ className }) => (
  <svg 
    className={className} 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
)

export default App;
