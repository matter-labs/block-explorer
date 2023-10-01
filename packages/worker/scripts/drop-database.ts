import { dropDatabase } from "typeorm-extension";
import { typeOrmModuleOptions } from "../src/typeorm.config";

(async () => {
  await dropDatabase({
    ifExist: true,
    options: typeOrmModuleOptions,
  });
  console.log(`Database ${typeOrmModuleOptions.database} deleted.`);
})();
