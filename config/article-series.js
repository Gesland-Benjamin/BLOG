// Editorial grouping of existing public URLs; no database migration or content rewrite.
export const articleSeries = Object.freeze([
  {
    title: 'Bienvenue dans mon univers',
    slugs: [
      'bienvenue-chez-moi-31',
      'bienvenue-dans-mon-salon-30',
      'bienvenue-dans-mon-bureau-24',
      'bienvenue-dans-ma-cuisine-29',
      'bienvenue-au-comptoir-de-mon-bar-28',
      'bienvenue-dans-ma-chambre-25',
      'bienvenue-dans-mon-dressing-26',
      'bienvenue-dans-ma-salle-de-bain-27',
      'bienvenue-dans-ma-game-room-23',
      'bienvenue-dans-mon-jardin-22'
    ]
  }
]);
export function seriesForArticle(slug) {
  return articleSeries.filter(series => series.slugs.includes(slug));
}
