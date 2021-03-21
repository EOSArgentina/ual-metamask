import {
  Authenticator, ButtonStyle, Chain,
  UALError, User, UALErrorType, 
} from 'universal-authenticator-library'

import { JsonRpc, Api } from 'eosjs'
import { SignatureProvider, SignatureProviderArgs } from 'eosjs-api'
import { Name } from './interfaces'
import { MetamaskUser } from './MetamaskUser'
import { MetamaskLogo } from './MetamaskLogo'
import { UALMetamaskError } from './UALMetamaskError'
import detectEthereumProvider from '@metamask/detect-provider'
import { PushTransactionArgs } from 'eosjs/dist/eosjs-rpc-interfaces'

class NopSigProvider implements SignatureProvider {
  public async getAvailableKeys() : Promise<string[]> {
    throw new UALMetamaskError(
      'Not Implemented',
      UALErrorType.Unsupported,
      null);
  }

  public async sign(_args: SignatureProviderArgs) : Promise<PushTransactionArgs>{
    throw new UALMetamaskError(
      'Not Implemented',
      UALErrorType.Unsupported,
      null);
  }
}

export class Metamask extends Authenticator {
  
  private metamaskIsLoading: boolean = true;
  private provider: any = null;
  private initError: UALError | null = null;
  private chainId: string;
  private user: any;
  private api: Api;
  private netmap: any;

  /**
   * Metamask Constructor.
   *
   * @param chains
   * @param options { appName } appName is a required option to use Scatter
   */
  constructor(chains: Chain[], options?: any) {
    super(chains)
    this.user = null;
    this.netmap = {
      "5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191": Number(95),
    };

    if (!!options && options.netmap) {
      this.netmap = options.netmap;
    }

    const [chain] = chains
    const [rpc_config] = chain.rpcEndpoints

    this.chainId = chain.chainId;
    let rpc = new JsonRpc(`${rpc_config.protocol}://${rpc_config.host}:${rpc_config.port}`)
    this.api = new Api({
      rpc               : rpc,
      signatureProvider : new NopSigProvider(),
      textEncoder       : new TextEncoder(),
      textDecoder       : new TextDecoder(),
    })
  }

  on_accountsChanged(_accounts: any) {
    window.location.reload();
  }

  on_chainChanged(_chainId : any) {
    window.location.reload();
  }

  /**
   * Called after `shouldRender` and should be used to handle any async actions required to initialize the authenticator
   */
  public async init() {
    this.metamaskIsLoading = true;
    this.initError = null;
    const provider = await detectEthereumProvider({mustBeMetaMask:true});
    if(provider) {
      this.provider = window.ethereum;
      this.provider.on('accountsChanged', this.on_accountsChanged);
      this.provider.on('chainChanged', this.on_chainChanged);
    } else {
      this.provider = null;
      this.initError = new UALMetamaskError(
        'Metamask not detected',
        UALErrorType.Initialization,
        null
      );
    }
    this.metamaskIsLoading = false;
  }

  /**
   * Resets the authenticator to its initial, default state then calls `init` method
   */
  public reset() {
    this.user = null;
  }

  /**
   * Returns true if the authenticator has errored while initializing.
   */
  public isErrored() {
    return !!this.initError;
  }

  /**
   * Returns a URL where the user can download and install the underlying authenticator
   * if it is not found by the UAL Authenticator.
   */
  public getOnboardingLink(): string {
    return 'https://metamask.io/'
  }

  /**
   * Returns error (if available) if the authenticator has errored while initializing.
   */
  public getError(): UALError | null {
    return this.initError;
  }

  /**
   * Returns true if the authenticator is loading while initializing its internal state.
   */
  public isLoading() {
    return this.metamaskIsLoading;
  }

  public getName() {
    return 'Metamask'
  }

  /**
   * Returns the style of the Button that will be rendered.
   */
  public getStyle(): ButtonStyle {
    return {
      icon: MetamaskLogo,
      text: Name,
      textColor: 'white',
      background: '#3650A2'
    }
  }

  /**
   * Returns whether or not the button should render based on the operating environment and other factors.
   * ie. If your Authenticator App does not support mobile, it returns false when running in a mobile browser.
   */
  public shouldRender() {
    return true;
  }

  /**
   * Returns whether or not the dapp should attempt to auto login with the Authenticator app.
   * Auto login will only occur when there is only one Authenticator that returns shouldRender() true and
   * shouldAutoLogin() true.
   */
  public shouldAutoLogin() {
    return false;
  }

  /**
   * Returns whether or not the button should show an account name input field.
   * This is for Authenticators that do not have a concept of account names.
   */
  public async shouldRequestAccountName(): Promise<boolean> {
    return false
  }

  /**
   * Login using the Authenticator App. This can return one or more users depending on multiple chain support.
   *
   * @param accountName  The account name of the user for Authenticators that do not store accounts (optional)
   */
  public async login(): Promise<User[]> {
    try {
      const chainId = await this.provider.request({ method: 'eth_chainId' });
      if (this.netmap[this.chainId] != Number(chainId)) {
          throw new UALMetamaskError(
            'Network not supported. Please select a valid network',
            UALErrorType.Login,
            null);
      }
      
      let eth_address = "";
      try {
        [eth_address] = await this.provider.request({ method: 'eth_requestAccounts' });
      }
      catch (e) {
        console.log(e);
        throw new UALMetamaskError(
          'Unable to get the current account during login. ' + e.message,
          UALErrorType.Login,
          null);
      }
      
      let identity = await this.getEosAccount(eth_address);
      this.user = new MetamaskUser(this.api, this.chainId, this.provider, identity);
      
      if (identity['eos_account'] == 'eosio.null') {
        setTimeout(() => this.waitForAccount(identity), 5000);
      }
      return [this.user]
    } catch (e) {
      console.log(e);
      throw new UALMetamaskError(
        'Unable to get the current account during login: ' + e.message,
        UALErrorType.Login,
        null);
    }
  }

  /**
   * Logs the user out of the dapp. This will be strongly dependent on each Authenticator app's patterns.
   */
  public async logout(): Promise<void>  {
    
  }

  /**
   * Returns true if user confirmation is required for `getKeys`
   */
  public requiresGetKeyConfirmation(): boolean {
    return false
  }

  public async waitForAccount(identity : any) {
    let has_balance = false;
      try {
        let b = Number(await this.provider.request({ method: 'eth_getBalance', params: [identity['eth_address']] }));
        has_balance = b > 0;
      } catch (e) {
      
      }
      if (has_balance) {
        window.location.reload();
      } else {
        setTimeout(() => this.waitForAccount(identity), 5000);
      }
  }

  public async getEosAccount(eth_address: string) {
    let res = await this.api.rpc.get_table_rows({
      code           : 'etheraccount',
      scope          : 'etheraccount',
      table          : 'account',
      lower_bound    : eth_address.substr(2),
      limit          : 1,
      index_position : 2,
      key_type       : "sha256",
      json           : true
    });

    let identity = {
      eos_account: 'eosio.null',
      eth_address: eth_address,
    };

    if( res && res.rows && res.rows.length == 1 && res.rows[0].eth_address == eth_address.substr(2) ) {
      identity = res.rows[0];
    }
    
    return identity;
  }
}
