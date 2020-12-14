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
	expect(getDeltaText(5000, 25.5)).toMatchSnapshot();
	expect(getDeltaText(-5000, -25.5)).toMatchSnapshot();
	expect(getDeltaText(0, 0)).toMatchSnapshot();
});

test('iconForDifference', () => {
	expect(iconForDifference(0)).toBe('');
});

test('diffTable', () => {
	const files = [
		// increase
		{
			filename: 'increase.js',
			compressedSize: 5000,
			compressedSizeBefore: 2500,
			compressedSizeDelta: 2500,
			size: 10000,
			sizeBefore: 7000,
			sizeDelta: 3000,
		},
		// decrease
		{
			filename: 'decrease.js',
			compressedSize: 2500,
			compressedSizeBefore: 5000,
			compressedSizeDelta: -2500,
			size: 7500,
			sizeBefore: 12000,
			sizeDelta: -4500
		},
		// unchanged
		{
			filename: 'unchanged.js',
			compressedSize: 300,
			compressedSizeBefore: 300,
			compressedSizeDelta: 0,
			size: 1000,
			sizeBefore: 1000,
			sizeDelta: 0
		},
		// unchanged
		{
			filename: 'unchanged-tiny.js',
			compressedSize: 0,
			compressedSizeBefore: 0,
			compressedSizeDelta: 0,
			size: 10,
			sizeBefore: 10,
			sizeDelta: 0
		},
		// added
		{
			filename: 'added.js',
			compressedSize: 5000,
			compressedSizeBefore: 0,
			compressedSizeDelta: 5000,
			size: 8000,
			sizeBefore: 0,
			sizeDelta: 8000
		},
		// removed
		{
			filename: 'removed.js',
			compressedSize: 0,
			compressedSizeBefore: 5000,
			compressedSizeDelta: -5000,
			size: 0,
			sizeBefore: 12000,
			sizeDelta: -12000
		},
		// threshold
		{
			filename: 'threshold.js',
			compressedSize: 4500,
			compressedSizeBefore: 4491,
			compressedSizeDelta: 9,
			size: 7500,
			sizeBefore: 7491,
			sizeDelta: 9
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
