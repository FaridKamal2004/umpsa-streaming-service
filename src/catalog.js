export const catalog = Object.freeze([
  { id: 'sintel', title: 'Sintel', year: 2010, genre: 'Fantasy', minutes: 15, director: 'Colin Levy', color: '#af6950', motif: 'mountain', video: 'https://archive.org/download/Sintel/sintel-2048-stereo_512kb.mp4', description: 'A young traveler crosses a frozen wilderness to find the dragon she once called a friend.', credit: '© Blender Foundation | durian.blender.org', source: 'https://durian.blender.org/', license: 'CC BY 3.0' },
  { id: 'bunny', title: 'Big Buck Bunny', year: 2008, genre: 'Animation', minutes: 10, director: 'Sacha Goedegebure', color: '#709d69', motif: 'sun', video: 'https://archive.org/download/BigBuckBunny1280x720Stereo/big_buck_bunny_720_stereo.mp4', description: 'A gentle giant has his peaceful afternoon interrupted by three mischievous woodland creatures.', credit: '© 2008 Blender Foundation | www.bigbuckbunny.org', source: 'https://peach.blender.org/about/', license: 'CC BY 3.0' },
  { id: 'steel', title: 'Tears of Steel', year: 2012, genre: 'Sci-fi', minutes: 12, director: 'Ian Hubert', color: '#589caa', motif: 'city', video: 'https://archive.org/download/Tears-of-Steel/tears_of_steel_720p.mp4', description: 'In a future Amsterdam, a team of scientists and fighters attempts to save the world from destructive robots.', credit: '© Blender Foundation | mango.blender.org', source: 'https://mango.blender.org/about/', license: 'CC BY 3.0' },
  { id: 'dream', title: 'Elephants Dream', year: 2006, genre: 'Sci-fi', minutes: 11, director: 'Bassam Kurdali', color: '#9784b6', motif: 'orbit', video: 'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4', description: 'Two explorers navigate a strange mechanical world, where imagination changes the path ahead.', credit: '© Blender Foundation / Netherlands Media Art Institute', source: 'https://orange.blender.org/', license: 'CC BY 2.5' }
].map(movie => Object.freeze(movie)));

export function selectMovies(movies, { query = '', genre = 'All', sort = 'curated', ids = null } = {}) {
  const term = query.trim().toLocaleLowerCase();
  const result = movies.filter(movie => (!ids || ids.includes(movie.id)) &&
    (genre === 'All' || movie.genre === genre) &&
    `${movie.title} ${movie.director} ${movie.genre} ${movie.description}`.toLocaleLowerCase().includes(term));
  if (sort === 'newest') result.sort((a, b) => b.year - a.year);
  if (sort === 'shortest') result.sort((a, b) => a.minutes - b.minutes);
  if (sort === 'title') result.sort((a, b) => a.title.localeCompare(b.title));
  return result;
}

export function recommend(movies, saved, progress) {
  const genres = new Set(movies.filter(m => saved.includes(m.id) || progress[m.id]?.seconds > 0).map(m => m.genre));
  return [...movies].sort((a, b) => Number(genres.has(b.genre)) - Number(genres.has(a.genre)));
}
