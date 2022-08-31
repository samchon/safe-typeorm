import { ConditionVariable } from "tstl/thread/ConditionVariable";
import * as orm from "typeorm";

export class Transaction {
    public static async run<T>(
        connection: orm.Connection,
        closure: (
            manager: orm.EntityManager,
            transaction: Transaction,
        ) => Promise<T>,
    ): Promise<T> {
        interface IOutput {
            transaction: Transaction;
            result: T;
            error: Error | null;
        }
        const output: IOutput = {} as IOutput;

        try {
            output.result = await connection.transaction(async (manager) => {
                output.transaction = new Transaction(manager);
                return closure(manager, output.transaction);
            });
            output.transaction.success_ = true;
        } catch (exp) {
            output.transaction.success_ = false;
            output.error = exp as Error;
        }

        await output.transaction.cv_.notify_all();
        if (output.error !== null) throw output.error;
        return output.result;
    }

    private readonly cv_: ConditionVariable;
    private success_: boolean | undefined;

    private constructor(public readonly manager: orm.EntityManager) {
        this.cv_ = new ConditionVariable();
        this.success_ = undefined;
    }

    public async join(): Promise<boolean> {
        await this.cv_.wait();
        return this.success_!;
    }
}
