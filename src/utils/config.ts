import { http, createConfig } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { frameConnector } from './connector'

export const config = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
  connectors: [frameConnector()],

})
