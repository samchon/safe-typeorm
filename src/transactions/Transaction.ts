import * as orm from "typeorm";
import { ConditionVariable } from "tstl/thread/ConditionVariable";

export class Transaction
{
    public static async run<T>(closure: (manager: orm.EntityManager, transaction: Transaction) => Promise<T>): Promise<T>
    {
        let transaction!: Transaction;
        let error: Error | null = null;
        let ret: T;

        try
        {
            ret = await orm.getManager().transaction(async manager => 
            {
                transaction = new Transaction(manager);
                return await closure(manager, transaction);
            });
            transaction.success_ = true;
        }
        catch (exp) 
        {
            transaction.success_ = false;
            error = exp as Error;
        }

        await transaction.cv_.notify_all();
        if (error !== null)
            throw error;
        else
            return ret!;
    }

    private readonly cv_: ConditionVariable;
    private success_: boolean | undefined;

    private constructor(public readonly manager: orm.EntityManager)
    {
        this.cv_ = new ConditionVariable();
        this.success_ = undefined;
    }

    public async join(): Promise<boolean>
    {
        await this.cv_.wait();
        return this.success_!;
    }
}