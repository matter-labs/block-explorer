import { MigrationInterface, QueryRunner } from "typeorm";

export class ProcessContractDeployedLogs1679923273990 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX LogsTopic0 on public.logs ((topics[1]));`);

    await queryRunner.query(`
            INSERT INTO
                public.addresses(
                    "createdAt",
                    "updatedAt",
                    "blockNumber",
                    balances,
                    address,
                    bytecode,
                    "createdInBlockNumber",
                    "creatorTxHash",
                    "creatorAddress"
                )
                SELECT 
                    CURRENT_TIMESTAMP, --createdAt
                    CURRENT_TIMESTAMP, --updatedAt
                    public.logs."blockNumber", --blockNumber
                    '{ }'::jsonb, --balances
                    decode(
                        SUBSTRING(encode(public.logs.topics [4], 'hex'), 25),
                        'hex'
                    ), --contractAddress
                    NULL,    --bytecode
                    public.logs."blockNumber" AS "createdInBlockNumber", --createdInBlockNumber
                    public.logs."transactionHash" AS "creatorTxHash", --creatorTxHash
                    public.transactions.from AS "creatorAddress" --creatorAddress
                FROM
                    (
                        SELECT 
                            DISTINCT(public.logs.topics[4]),
                            MAX(public.logs.number) as "number"
                        FROM 
                            public.logs
                        WHERE
                            --event ContractDeployed(address indexed deployerAddress, bytes32 indexed bytecodeHash, address indexed contractAddress);
                            public.logs.topics [1] = decode(
                                '290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5', 
                                'hex'
                            )
                        GROUP BY
                            public.logs.topics[4]
                    ) AS distinct_contract_deployed_logs
                INNER JOIN public.logs ON public.logs.number = distinct_contract_deployed_logs.number
                INNER JOIN public.transactions ON public.logs."transactionHash" = public.transactions."hash"
            ON CONFLICT (address) 
            DO UPDATE
                SET bytecode = NULL, 
                "createdInBlockNumber" = EXCLUDED."createdInBlockNumber",
                "creatorTxHash" = EXCLUDED."creatorTxHash",
                "creatorAddress" = EXCLUDED."creatorAddress";
        `);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async down(): Promise<void> {}
}
