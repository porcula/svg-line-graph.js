#!/usr/bin/env node
import('open').then( open => open.default(process.argv[2]) );
