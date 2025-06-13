#!/usr/bin/env node

import { Command } from 'commander';
import { createCommand } from './commands/create';
import { listCommand } from './commands/list';
import { deleteCommand } from './commands/delete';

const program = new Command();

program
  .name('gerard')
  .description('CLI for managing OpenAI vector stores')
  .version('1.0.0');

program.addCommand(createCommand);
program.addCommand(listCommand);
program.addCommand(deleteCommand);

program.parse();