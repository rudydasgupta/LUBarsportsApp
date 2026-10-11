/**
 * The 2025/26 fixture order: a double round robin of the nine colleges over
 * weeks 2–9 and 11–20 (week 10 has no matches), four matches a week, one
 * college resting. New seasons are generated from this, optionally with home
 * and away swapped. Originally prisma/fixtures.csv.
 */
export const FIXTURE_TEMPLATE: readonly { week: number; matches: readonly (readonly [home: string, away: string])[] }[] = [
  {
    week: 2,
    matches: [
      ["County", "Furness"],
      ["Grizedale", "Fylde"],
      ["Lonsdale", "Cartmel"],
      ["Pendle", "Bowland"],
    ],
  },
  {
    week: 3,
    matches: [
      ["Bowland", "Grizedale"],
      ["Cartmel", "Pendle"],
      ["Graduate", "Lonsdale"],
      ["Fylde", "County"],
    ],
  },
  {
    week: 4,
    matches: [
      ["County", "Bowland"],
      ["Furness", "Fylde"],
      ["Grizedale", "Cartmel"],
      ["Pendle", "Graduate"],
    ],
  },
  {
    week: 5,
    matches: [
      ["Bowland", "Furness"],
      ["Cartmel", "County"],
      ["Graduate", "Grizedale"],
      ["Lonsdale", "Pendle"],
    ],
  },
  {
    week: 6,
    matches: [
      ["County", "Graduate"],
      ["Furness", "Cartmel"],
      ["Fylde", "Bowland"],
      ["Grizedale", "Lonsdale"],
    ],
  },
  {
    week: 7,
    matches: [
      ["Cartmel", "Fylde"],
      ["Graduate", "Furness"],
      ["Lonsdale", "County"],
      ["Pendle", "Grizedale"],
    ],
  },
  {
    week: 8,
    matches: [
      ["Bowland", "Cartmel"],
      ["County", "Pendle"],
      ["Furness", "Lonsdale"],
      ["Fylde", "Graduate"],
    ],
  },
  {
    week: 9,
    matches: [
      ["Graduate", "Bowland"],
      ["Grizedale", "County"],
      ["Lonsdale", "Fylde"],
      ["Pendle", "Furness"],
    ],
  },
  {
    week: 11,
    matches: [
      ["Bowland", "Lonsdale"],
      ["Graduate", "Cartmel"],
      ["Furness", "Grizedale"],
      ["Fylde", "Pendle"],
    ],
  },
  {
    week: 12,
    matches: [
      ["Bowland", "Pendle"],
      ["Cartmel", "Lonsdale"],
      ["Furness", "County"],
      ["Fylde", "Grizedale"],
    ],
  },
  {
    week: 13,
    matches: [
      ["County", "Fylde"],
      ["Grizedale", "Bowland"],
      ["Lonsdale", "Graduate"],
      ["Pendle", "Cartmel"],
    ],
  },
  {
    week: 14,
    matches: [
      ["Bowland", "County"],
      ["Cartmel", "Grizedale"],
      ["Fylde", "Furness"],
      ["Graduate", "Pendle"],
    ],
  },
  {
    week: 15,
    matches: [
      ["County", "Cartmel"],
      ["Furness", "Bowland"],
      ["Grizedale", "Graduate"],
      ["Pendle", "Lonsdale"],
    ],
  },
  {
    week: 16,
    matches: [
      ["Bowland", "Fylde"],
      ["Cartmel", "Furness"],
      ["Graduate", "County"],
      ["Lonsdale", "Grizedale"],
    ],
  },
  {
    week: 17,
    matches: [
      ["County", "Lonsdale"],
      ["Furness", "Graduate"],
      ["Fylde", "Cartmel"],
      ["Grizedale", "Pendle"],
    ],
  },
  {
    week: 18,
    matches: [
      ["Cartmel", "Bowland"],
      ["Graduate", "Fylde"],
      ["Lonsdale", "Furness"],
      ["Pendle", "County"],
    ],
  },
  {
    week: 19,
    matches: [
      ["Bowland", "Graduate"],
      ["County", "Grizedale"],
      ["Furness", "Pendle"],
      ["Fylde", "Lonsdale"],
    ],
  },
  {
    week: 20,
    matches: [
      ["Cartmel", "Graduate"],
      ["Grizedale", "Furness"],
      ["Lonsdale", "Bowland"],
      ["Pendle", "Fylde"],
    ],
  },
];
