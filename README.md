sol-multisig-cli
================

CLI to manage Solana transactions using multisig.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/sol-multisig-cli.svg)](https://npmjs.org/package/sol-multisig-cli)
[![CircleCI](https://circleci.com/gh/keyko-io/solana-multisig-cli/tree/master.svg?style=shield)](https://circleci.com/gh/keyko-io/solana-multisig-cli/tree/master)
[![Downloads/week](https://img.shields.io/npm/dw/sol-multisig-cli.svg)](https://npmjs.org/package/sol-multisig-cli)
[![License](https://img.shields.io/npm/l/sol-multisig-cli.svg)](https://github.com/keyko-io/solana-multisig-cli/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g sol-multisig-cli
$ sol-multisig COMMAND
running command...
$ sol-multisig (-v|--version|version)
sol-multisig-cli/0.0.1 linux-x64 node-v16.1.0
$ sol-multisig --help [COMMAND]
USAGE
  $ sol-multisig COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`sol-multisig create ""`](#sol-multisig-create-file)
* [`sol-multisig help [COMMAND]`](#sol-multisig-help-command)

## `sol-multisig create [FILE]`

Create a new multisig account 

```
USAGE
  $ sol-multisig create "PUBKEY1,PUBKEY2,PUBKEY3,..."

OPTIONS
  -h, --help             show CLI help
  -t, --threshold        minimum number of signatures to approve a transaction
  -m, --max-num-signers  maximum number of signers allowed in this multisig
  
EXAMPLE
  $ sol-multisig create "HzHoRtsrn9R2WasJfDx5CjJW6M1VLHbCPWyDFNKvU2kt,E2YFRs7v4B9soPYwTHCi95mYfYGonsbfJVvp9UUEity7,H7zDLSiDePhZuCaQGE7Sa9z83bpNLnaeXyDk5xJqDAWW"
  
```

_See code: [src/commands/listTx.ts](https://github.com/keyko-io/solana-multisig-cli/blob/v0.0.1/src/commands/listTx.ts)_

## `sol-multisig help [COMMAND]`

display help for sol-multisig

```
USAGE
  $ sol-multisig help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.3/src/commands/help.ts)_
<!-- commandsstop -->
