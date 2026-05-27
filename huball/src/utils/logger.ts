import ora, { type Ora } from 'ora';
import chalk from 'chalk';

let verbose = false;

export function setVerbose(v: boolean) {
  verbose = v;
}

export function info(msg: string) {
  console.log(chalk.blue('ℹ'), msg);
}

export function success(msg: string) {
  console.log(chalk.green('✓'), msg);
}

export function warn(msg: string) {
  console.log(chalk.yellow('⚠'), msg);
}

export function error(msg: string) {
  console.error(chalk.red('✗'), msg);
}

export function debug(msg: string) {
  if (verbose) {
    console.log(chalk.gray('  ▸'), chalk.gray(msg));
  }
}

export function spinner(text: string): Ora {
  return ora({ text, color: 'cyan' }).start();
}

export function heading(text: string) {
  console.log();
  console.log(chalk.bold.white(text));
  console.log(chalk.gray('─'.repeat(text.length)));
}
