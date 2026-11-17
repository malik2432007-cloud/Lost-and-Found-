// Rule-based matching: find potential matches for a lost item among found items (or vice versa)
export const findPotentialMatches = (targetItem, allItems) => {
  if (!targetItem || !allItems) return [];

  const oppositeType = targetItem.type === 'lost' ? 'found' : 'lost';
  const candidates = allItems.filter(
    (item) => item.type === oppositeType && item.status === 'active' && item.id !== targetItem.id
  );

  const scored = candidates.map((item) => {
    let score = 0;

    // Category match (high weight)
    if (item.category === targetItem.category) score += 40;

    // Title word match
    const targetWords = (targetItem.title || '').toLowerCase().split(/\s+/);
    const itemWords = (item.title || '').toLowerCase().split(/\s+/);
    const commonWords = targetWords.filter(w => w.length > 2 && itemWords.includes(w));
    score += commonWords.length * 10;

    // Location match
    if (item.location && targetItem.location && item.location === targetItem.location) score += 20;

    // Color match
    if (item.color && targetItem.color &&
        item.color.toLowerCase() === targetItem.color.toLowerCase()) score += 15;

    // Brand match
    if (item.brand && targetItem.brand &&
        item.brand.toLowerCase() === targetItem.brand.toLowerCase()) score += 15;

    // Date proximity (within 7 days)
    if (item.date && targetItem.date) {
      const diff = Math.abs(new Date(item.date) - new Date(targetItem.date));
      const days = diff / (1000 * 60 * 60 * 24);
      if (days <= 3) score += 10;
      else if (days <= 7) score += 5;
    }

    return { ...item, matchScore: score };
  });

  return scored
    .filter(item => item.matchScore >= 30)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 4);
};
