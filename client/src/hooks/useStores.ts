import { useSystemStore } from '../store/systemStore';
import { useMarketStore } from '../store/marketStore';
import { useUserStore } from '../store/userStore';

export function useStores() {
  const system = useSystemStore();
  const market = useMarketStore();
  const user = useUserStore();

  return {
    system,
    market,
    user
  };
}