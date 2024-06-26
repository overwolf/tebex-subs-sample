import { APP_ID } from '../base/config/app';
import storeData from '../base/config/store-data';

export default function OverwolfCategoriesRequest(endpoint: string) {
  const url = new URL(endpoint);
  url.pathname += `/${storeData.storePublicToken}`;
  url.pathname += '/categories';
  url.searchParams.append('extensionId', APP_ID);
  return url.toString();
}
