import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrum, base, polygon, mainnet } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'DiceDuel P2P',
  projectId: '04353018244199c011e496a70e883838', // Standart demo project id
  chains: [base, arbitrum, polygon, mainnet],
  ssr: true,
});
