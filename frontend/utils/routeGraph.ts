/**
 * ROUTE GRAPH UTILITY
 * This utility simulates the geographical road network of Romania.
 * Essential for the "Travel Corridor" feature.
 */

const COUNTY_ADJACENCY: { [key: string]: string[] } = {
  Alba: ["Cluj", "Bihor", "Arad", "Hunedoara", "Sibiu", "Mureș", "Vâlcea"],
  Arad: ["Bihor", "Alba", "Hunedoara", "Timiș"],
  Argeș: ["Sibiu", "Vâlcea", "Olt", "Teleorman", "Dâmbovița", "Brașov"],
  Bacău: ["Neamț", "Vaslui", "Vrancea", "Covasna", "Harghita"],
  Bihor: ["Satu Mare", "Sălaj", "Cluj", "Alba", "Arad"],
  "Bistrița-Năsăud": ["Maramureș", "Suceava", "Mureș", "Cluj"],
  Botoșani: ["Suceava", "Iași"],
  Brașov: [
    "Mureș",
    "Harghita",
    "Covasna",
    "Buzău",
    "Prahova",
    "Dâmbovița",
    "Argeș",
    "Sibiu",
  ],
  Brăila: ["Galați", "Tulcea", "Constanța", "Ialomița", "Buzău", "Vrancea"],
  București: ["Ilfov"],
  Buzău: ["Vrancea", "Brăila", "Ialomița", "Prahova", "Brașov", "Covasna"],
  "Caraș-Severin": ["Timiș", "Hunedoara", "Gorj", "Mehedinți"],
  Călărași: ["Ilfov", "Ialomița", "Constanța", "Giurgiu"],
  Cluj: ["Sălaj", "Maramureș", "Bistrița-Năsăud", "Mureș", "Alba", "Bihor"],
  Constanța: ["Tulcea", "Brăila", "Ialomița", "Călărași"],
  Covasna: ["Harghita", "Bacău", "Vrancea", "Buzău", "Brașov"],
  Dâmbovița: ["Brașov", "Prahova", "Ilfov", "Giurgiu", "Teleorman", "Argeș"],
  Dolj: ["Mehedinți", "Gorj", "Vâlcea", "Olt"],
  Galați: ["Vaslui", "Vrancea", "Brăila", "Tulcea"],
  Giurgiu: ["Teleorman", "Dâmbovița", "Ilfov", "Călărași"],
  Gorj: ["Mehedinți", "Caraș-Severin", "Hunedoara", "Vâlcea", "Dolj"],
  Harghita: ["Suceava", "Neamț", "Bacău", "Covasna", "Brașov", "Mureș"],
  Hunedoara: [
    "Arad",
    "Bihor",
    "Alba",
    "Vâlcea",
    "Gorj",
    "Caraș-Severin",
    "Timiș",
  ],
  Ialomița: ["Brăila", "Constanța", "Călărași", "Ilfov", "Prahova", "Buzău"],
  Iași: ["Botoșani", "Suceava", "Neamț", "Vaslui"],
  Ilfov: [
    "Prahova",
    "Ialomița",
    "Călărași",
    "Giurgiu",
    "Dâmbovița",
    "București",
  ],
  Maramureș: ["Satu Mare", "Sălaj", "Cluj", "Bistrița-Năsăud", "Suceava"],
  Mehedinți: ["Caraș-Severin", "Gorj", "Dolj"],
  Mureș: [
    "Bistrița-Năsăud",
    "Suceava",
    "Harghita",
    "Brașov",
    "Sibiu",
    "Alba",
    "Cluj",
  ],
  Neamț: ["Suceava", "Iași", "Bacău", "Harghita", "Vaslui"],
  Olt: ["Vâlcea", "Argeș", "Teleorman", "Dolj"],
  Prahova: ["Brașov", "Buzău", "Ialomița", "Ilfov", "Dâmbovița"],
  "Satu Mare": ["Maramureș", "Sălaj", "Bihor"],
  Sălaj: ["Satu Mare", "Maramureș", "Cluj", "Bihor"],
  Sibiu: ["Mureș", "Brașov", "Argeș", "Vâlcea", "Alba"],
  Suceava: [
    "Botoșani",
    "Iași",
    "Neamț",
    "Harghita",
    "Mureș",
    "Bistrița-Năsăud",
    "Maramureș",
  ],
  Teleorman: ["Olt", "Argeș", "Dâmbovița", "Giurgiu"],
  Timiș: ["Arad", "Hunedoara", "Caraș-Severin"],
  Tulcea: ["Galați", "Brăila", "Constanța"],
  Vaslui: ["Iași", "Neamț", "Bacău", "Galați"],
  Vâlcea: ["Sibiu", "Argeș", "Olt", "Dolj", "Gorj", "Hunedoara", "Alba"],
  Vrancea: ["Bacău", "Vaslui", "Galați", "Brăila", "Buzău", "Covasna"],
};

/**
 * BFS (Breadth-First Search) Algorithm
 * Finds the shortest path between two counties.
 */
export const getCountiesOnRoute = (start: string, end: string): string[] => {
  if (!start || !end) return [];

  const s = start.trim();
  const e = end.trim();

  if (s === e) return [s];

  // Validation
  if (!COUNTY_ADJACENCY[s] || !COUNTY_ADJACENCY[e]) {
    console.warn(
      `RouteGraph: One of the counties (${s} or ${e}) is not in the adjacency list.`,
    );
    return [s, e];
  }

  const queue: string[][] = [[s]];
  const visited = new Set<string>();
  visited.add(s);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const node = path[path.length - 1];

    if (node === e) {
      return path;
    }

    const neighbors = COUNTY_ADJACENCY[node] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }

  return [s, e];
};
