const fs = require('fs');
const path = require('path');

const LOCAL_FONT_CANDIDATES = [
  path.join(__dirname, '..', 'fonts', 'NotoSans-Regular.ttf'),
  path.join(__dirname, '..', 'fonts', 'DejaVuSans.ttf'),
];

const SYSTEM_FONT_CANDIDATES =
  process.platform === 'win32'
    ? [
        'C:\\Windows\\Fonts\\arial.ttf',
        'C:\\Windows\\Fonts\\segoeui.ttf',
        'C:\\Windows\\Fonts\\calibri.ttf',
      ]
    : [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
        '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
      ];

function firstExistingPath(candidates) {
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function resolveUnicodeTtfPath() {
  const envPath = process.env.PDF_FONT_PATH;
  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }

  return firstExistingPath([
    ...LOCAL_FONT_CANDIDATES,
    ...SYSTEM_FONT_CANDIDATES,
  ]);
}

module.exports = {
  resolveUnicodeTtfPath,
};
