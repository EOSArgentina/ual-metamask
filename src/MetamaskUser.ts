import { SignTransactionResponse, User, UALErrorType } from 'universal-authenticator-library'
import {Api} from 'eosjs'
import { Serializer, Action } from '@greymass/eosio';
import { UALMetamaskError } from './UALMetamaskError'
import { ethers } from "ethers";

export class MetamaskUser extends User {
  public api: Api
  private chainId: string
  private identity: any
  private provider: ethers.providers.Web3Provider;
  private rp: Number;

  constructor(api, chainId, provider, identity) {
    super()
    this.api = api
    this.chainId = chainId
    this.provider = provider;
    this.identity = identity
    this.rp = 0;
  }

  objectify(data: any) {
    return JSON.parse(JSON.stringify(data))
  }
  
  setIdentity(identity : any) {
    this.identity = identity;
  }

  public async signTransaction(transaction, _options): Promise<SignTransactionResponse> {

    let serializedActions = await this.api.serializeActions(transaction.actions);
    let actions = Serializer.encode({
      object      : serializedActions,
      type        : 'action[]',
      customTypes : [Action]
    }).array;

    //@ts-ignore
    let provider = new ethers.providers.Web3Provider(this.provider);
    let signer = provider.getSigner();
    const abi = [
      "function pushEosTransaction(uint64 rp, bytes actions) returns (boolean)",
      "function getRp() view returns (uint64)"
    ];

    const address = "0xa1050456bf9f78d485445fb43aa2c6978f3aa5d5";
    const etheraccount = new ethers.Contract(address, abi, signer);

    if (this.rp == 0) {
      this.rp = await etheraccount.getRp();
    }

    let res = await etheraccount.pushEosTransaction(this.rp, actions);

    return {
      wasBroadcast: true,
      transactionId: res.result,
      transaction: null,
    }

  }

  public async signArbitrary(publicKey: string, data: string, _: string): Promise<string> {
    throw new UALMetamaskError(
      `Metamask does not currently support signArbitrary(${publicKey}, ${data})`,
      UALErrorType.Unsupported,
      null)
  }

  public async verifyKeyOwnership(challenge: string): Promise<boolean> {
    throw new UALMetamaskError(
      `Metamask does not currently support verifyKeyOwnership(${challenge})`,
      UALErrorType.Unsupported,
      null)
  }

  public async getAccountName() {
    return this.identity.eos_account
  }

  public async getChainId() {
    return this.chainId
  }

  public async getKeys() : Promise<string[]>{
    return [];
  }

  public async isAccountValid() {
    throw new UALMetamaskError(
      `Metamask does not currently support isAccountValid`,
      UALErrorType.Unsupported,
      null)
  }

  public extractAccountKeys(_account) {
    return [];
  }
}
