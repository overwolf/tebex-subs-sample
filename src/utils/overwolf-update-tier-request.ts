import { APP_ID } from '../base/config/app';
import storeData from '../base/config/store-data';

export default function OverwolfUpdateTierRequest(endpoint: string) {
  const url = new URL(endpoint);
  url.pathname += `/${storeData.storePublicToken}`;
  url.searchParams.append('extensionId', APP_ID);
  return url.toString();
}
