import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as request from "supertest";
import { Repository } from "typeorm";
import * as nock from "nock";
import { Address } from "../src/address/address.entity";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configureApp";

const { CONTRACT_VERIFICATION_API_URL } = process.env;

describe("Contract API (e2e)", () => {
  let app: INestApplication;
  let addressRepository: Repository<Address>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();

    addressRepository = app.get<Repository<Address>>(getRepositoryToken(Address));

    await addressRepository.insert({
      bytecode: "0x",
      address: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
      creatorAddress: "0xFb7E0856e44Eff812A44A9f47733d7d55c39Aa28",
      creatorTxHash: "0x37eeda3dd1b10afadfaba8e1896d9c513f527062cf04bb83f653c070c4725b7f",
    });
  });

  afterAll(async () => {
    await addressRepository.delete({});
    await app.close();
  });

  describe("/api?module=contract&action=getabi GET", () => {
    it("returns HTTP 200 and contract ABI when verification API returns the contract ABI", () => {
      const address = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";

      nock(CONTRACT_VERIFICATION_API_URL)
        .get(`/contract_verification/info/0xffffffffffffffffffffffffffffffffffffffff`)
        .reply(200, {
          artifacts: {
            abi: [],
          },
        });

      return request(app.getHttpServer())
        .get(`/api?module=contract&action=getabi&address=${address}`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "1",
            message: "OK",
            result: "[]",
          })
        );
    });

    it("returns HTTP 200 and error result when verification API does not return the contract ABI", () => {
      const address = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";

      nock(CONTRACT_VERIFICATION_API_URL)
        .get(`/contract_verification/info/0xffffffffffffffffffffffffffffffffffffffff`)
        .reply(200, {});

      return request(app.getHttpServer())
        .get(`/api?module=contract&action=getabi&address=${address}`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "0",
            message: "NOTOK",
            result: "Contract source code not verified",
          })
        );
    });
  });

  describe("/api?module=contract&action=getcontractcreation GET", () => {
    it("returns HTTP 200 and contract creation info when contract is found in DB", () => {
      const address = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";

      return request(app.getHttpServer())
        .get(`/api?module=contract&action=getcontractcreation&contractaddresses=${address}`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "1",
            message: "OK",
            result: [
              {
                contractAddress: "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF",
                contractCreator: "0xFb7E0856e44Eff812A44A9f47733d7d55c39Aa28",
                txHash: "0x37eeda3dd1b10afadfaba8e1896d9c513f527062cf04bb83f653c070c4725b7f",
              },
            ],
          })
        );
    });

    it("returns HTTP 200 and error result when no contracts found in DB", () => {
      return request(app.getHttpServer())
        .get(
          "/api?module=contract&action=getcontractcreation&contractaddresses=0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFA,0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFB"
        )
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "0",
            message: "No data found",
            result: null,
          })
        );
    });
  });
});
