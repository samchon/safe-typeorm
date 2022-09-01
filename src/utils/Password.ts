import * as bcrypt from "bcryptjs";
import * as orm from "typeorm";

/**
 * Password component for embedding.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export class Password {
    /**
     * The password.
     */
    @orm.Column("varchar", { nullable: true })
    private password!: string | null;

    public isNull(): boolean {
        return this.password === null;
    }

    /**
     * Configure password.
     *
     * Configure the password with one-way encryption. Therefore, no one can know the
     * original password, even if the one is a system administrator.
     *
     * @param str The password to configure.
     */
    public async set(str: string | null): Promise<void> {
        if (str === null) this.password = null;
        else {
            const salt: string = await bcrypt.genSalt();
            this.password = await bcrypt.hash(str, salt);
        }
    }

    /**
     * Test whether the password is matched with the original.
     *
     * The password configured in this record has been one-way encrypted by `bcrypt`
     * algorithm. Therefore, no one can know the original password. Therefore, just
     * only testing the equality through this {@link equals}() is possible.
     *
     * @param str Target to be compared.
     * @return Whether equal or not.
     */
    public async equals(str: string | null): Promise<boolean> {
        return this.password === null
            ? str === null
            : str !== null
            ? bcrypt.compare(str, this.password)
            : false;
    }
}
