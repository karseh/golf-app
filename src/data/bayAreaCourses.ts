import { Course, TeeBox, Hole } from '../types';

function createHoles(pars: number[], handicapIndexes: number[]): Hole[] {
  return pars.map((par, i) => ({
    holeNumber: i + 1,
    par,
    handicapIndex: handicapIndexes[i],
  }));
}

// Standard hole layouts
const standardPar72Pars = [4, 4, 3, 5, 4, 4, 3, 5, 4,  4, 5, 3, 4, 4, 3, 5, 4, 4];
const standardHandicapIndexes = [7, 3, 15, 1, 11, 5, 17, 9, 13,  8, 2, 16, 4, 12, 18, 10, 6, 14];

export const BAY_AREA_COURSES: Course[] = [
  // --- SAN FRANCISCO & PENINSULA ---
  {
    id: 'tpc-harding-park',
    name: 'TPC Harding Park',
    city: 'San Francisco',
    state: 'CA',
    teeBoxes: [
      {
        name: 'Black (Championship)',
        courseRating: 74.3,
        slopeRating: 135,
        par: 72,
        holes: createHoles(
          [4, 4, 3, 5, 4, 4, 3, 5, 4,  4, 5, 3, 4, 4, 3, 5, 4, 4],
          [7, 3, 15, 1, 11, 5, 17, 9, 13,  8, 2, 16, 4, 12, 18, 10, 6, 14]
        ),
      },
      {
        name: 'Blue',
        courseRating: 71.9,
        slopeRating: 129,
        par: 72,
        holes: createHoles(standardPar72Pars, standardHandicapIndexes),
      },
      {
        name: 'White',
        courseRating: 69.4,
        slopeRating: 123,
        par: 72,
        holes: createHoles(standardPar72Pars, standardHandicapIndexes),
      },
    ],
  },
  {
    id: 'presidio-golf-course',
    name: 'Presidio Golf Course',
    city: 'San Francisco',
    state: 'CA',
    teeBoxes: [
      {
        name: 'Black',
        courseRating: 72.2,
        slopeRating: 136,
        par: 72,
        holes: createHoles(
          [4, 4, 3, 5, 4, 4, 5, 3, 4,  4, 4, 3, 5, 4, 3, 4, 5, 4],
          [5, 1, 15, 11, 3, 9, 13, 17, 7,  6, 2, 16, 12, 4, 18, 8, 14, 10]
        ),
      },
      {
        name: 'Blue',
        courseRating: 70.1,
        slopeRating: 131,
        par: 72,
        holes: createHoles(standardPar72Pars, standardHandicapIndexes),
      },
    ],
  },
  {
    id: 'half-moon-bay-ocean',
    name: 'Half Moon Bay Golf Links (Ocean Course)',
    city: 'Half Moon Bay',
    state: 'CA',
    teeBoxes: [
      {
        name: 'Gold',
        courseRating: 73.1,
        slopeRating: 134,
        par: 72,
        holes: createHoles(standardPar72Pars, standardHandicapIndexes),
      },
      {
        name: 'Blue',
        courseRating: 71.0,
        slopeRating: 128,
        par: 72,
        holes: createHoles(standardPar72Pars, standardHandicapIndexes),
      },
    ],
  },

  // --- EAST BAY & LIVERMORE VALLEY ---
  {
    id: 'calippe-preserve',
    name: 'Calippe Preserve Golf Course',
    city: 'Pleasanton',
    state: 'CA',
    teeBoxes: [
      {
        name: 'Black',
        courseRating: 72.8,
        slopeRating: 137,
        par: 72,
        holes: createHoles(
          [4, 4, 5, 3, 4, 4, 3, 5, 4,  4, 3, 5, 4, 4, 3, 4, 5, 4],
          [5, 1, 11, 17, 3, 9, 15, 7, 13,  6, 18, 2, 10, 4, 16, 12, 8, 14]
        ),
      },
      {
        name: 'Blue',
        courseRating: 70.6,
        slopeRating: 131,
        par: 72,
        holes: createHoles(standardPar72Pars, standardHandicapIndexes),
      },
      {
        name: 'White',
        courseRating: 68.2,
        slopeRating: 125,
        par: 72,
        holes: createHoles(standardPar72Pars, standardHandicapIndexes),
      },
    ],
  },
  {
    id: 'wente-vineyards',
    name: 'The Course at Wente Vineyards',
    city: 'Livermore',
    state: 'CA',
    teeBoxes: [
      {
        name: 'Black',
        courseRating: 74.1,
        slopeRating: 140,
        par: 72,
        holes: createHoles(
          [4, 4, 5, 3, 4, 4, 3, 5, 4,  4, 5, 3, 4, 4, 3, 5, 4, 4],
          [3, 1, 11, 17, 7, 5, 15, 9, 13,  4, 2, 16, 10, 8, 18, 6, 12, 14]
        ),
      },
      {
        name: 'Blue',
        courseRating: 71.8,
        slopeRating: 134,
        par: 72,
        holes: createHoles(standardPar72Pars, standardHandicapIndexes),
      },
    ],
  },
  {
    id: 'poppy-ridge',
    name: 'Poppy Ridge Golf Course (Chardonnay/Zinfandel)',
    city: 'Livermore',
    state: 'CA',
    teeBoxes: [
      {
        name: 'Black',
        courseRating: 73.4,
        slopeRating: 136,
        par: 72,
        holes: createHoles(standardPar72Pars, standardHandicapIndexes),
      },
      {
        name: 'Blue',
        courseRating: 71.1,
        slopeRating: 130,
        par: 72,
        holes: createHoles(standardPar72Pars, standardHandicapIndexes),
      },
    ],
  },
  {
    id: 'the-bridges',
    name: 'The Bridges Golf Club',
    city: 'San Ramon',
    state: 'CA',
    teeBoxes: [
      {
        name: 'Black',
        courseRating: 75.2,
        slopeRating: 145,
        par: 72,
        holes: createHoles(
          [4, 4, 3, 5, 4, 3, 4, 5, 4,  4, 3, 4, 5, 4, 3, 4, 5, 4],
          [1, 3, 15, 7, 9, 17, 5, 11, 13,  2, 16, 4, 6, 8, 18, 10, 12, 14]
        ),
      },
      {
        name: 'Blue',
        courseRating: 72.6,
        slopeRating: 139,
        par: 72,
        holes: createHoles(standardPar72Pars, standardHandicapIndexes),
      },
    ],
  },
  {
    id: 'corica-park-south',
    name: 'Corica Park (South Course)',
    city: 'Alameda',
    state: 'CA',
    teeBoxes: [
      {
        name: 'Black',
        courseRating: 71.2,
        slopeRating: 125,
        par: 72,
        holes: createHoles(standardPar72Pars, standardHandicapIndexes),
      },
      {
        name: 'Blue',
        courseRating: 68.9,
        slopeRating: 120,
        par: 72,
        holes: createHoles(standardPar72Pars, standardHandicapIndexes),
      },
    ],
  },

  // --- SOUTH BAY & MORGAN HILL ---
  {
    id: 'coyote-creek-tournament',
    name: 'Coyote Creek Golf Club (Tournament Course)',
    city: 'Morgan Hill',
    state: 'CA',
    teeBoxes: [
      {
        name: 'Black (Jack Nicklaus)',
        courseRating: 74.8,
        slopeRating: 138,
        par: 72,
        holes: createHoles(
          [4, 4, 5, 3, 4, 4, 3, 5, 4,  4, 3, 5, 4, 4, 3, 5, 4, 4],
          [5, 1, 9, 17, 3, 11, 15, 7, 13,  4, 16, 2, 8, 10, 18, 6, 12, 14]
        ),
      },
      {
        name: 'Blue',
        courseRating: 72.1,
        slopeRating: 133,
        par: 72,
        holes: createHoles(standardPar72Pars, standardHandicapIndexes),
      },
      {
        name: 'White',
        courseRating: 69.8,
        slopeRating: 127,
        par: 72,
        holes: createHoles(standardPar72Pars, standardHandicapIndexes),
      },
    ],
  },
  {
    id: 'coyote-creek-valley',
    name: 'Coyote Creek Golf Club (Valley Course)',
    city: 'Morgan Hill',
    state: 'CA',
    teeBoxes: [
      {
        name: 'Black',
        courseRating: 73.6,
        slopeRating: 132,
        par: 72,
        holes: createHoles(
          [4, 4, 3, 5, 4, 4, 3, 5, 4,  4, 5, 3, 4, 4, 3, 5, 4, 4],
          [7, 1, 15, 5, 3, 11, 17, 9, 13,  6, 2, 16, 8, 10, 18, 4, 12, 14]
        ),
      },
      {
        name: 'Blue',
        courseRating: 71.2,
        slopeRating: 128,
        par: 72,
        holes: createHoles(standardPar72Pars, standardHandicapIndexes),
      },
      {
        name: 'White',
        courseRating: 68.9,
        slopeRating: 122,
        par: 72,
        holes: createHoles(standardPar72Pars, standardHandicapIndexes),
      },
    ],
  },
  {
    id: 'pasatiempo',
    name: 'Pasatiempo Golf Club',
    city: 'Santa Cruz',
    state: 'CA',
    teeBoxes: [
      {
        name: 'Championship',
        courseRating: 72.5,
        slopeRating: 141,
        par: 70,
        holes: createHoles(
          [4, 4, 3, 4, 3, 5, 4, 3, 5,  4, 4, 4, 5, 4, 3, 4, 4, 3],
          [3, 11, 15, 5, 17, 1, 9, 13, 7,  8, 4, 10, 2, 6, 16, 12, 14, 18]
        ),
      },
    ],
  },

  // --- MARIN & MONTEREY BAY ---
  {
    id: 'lincoln-park',
    name: 'Lincoln Park Golf Course',
    city: 'San Francisco',
    state: 'CA',
    teeBoxes: [
      {
        name: 'Blue',
        courseRating: 65.2,
        slopeRating: 115,
        par: 68,
        holes: createHoles(
          [4, 3, 4, 4, 3, 4, 4, 3, 4,  4, 4, 3, 4, 4, 3, 4, 3, 4],
          [9, 15, 3, 7, 17, 1, 11, 13, 5,  10, 2, 16, 6, 12, 18, 4, 14, 8]
        ),
      },
    ],
  },
  {
    id: 'peacock-gap',
    name: 'Peacock Gap Golf Club',
    city: 'San Rafael',
    state: 'CA',
    teeBoxes: [
      {
        name: 'Blue',
        courseRating: 70.8,
        slopeRating: 128,
        par: 71,
        holes: createHoles(standardPar72Pars, standardHandicapIndexes),
      },
    ],
  },
  {
    id: 'crystal-springs',
    name: 'Crystal Springs Golf Course',
    city: 'Burlingame',
    state: 'CA',
    teeBoxes: [
      {
        name: 'Blue',
        courseRating: 71.4,
        slopeRating: 129,
        par: 72,
        holes: createHoles(standardPar72Pars, standardHandicapIndexes),
      },
    ],
  },
  {
    id: 'poppy-hills',
    name: 'Poppy Hills Golf Course',
    city: 'Pebble Beach',
    state: 'CA',
    teeBoxes: [
      {
        name: 'Jones',
        courseRating: 73.5,
        slopeRating: 138,
        par: 71,
        holes: createHoles(standardPar72Pars, standardHandicapIndexes),
      },
    ],
  },
];
