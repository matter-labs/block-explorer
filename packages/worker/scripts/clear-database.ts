import { DataSource } from "typeorm";
import { typeOrmModuleOptions } from "../src/typeorm.config";

(async () => {
  const typeOrmCliDataSource = new DataSource(typeOrmModuleOptions);
  await typeOrmCliDataSource.initialize();

  await typeOrmCliDataSource.query(
    `Delete from blocks;
     Delete from addresses;
     Delete from counters;
     Delete from "counterStates";`
  );
  console.log(`Database ${typeOrmModuleOptions.database} cleared.`);
})();
