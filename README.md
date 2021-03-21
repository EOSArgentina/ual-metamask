# UAL for Metamask Authenticator

This authenticator is meant to be used with [Metamask](https://metamask.io/) and [Universal Authenticator Library](https://github.com/EOSIO/universal-authenticator-library). When used in combination with them, it gives developers the ability to request transaction signatures through Metamask using the common UAL API.

![EOSIO Labs](https://img.shields.io/badge/EOSIO-Labs-5cb3ff.svg)

# About EOSIO Labs

EOSIO Labs repositories are experimental.  Developers in the community are encouraged to use EOSIO Labs repositories as the basis for code and concepts to incorporate into their applications. Community members are also welcome to contribute and further develop these repositories. Since these repositories are not supported by Block.one, we may not provide responses to issue reports, pull requests, updates to functionality, or other requests from the community, and we encourage the community to take responsibility for these.

## Supported Environments
- The Metamask Authenticator supports both Desktop and Mobile Environments

## Getting Started

`yarn add ual-metamask`

#### Dependencies

You must use one of the UAL renderers below.

React - `ual-reactjs-renderer`


PlainJS - `ual-plainjs-renderer`


#### Basic Usage with React

```javascript
import { Metamask } from 'ual-metamask'
import { UALProvider, withUAL } from 'ual-reactjs-renderer'

const exampleNet = {
  chainId: '',
  rpcEndpoints: [{
    protocol: '',
    host: '',
    port: '',
  }]
}

const App = (props) => <div>{JSON.stringify(props.ual)}</div>
const AppWithUAL = withUAL(App)

const metamask = new Metamask([exampleNet])

<UALProvider chains={[exampleNet]} authenticators={[metamask]}>
  <AppWithUAL />
</UALProvider>
```

## Contributing

[Contributing Guide](https://github.com/EOSIO/ual-scatter/blob/develop/CONTRIBUTING.md)

[Code of Conduct](https://github.com/EOSIO/ual-scatter/blob/develop/CONTRIBUTING.md#conduct)

## License

[MIT](https://github.com/EOSIO/ual-scatter/blob/develop/LICENSE)

## Important


See [LICENSE](./LICENSE) for copyright and license terms.

All repositories and other materials are provided subject to the terms of this [IMPORTANT](./IMPORTANT.md) notice and you must familiarize yourself with its terms.  The notice contains important information, limitations and restrictions relating to our software, publications, trademarks, third-party resources, and forward-looking statements.  By accessing any of our repositories and other materials, you accept and agree to the terms of the notice.