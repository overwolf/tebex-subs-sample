export const APP_ID = 'cjklahdldnjcjalpckgbpdjkmkiajndahgcgiomj';

overwolf.extensions.current.getManifest((result) => {
  if (result.success) {
    if (result.UID !== APP_ID)
      alert(
        // eslint-disable-next-line max-len
        'MISCONFIGURED APP ID! Please verify that you have properly configured your APP_ID under `/src/base/config/app.ts`',
      );
  }
});
