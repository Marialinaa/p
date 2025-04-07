// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'http://localhost/tenk/backend/api',
  database: {
    host: 'localhost',
    port: 3306,
    name: 'tenkbdm',
    user: 'root',
    connectionString: 'mysql://root@localhost:3306/tenkbdm'
  },
  security: {
    tokenExpirationTime: 86400, // 24 horas em segundos
    jwtSecret: 'dev_secret_key_change_in_production',
    bcryptSaltRounds: 12
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
