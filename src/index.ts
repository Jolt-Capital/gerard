#!/usr/bin/env node

import { Command } from 'commander';
import { createCommand } from './commands/create';
import { listCommand } from './commands/list';
import { deleteCommand } from './commands/delete';
import { addFileCommand } from './commands/add-file';
import { listFilesCommand } from './commands/list-files';
import { deleteFileCommand } from './commands/delete-file';
import { addDirCommand } from './commands/add-dir';
import { chatCommand } from './commands/chat';

const program = new Command();

program
  .name('gerard')
  .description('CLI for managing OpenAI vector stores')
  .version('1.0.0');

program.addCommand(createCommand);
program.addCommand(listCommand);
program.addCommand(deleteCommand);
program.addCommand(addFileCommand);
program.addCommand(listFilesCommand);
program.addCommand(deleteFileCommand);
program.addCommand(addDirCommand);
program.addCommand(chatCommand);

program.parse();