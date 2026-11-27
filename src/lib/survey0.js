/**
 * Cleaning for static/survey_0.csv (our own "places to socialize" survey).
 *
 * Rules:
 * - Columns whose label contains "(2)" are ignored for now.
 * - Multi-select answers ("4,5_-_Very_connected") keep only the first value.
 * - "Other - What type of place is this?" free text is ignored. Place types are grouped into
 *   Third Places (cafés, bars, parks, gyms, clubs, ...) and "Not a Third Place" (home, school or
 *   work, library), using the place name where it decides it (TYPE_GROUP, NAME_GROUP).
 * - x / y are the longitude / latitude of the place named in the "(1)" columns.
 * - Coded categories (Less_than_3, 36_or_greater, ...) are turned into readable labels,
 *   in the order implied by the column title.
 */
import { timeParse } from 'd3';

/** Exact CSV header for each field we use. */
export const COLUMNS = {
	id: 'ObjectID',
	loneliness: 'How lonely do you feel? (0 - not at all, 10 - absolutely)',
	placeName: 'What is the name of your favorite place to socialize? (1)',
	hours: 'How many hours weekly do you spend here? (1)',
	created: 'CreationDate',
	age: 'What is your age?',
	mentalHealth: 'In general, how would you rate your mental health?',
	hasPlace: 'Do you have a place you regularly go to socialize, outside of home, school, and work?',
	connection: 'How connected do you feel to the people at this place? (1)',
	placeType: 'What type of place is this? (1)',
	x: 'x',
	y: 'y'
};

const parseDate = timeParse('%m/%d/%Y %I:%M:%S %p');

/** @param {string | undefined} v */
const first = (v) => (v ?? '').split(',')[0].trim();

const HOURS = {
	Less_than_3: 'Less than 3 hours',
	'3-5': '3–5 hours',
	'5-8': '5–8 hours',
	Greater_than_8: 'More than 8 hours'
};
const AGE = { '18-25': '18–25', '26-35': '26–35', '36_or_greater': '36 or older' };
export const MENTAL = { Excellent: 'Excellent', Very_good: 'Very good', Good: 'Good', Fair: 'Fair', Poor: 'Poor' };
const PLACE_TYPE = {
	'Campus_space_(lounge_study_spac': 'Campus space (lounge, study space)',
	'Café_or_restaurant': 'Café or restaurant',
	Club_cultural_or_community_grou: 'Club, cultural or community group',
	Gym_or_recreation_centre: 'Gym or recreation centre',
	Library: 'Library',
	Park_or_outdoor_space: 'Park or outdoor space',
	Religious_or_spiritual_space: 'Religious or spiritual space',
	other: 'Other'
};

/** Group for every place that is not a Third Place (home, school or work, library, no place). */
export const NOT_THIRD = 'Not a Third Place';

/**
 * Third Place groups. A Third Place (Oldenburg) is a place outside home (the first place) and
 * school or work (the second) where people go to socialize and connect with their community,
 * not to study or work: cafés, bars, parks, gyms, clubs, places of worship, student lounges.
 * Each survey place type maps to a group; places named below override that.
 */
const TYPE_GROUP = {
	'Campus space (lounge, study space)': 'Campus social space',
	'Café or restaurant': 'Pub, bar, café',
	'Club, cultural or community group': 'Club or community group',
	'Gym or recreation centre': 'Gym or rec centre',
	Library: NOT_THIRD, // a place to study
	'Park or outdoor space': 'Park or outdoors',
	'Religious or spiritual space': 'Religious space',
	Other: NOT_THIRD
};
/**
 * Recoding by place name (lower-cased, trimmed), for "Other" answers and for places whose ticked
 * type doesn't fit the name.
 * @type {Record<string, string>}
 */
const NAME_GROUP = {
	cafe: 'Pub, bar, café', // was ticked as "Library"
	'madison pub': 'Pub, bar, café',
	'the bar': 'Pub, bar, café',
	'friends houses': "Friend's place",
	'friends’ place': "Friend's place",
	"friends' place": "Friend's place",
	'cool events': 'Events',
	'world of warcraft': 'Online gaming', // online games as "virtual third places"
	// Not Third Places: the student's own home, school buildings, no place at all
	home: NOT_THIRD,
	'my house': NOT_THIRD,
	school: NOT_THIRD,
	'bahen centre of information of technology': NOT_THIRD, // academic building
	no: NOT_THIRD // said they have no such place
};
/** Place names shortened for display (lower-cased original → new name). @type {Record<string, string>} */
const NAME_SHORT = {
	'not exactly, but i just go to cool events when i get the chance, there so much opportunities around': 'Cool events'
};
/** All place groups in display order: Third Places first, then everything else. */
export const PLACE_TYPES = [
	'Campus social space',
	'Pub, bar, café',
	"Friend's place",
	'Gym or rec centre',
	'Park or outdoors',
	'Club or community group',
	'Religious space',
	'Events',
	'Online gaming',
	NOT_THIRD
];
/**
 * Display name and colour for each group, shared by the word cloud and the map so the two always
 * match. One Okabe-Ito colour per Third Place group; everything else is grey.
 */
