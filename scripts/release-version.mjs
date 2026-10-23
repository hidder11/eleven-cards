import {pathToFileURL} from 'node:url';

export function validateReleaseVersion(version) {
  if (typeof version !== 'string' || !/^v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/.test(version) || /\s/.test(version)) {
    throw new Error('Use an exact stable version: vMAJOR.MINOR.PATCH (for example v0.1.0).');
  }
  return version;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(validateReleaseVersion(process.argv[2]));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
