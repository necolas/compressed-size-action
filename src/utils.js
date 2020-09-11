import fs from 'fs';

function prettyBytes(bytes, toFixed) {
  var kb = bytes / 1000;
  return kb.toFixed(toFixed || 2);
}

/**
 * Check if a given file exists and can be accessed.
 * @param {string} filename
 */
export async function fileExists(filename) {
	try {
		await fs.promises.access(filename, fs.constants.F_OK);
		return true;
	} catch (e) {}
	return false;
}

/**
 * Remove any matched hash patterns from a filename string.
 * @param {string=} regex
 * @returns {(((fileName: string) => string) | undefined)}
 */
export function stripHash(regex) {
	if (regex) {
		console.log(`Striping hash from build chunks using '${regex}' pattern.`);
		return function (fileName) {
			return fileName.replace(new RegExp(regex), (str, ...hashes) => {
				hashes = hashes.slice(0, -2).filter((c) => c != null);
				if (hashes.length) {
					for (let i = 0; i < hashes.length; i++) {
						const hash = hashes[i] || '';
						str = str.replace(hash, hash.replace(/./g, '*'));
					}
					return str;
				}
				return '';
			});
		};
	}

	return undefined;
}

/**
 * @param {number} delta
 * @param {number} difference
 */
export function getDeltaText(delta) {
	const deltaText = (delta > 0 ? '+' : '') + prettyBytes(delta);
	return deltaText;
}

function getDifference(before, delta) {
	const divisor = before === 0 ? Math.abs(delta) : before
	return ((delta / divisor) * 100).toFixed(1);
}

function getDifferenceText(difference) {
	const text = (difference > 0 ? '+' : '') + difference + '%';
	return text;
}

/**
 * @param {number} difference
 */
export function iconForDifference(difference) {
	let icon = '';
	if (difference >= 20) icon = '🔴';
	else if (difference >= 10) icon = '🟡';
	else if (difference <= -5) icon = '🟢';
	return icon;
}

/**
 * Create a Markdown table from text rows
 * @param {string[]} rows
 */
function markdownTable(rows) {
	if (rows.length == 0) {
		return '';
	}

	// Skip all empty columns
	while (rows.every(columns => !columns[columns.length - 1])) {
		for (const columns of rows) {
			columns.pop();
		}
	}

	const [firstRow] = rows;
	const columnLength = firstRow.length;
	if (columnLength === 0) {
		return '';
	}

	return [
		// Header
		['Filename', 'Size (kB)', 'kB change', '% change', ''].slice(0, columnLength),
		// Align
		[':---', ':---', ':---', ':---', ':---:'].slice(0, columnLength),
		// Body
		...rows
	].map(columns => `| ${columns.join(' | ')} |`).join('\n');
}

/**
 * @typedef {Object} Diff
 * @property {string} filename
 * @property {number} size
 * @property {number} delta
 */

/**
 * Create a Markdown table showing diff data
 * @param {Diff[]} files
 * @param {object} options
 * @param {boolean} [options.showTotal]
 * @param {boolean} [options.collapseUnchanged]
 * @param {boolean} [options.omitUnchanged]
 * @param {number} [options.minimumChangeThreshold]
 */
export function diffTable(files, { showTotal, collapseUnchanged, omitUnchanged, minimumChangeThreshold }) {
	let changedRows = [];
	let unChangedRows = [];

	let totalSize = 0;
	let totalDelta = 0;
	for (const file of files) {
		const {
			filename,
			compressedSize,
			compressedSizeBefore,
			compressedSizeDelta,
			size,
			sizeBefore,
			sizeDelta
		} = file;
		totalSize += compressedSize;
		totalDelta += compressedSizeDelta;
		const compressedDifference = getDifference(compressedSizeBefore, compressedSizeDelta);
		const sizeDifference = getDifference(sizeBefore, sizeDelta);
		const isUnchanged = Math.abs(compressedSizeDelta) < minimumChangeThreshold;

		if (isUnchanged && omitUnchanged) continue;

		const columns = [
			// file name
			`\`${filename}\``,
			// size before
			// `**${prettyBytes(compressedSizeBefore)}**&nbsp;(${prettyBytes(sizeBefore)})`,
			// size
			`**${prettyBytes(compressedSize)}**&nbsp;(${prettyBytes(size)})`,
			// absolute change
			`**${getDeltaText(compressedSizeDelta)}**&nbsp;(${getDeltaText(sizeDelta)})`,
			// percentage change
			`**${getDifferenceText(compressedDifference)}**&nbsp;(${getDifferenceText(sizeDifference)})`,
			// icon
			iconForDifference(compressedSizeDelta)
		];
		if (isUnchanged && collapseUnchanged) {
			unChangedRows.push(columns);
		} else {
			changedRows.push(columns);
		}
	}

	let out = markdownTable(changedRows);

	if (unChangedRows.length !== 0) {
		const outUnchanged = markdownTable(unChangedRows);
		out += `\n\n<details><summary><strong>View unchanged</strong></summary>\n\n${outUnchanged}\n\n</details>\n\n`;
	}

	if (showTotal) {
		const totalDifference = ((totalDelta / totalSize) * 100) | 0;
		let totalDeltaText = getDeltaText(totalDelta, totalDifference);
		let totalIcon = iconForDifference(totalDifference);
		out = `**Total size:** ${prettyBytes(totalSize)} kB\n\n${out}`;
		out = `**Size change:** ${totalDeltaText} kB ${totalIcon}\n${out}`;
	}

	return out;
}

/**
 * Convert a string "true"/"yes"/"1" argument value to a boolean
 * @param {string} v
 */
export function toBool(v) {
	return /^(1|true|yes)$/.test(v);
}
