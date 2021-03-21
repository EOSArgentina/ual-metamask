import { UALError, UALErrorType } from 'universal-authenticator-library'
//import { APIError } from '@greymass/eosio'
import { Name } from './interfaces'

export class UALMetamaskError extends UALError {
  constructor(message: string, type: UALErrorType, cause: Error | null) {
    super(message, type, cause, Name)
  }
}
