/**
 * Cleaning for static/survey_0.csv (our own "places to socialize" survey).
 *
 * Rules:
 * - Columns whose label contains "(2)" are ignored for now.
 * - Multi-select answers ("4,5_-_Very_connected") keep only the first value.
 * - "Other - What type of place is this?" free text is ignored; those answers become "Other",
 *   then "Other" answers are recoded from the place name where it clearly fits (OTHER_RECODE).
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
const MENTAL = { Excellent: 'Excellent', Very_good: 'Very good', Good: 'Good', Fair: 'Fair', Poor: 'Poor' };
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

/**
 * "Other" place types recoded from the place name (lower-cased, trimmed) into an existing
 * category or a new one. Names not listed here stay "Other".
 * @type {Record<string, string>}
 */
const OTHER_RECODE = {
	no: 'Club, cultural or community group',
	school: 'Campus space (lounge, study space)',
	'madison pub': 'Pub or bar',
	'the bar': 'Pub or bar',
	'my house': "Home or friend's home",
	'friends houses': "Home or friend's home",
	'friends’ place': "Home or friend's home",
	"friends' place": "Home or friend's home",
	'world of warcraft': 'Online gaming'
};
/** All place-type categories in display order (existing survey options, then the recoded ones). */
const PLACE_TYPES = [
	...Object.values(PLACE_TYPE).filter((t) => t !== 'Other'),
	'Pub or bar',
	"Home or friend's home",
	'Online gaming',
	'Other'
];
export const CONNECTION_LABELS = {
	1: '1 – Not connected at all',
	2: '2',
	3: '3',
	4: '4',
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
	const placeName = (r[COLUMNS.placeName] ?? '').trim();
	let placeType = pick(PLACE_TYPE, COLUMNS.placeType);
	if (placeType === 'Other') placeType = OTHER_RECODE[placeName.toLowerCase()] ?? 'Other';
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