export const PLACE_STYLE = {
	'Campus social space': { name: 'Campus social space', color: 'var(--oi-blue)' },
	'Pub, bar, café': { name: 'Pub, bar, café', color: 'var(--oi-vermillion)' },
	"Friend's place": { name: "Friend's place", color: 'var(--oi-black)' },
	// No ninth Okabe-Ito colour left, so a dark brown that stays distinct from the rest
	Events: { name: 'Events', color: 'color-mix(in srgb, var(--oi-vermillion) 45%, var(--oi-black))' },
	'Gym or rec centre': { name: 'Gym or rec centre', color: 'var(--oi-green)' },
	'Park or outdoors': { name: 'Park or outdoors', color: 'var(--oi-sky)' },
	'Club or community group': { name: 'Club or community group', color: 'var(--oi-orange)' },
	'Religious space': { name: 'Religious space', color: 'var(--oi-yellow)' },
	'Online gaming': { name: 'Online gaming', color: 'var(--oi-purple)' },
	// Light grey, so it reads as "the rest" and never looks like the black café dots
	[NOT_THIRD]: { name: NOT_THIRD, color: 'color-mix(in srgb, var(--muted) 45%, var(--surface))' }
};
/** @param {string} c */
export const placeStyle = (c) => PLACE_STYLE[/** @type {keyof typeof PLACE_STYLE} */ (c)] ?? { name: c, color: 'var(--accent)' };

// The survey only worded the two ends of the 1–5 scale; the middle labels are ours, for readability.
export const CONNECTION_LABELS = {
	1: '1 – Not connected at all',
	2: '2 – Slightly connected',
	3: '3 – Moderately connected',
	4: '4 – Quite connected',
	5: '5 – Very connected'
};

/**
 * @typedef {{ id: number, loneliness: number | null, placeName: string, hours: string | null,
 *   created: Date | null, age: string | null, mentalHealth: string | null, hasPlace: string | null,
 *   connection: number | null, placeType: string | null, x: number | null, y: number | null }} Response
 */

/**
 * @param {Record<string, string>} raw
 * @returns {Response}
 */
export function cleanRow(raw) {
	// Strip a byte-order mark from the first header if the CSV has one.
	const r = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k.replace(/^﻿/, ''), v]));
	const num = (/** @type {string} */ k) => {
		const v = first(r[k]);
		return v === '' || Number.isNaN(+v) ? null : +v;
	};
	const pick = (/** @type {Record<string, string>} */ map, /** @type {string} */ k) => {
		const v = first(r[k]);
		return v === '' ? null : (map[v] ?? v.replace(/_/g, ' '));
	};
	const conn = first(r[COLUMNS.connection]).match(/^\d/);
	const rawName = (r[COLUMNS.placeName] ?? '').trim();
	// Long free-text answers shortened for display
	const placeName = NAME_SHORT[rawName.toLowerCase()] ?? rawName;
	const ticked = pick(PLACE_TYPE, COLUMNS.placeType);
	// Group into Third Places vs not: the place name wins over the ticked type when listed
	const placeType = ticked == null && !placeName ? null : (NAME_GROUP[placeName.toLowerCase()] ?? TYPE_GROUP[/** @type {keyof typeof TYPE_GROUP} */ (ticked)] ?? NOT_THIRD);
	return {
		id: +r[COLUMNS.id],
		loneliness: num(COLUMNS.loneliness),
		placeName,
		hours: pick(HOURS, COLUMNS.hours),
		created: parseDate(r[COLUMNS.created] ?? ''),
		age: pick(AGE, COLUMNS.age),
		mentalHealth: pick(MENTAL, COLUMNS.mentalHealth),
		hasPlace: pick({}, COLUMNS.hasPlace),
		connection: conn ? +conn[0] : null,
		placeType,
		x: num(COLUMNS.x),
		y: num(COLUMNS.y)
	};
}

/**
 * The bar views. `field` is the cleaned field, `column` the CSV column it shows,
 * `categories` the display order (all categories are shown, even with zero responses).
 * @type {{ field: keyof Response, title: string, column: string, categories: (string|number)[],
 *   label?: (v: any) => string }[]}
 */
export const VIEWS = [
	{
		field: 'loneliness',
		title: 'How lonely people feel',
		column: COLUMNS.loneliness,
		categories: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
		label: (v) => (v === 0 ? '0 – not at all' : v === 10 ? '10 – absolutely' : String(v))
	},
	{
		field: 'mentalHealth',
		title: 'Mental health',
		column: COLUMNS.mentalHealth,
		categories: Object.values(MENTAL)
	},
	{
		field: 'hasPlace',
		title: 'Has a regular place to socialize',
		column: COLUMNS.hasPlace,
		categories: ['Yes', 'No']
	},
	{
		field: 'placeType',
		title: 'Type of favourite place',
		column: COLUMNS.placeType,
		categories: PLACE_TYPES
	},
	{
		field: 'hours',
		title: 'Hours a week spent there',
		column: COLUMNS.hours,
		categories: Object.values(HOURS)
	},
	{
		field: 'connection',
		title: 'Connection to people there',
		column: COLUMNS.connection,
		categories: [1, 2, 3, 4, 5],
		label: (v) => CONNECTION_LABELS[/** @type {1|2|3|4|5} */ (v)]
	},
	{
		field: 'age',
		title: 'Age',
		column: COLUMNS.age,
		categories: Object.values(AGE)
	}
];
