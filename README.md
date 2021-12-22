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
sol-multisig-cli/0.0.2 linux-x64 node-v16.1.0
$ sol-multisig --help [COMMAND]
USAGE
  $ sol-multisig COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`sol-multisig approve [TRANSACTION]`](#sol-multisig-approve-transaction)
* [`sol-multisig create [PARTICIPANTS]`](#sol-multisig-create-participants)
* [`sol-multisig execute [TRANSACTION]`](#sol-multisig-execute-transaction)
* [`sol-multisig help [COMMAND]`](#sol-multisig-help-command)
* [`sol-multisig listsigners`](#sol-multisig-listsigners)
* [`sol-multisig listtransactions`](#sol-multisig-listtransactions)
* [`sol-multisig saberdeposit [SWAPACCOUNT] [AMOUNTA] [AMOUNTB] [MINPOOLAMOUNT]`](#sol-multisig-saberdeposit-swapaccount-amounta-amountb-minpoolamount)
* [`sol-multisig saberwithdraw [SWAPACCOUNT] [POOLAMOUNT] [MINAMOUNTA] [MINAMOUNTB]`](#sol-multisig-saberwithdraw-swapaccount-poolamount-minamounta-minamountb)
* [`sol-multisig transfertokens [TOKEN] [AMOUNT] [DESTINATION]`](#sol-multisig-transfertokens-token-amount-destination)

## `sol-multisig approve [TRANSACTION]`

Approve (sign) an existing transaction.

```
USAGE
  $ sol-multisig approve [TRANSACTION]

ARGUMENTS
  TRANSACTION  the transaction`s publickey

OPTIONS
  -h, --help               show CLI help
  -m, --multisig=multisig  multisig account (publicKey)
  -s, --signer=signer      path to wallet file of payer for the transaction

EXAMPLE
  $ sol-multisig approve CqJTr3je2ENaenVtZDboVDTVPioFUmMuQNu4N5XeFWmh -m DbnEfsCR6gSk2Doqr8chiS8Uus2sizUn4H8zg6iU7Lkr
```

_See code: [src/commands/approve.ts](https://github.com/keyko-io/solana-multisig-cli/blob/v0.0.2/src/commands/approve.ts)_

## `sol-multisig create [PARTICIPANTS]`

Create a new multisig account.

```
USAGE
  $ sol-multisig create [PARTICIPANTS]

OPTIONS
  -h, --help                         show CLI help
  -s, --signer=signer                path to wallet file of payer for the transaction

  -t, --threshold=threshold          [default: 2] multisig threshold, minimum number of signers required to execute a
                                     transaction (DEFAULT=2).

  -x, --maxNumSigners=maxNumSigners  [default: 10] max number of signers in the multisig (DEFAULT=10).

EXAMPLE
  $ sol-multisig create "SIGNER_ACC1,SIGNER_ACC2,SIGNER_ACC3" -t 2 -x 9
```

_See code: [src/commands/create.ts](https://github.com/keyko-io/solana-multisig-cli/blob/v0.0.2/src/commands/create.ts)_

## `sol-multisig execute [TRANSACTION]`

Execute an existing transaction that is already signed by the minimum number of owners.

```
USAGE
  $ sol-multisig execute [TRANSACTION]

OPTIONS
  -h, --help               show CLI help
  -m, --multisig=multisig  multisig account (publicKey)
  -s, --signer=signer      path to wallet file of payer for the transaction

EXAMPLE
  $ sol-multisig execute CqJTr3je2ENaenVtZDboVDTVPioFUmMuQNu4N5XeFWmh --signer=~/.config/solana/id.json
```

_See code: [src/commands/execute.ts](https://github.com/keyko-io/solana-multisig-cli/blob/v0.0.2/src/commands/execute.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.3.1/src/commands/help.ts)_

## `sol-multisig listsigners`

List the signers of the specified multisig wallet.

```
USAGE
  $ sol-multisig listsigners

OPTIONS
  -h, --help               show CLI help
  -m, --multisig=multisig  multisig account (publicKey)
  -s, --signer=signer      path to wallet file of payer for the transaction
  -t, --token=token        token mint (publicKey)

EXAMPLE
  $ sol-multisig listSigners -m DbnEfsCR6gSk2Doqr8chiS8Uus2sizUn4H8zg6iU7Lkr
```

_See code: [src/commands/listsigners.ts](https://github.com/keyko-io/solana-multisig-cli/blob/v0.0.2/src/commands/listsigners.ts)_

## `sol-multisig listtransactions`

List all transactions for the given multisig account.

```
USAGE
  $ sol-multisig listtransactions

OPTIONS
  -h, --help               show CLI help
  -m, --multisig=multisig  multisig account (publicKey)
  -s, --signer=signer      path to wallet file of payer for the transaction

EXAMPLE
  $ sol-multisig listTx -m DbnEfsCR6gSk2Doqr8chiS8Uus2sizUn4H8zg6iU7Lkr
```

_See code: [src/commands/listtransactions.ts](https://github.com/keyko-io/solana-multisig-cli/blob/v0.0.2/src/commands/listtransactions.ts)_

## `sol-multisig saberdeposit [SWAPACCOUNT] [AMOUNTA] [AMOUNTB] [MINPOOLAMOUNT]`

Deposit tokens into a Saber pool.

```
USAGE
  $ sol-multisig saberdeposit [SWAPACCOUNT] [AMOUNTA] [AMOUNTB] [MINPOOLAMOUNT]

OPTIONS
  -h, --help               show CLI help
  -m, --multisig=multisig  multisig account (publicKey)
  -s, --signer=signer      path to wallet file of payer for the transaction

EXAMPLE
  $ sol-multisig saberDeposit VeNkoB1HvSP6bSeGybQDnx9wTWFsQb2NBCemeCDSuKL 10 10 1
```

_See code: [src/commands/saberdeposit.ts](https://github.com/keyko-io/solana-multisig-cli/blob/v0.0.2/src/commands/saberdeposit.ts)_

## `sol-multisig saberwithdraw [SWAPACCOUNT] [POOLAMOUNT] [MINAMOUNTA] [MINAMOUNTB]`

Withdraw tokens from a Saber pool.

```
USAGE
  $ sol-multisig saberwithdraw [SWAPACCOUNT] [POOLAMOUNT] [MINAMOUNTA] [MINAMOUNTB]

OPTIONS
  -a, --destA=destA        destination account for token A
  -b, --destB=destB        destination account for token B
  -h, --help               show CLI help
  -m, --multisig=multisig  multisig account (publicKey)
  -s, --signer=signer      path to wallet file of payer for the transaction

EXAMPLE
  $ sol-multisig saberWithdraw VeNkoB1HvSP6bSeGybQDnx9wTWFsQb2NBCemeCDSuKL 1 2 2
```

_See code: [src/commands/saberwithdraw.ts](https://github.com/keyko-io/solana-multisig-cli/blob/v0.0.2/src/commands/saberwithdraw.ts)_

## `sol-multisig transfertokens [TOKEN] [AMOUNT] [DESTINATION]`

Submit a transaction to transfer tokens via the multisig wallet.

```
USAGE
  $ sol-multisig transfertokens [TOKEN] [AMOUNT] [DESTINATION]

OPTIONS
  -f, --from=from          source pubkey
  -h, --help               show CLI help
  -m, --multisig=multisig  multisig account (publicKey)
  -s, --signer=signer      path to wallet file of payer for the transaction

EXAMPLE
  $ sol-multisig transferTokens <token-mint> <amount-float> <destination-token-account>
```

_See code: [src/commands/transfertokens.ts](https://github.com/keyko-io/solana-multisig-cli/blob/v0.0.2/src/commands/transfertokens.ts)_
<!-- commandsstop -->
