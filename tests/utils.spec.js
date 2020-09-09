import { toBool, getDeltaText, iconForDifference, diffTable, fileExists, stripHash } from '../src/utils.js';

test('toBool', () => {
	expect(toBool('1')).toBe(true);
	expect(toBool('true')).toBe(true);
	expect(toBool('yes')).toBe(true);

	expect(toBool('0')).toBe(false);
	expect(toBool('false')).toBe(false);
	expect(toBool('no')).toBe(false);
});

test('getDeltaText', () => {
	expect(getDeltaText(5000, 25.5)).toBe('+5 kB (25.5%)');
	expect(getDeltaText(-5000, -25.5)).toBe('-5 kB (-25.5%)');
	expect(getDeltaText(0, 0)).toBe('0 B');
});

test('iconForDifference', () => {
	expect(iconForDifference(0)).toBe('');
});

test('diffTable', () => {
	const files = [
		// increase
		{
			filename: 'increase.js',
			size: 5000,
			sizeBefore: 2500,
			delta: 2500
		},
		// decrease
		{
			filename: 'decrease.js',
			size: 2500,
			sizeBefore: 5000,
			delta: -2500
		},
		// unchanged
		{
			filename: 'unchanged.js',
			size: 300,
			sizeBefore: 300,
			delta: 0
		},
		// added
		{
			filename: 'added.js',
			size: 5000,
			sizeBefore: 0,
			delta: 5000
		},
		// removed
		{
			filename: 'removed.js',
			size: 0,
			sizeBefore: 5000,
			delta: -5000
		},
		// threshold
		{
			filename: 'threshold.js',
			size: 4500,
			sizeBefore: 4491,
			delta: 9
		},
	];
	const defaultOptions = {
		showTotal: true,
		collapseUnchanged: true,
		omitUnchanged: false,
		minimumChangeThreshold: 1
	};

	expect(diffTable(files, { ...defaultOptions })).toMatchSnapshot();
	expect(diffTable(files, { ...defaultOptions, showTotal: false })).toMatchSnapshot();
	expect(diffTable(files, { ...defaultOptions, collapseUnchanged: false })).toMatchSnapshot();
	expect(diffTable(files, { ...defaultOptions, omitUnchanged: true })).toMatchSnapshot();
	expect(diffTable(files, { ...defaultOptions, minimumChangeThreshold: 10 })).toMatchSnapshot();
	expect(diffTable(files.map(file => ({...file, delta: 0})), { ...defaultOptions })).toMatchSnapshot();

	expect(diffTable([files[2]], { ...defaultOptions })).toMatchSnapshot();
});

test('fileExists', async () => {
	expect(await fileExists('package.json')).toBe(true);
	expect(await fileExists('file-that-does-not-exist')).toBe(false);
});

test('stripHash', () => {
	expect(stripHash('\\b\\w{5}\\.')('foo.abcde.js')).toBe('foo.js');
	expect(stripHash('\\.(\\w{5})\\.chunk\\.js$')('foo.abcde.chunk.js')).toBe('foo.*****.chunk.js');
	expect(stripHash('')).toBe(undefined);
});
