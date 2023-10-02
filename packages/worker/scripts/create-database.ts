import { createDatabase } from "typeorm-extension";
import { typeOrmModuleOptions } from "../src/typeorm.config";

(async () => {
  await createDatabase({
    ifNotExist: true,
    synchronize: false,
    options: typeOrmModuleOptions,
  });
  console.log(`Database ${typeOrmModuleOptions.database} created.`);
})();
