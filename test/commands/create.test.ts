import {expect, test} from '@oclif/test'

describe('create', () => {
  test
  .stdout()
  .command(['create', '"HzHoRtsrn9R2WasJfDx5CjJW6M1VLHbCPWyDFNKvU2kt,E2YFRs7v4B9soPYwTHCi95mYfYGonsbfJVvp9UUEity7,H7zDLSiDePhZuCaQGE7Sa9z83bpNLnaeXyDk5xJqDAWW"'])
  .it('runs create ', ctx => {
    expect(ctx.stdout).to.contain('created new multisig: pubkey ')
  })
})
