import fs from 'fs-extra';
import logger from 'jet-logger';
import childProcess from 'child_process';

/**
 * Start
 */
(async () => {
  try {
    // Check if --skip-lint was passed
    const skipLint = process.argv.includes('--skip-lint');

    // Remove current build
    await remove('./dist/');

    // Conditionally run lint only if skipLint is false
    if (!skipLint) {
      await exec('npm run lint', './');
    }

    // TypeScript compile (production config)
    await exec('tsc --build tsconfig.prod.json', './');

    // Copy necessary files
    await copy('./src/public', './dist/public');
    await copy('./src/views', './dist/views');
    await copy('./src/repos/database.json', './dist/repos/database.json');
    await copy('./temp/config.js', './config.js');
    await copy('./temp/src', './dist');
    await remove('./temp/');

  } catch (err) {
    logger.err(err);
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }
})();

/**
 * Remove file or directory
 */
function remove(loc: string): Promise<void> {
  return new Promise((res, rej) => {
    fs.remove(loc, err => {
      return err ? rej(err) : res();
    });
  });
}

/**
 * Copy file or directory
 */
function copy(src: string, dest: string): Promise<void> {
  return new Promise((res, rej) => {
    fs.copy(src, dest, err => {
      return err ? rej(err) : res();
    });
  });
}

/**
 * Execute a command in a given directory
 */
function exec(cmd: string, loc: string): Promise<void> {
  return new Promise((res, rej) => {
    childProcess.exec(cmd, { cwd: loc }, (err, stdout, stderr) => {
      if (stdout) {
        logger.info(stdout);
      }
      if (stderr) {
        logger.warn(stderr);
      }
      return err ? rej(err) : res();
    });
  });
}
