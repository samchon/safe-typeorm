import { HashMap } from "tstl";
import { SelectQueryBuilder } from "typeorm";

/**
 * Pagination utility.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export namespace Paginator {
    /**
     * A page.
     *
     * Collection of records with pagination indformation.
     */
    export interface IPage<T extends object> {
        /**
         * Page information.
         */
        pagination: IPagination;

        /**
         * List of records.
         */
        data: T[];
    }

    /**
     * Page information.
     */
    export interface IPagination {
        /**
         * Current page number.
         */
        page: number;

        /**
         * Limitation of records per a page.
         *
         * @default 100
         */
        limit: number;

        /**
         * Total records in the database.
         */
        total_count: number;

        /**
         * Total pages.
         *
         * Equal to {@link total_count} / {@link limit} with ceiling.
         */
        total_pages: number;
    }

    /**
     * Page request data
     */
    export interface IRequest {
        /**
         * Page number.
         */
        page?: number;

        /**
         * Limitation of records per a page.
         */
        limit?: number;
    }

    /**
     * Type of transformer.
     *
     * @param records Records to be transformed
     * @returns Transformed records
     */
    export type Transformer<Input extends object, Output extends object> = (
        records: Input[],
    ) => Output[] | Promise<Output[]>;

    /**
     * Pagination from regular ORM entity instances with transformation.
     *
     * Paginate regular ORM entity instances by getting from
     * {@link SelectQueryBuilder.getMany} method and transforming them to *Output* type.
     *
     * If you want to paginate not regular data, but raw data getting by
     * {@link SelectQueryBuilder.getRawMany}, use {@link rough} or {@link raw}
     * function instead. For referecen, different between {@link rough} and {@link raw}
     * is whether do transform or not.
     *
     * @template Entity Target entity type
     * @param stmt Select query builder for Entity type
     * @returns Currying function
     */
    export const regular =
        <Entity extends object>(stmt: SelectQueryBuilder<Entity>) =>
        /**
         * @template Output Output data type
         * @param transformer Transformer function coverting Entity to Output
         * @returns Currying function
         */
        <Output extends object>(transformer: Transformer<Entity, Output>) =>
        /**
         * @param request Page request info
         * @returns Paginated Output data
         */
        (request: IRequest): Promise<IPage<Output>> =>
            _Paginate(stmt, (stmt) => stmt.getMany(), request, transformer);

    /**
     * Pagination from raw data with transformation.
     *
     * Paginate raw data by getting from {@link SelectQueryBuilder.getRawMany}
     * method and transforming them to *Output* type.
     *
     * When you want to paginate regular ORM entity instances, use {@link regular}
     * function instead. Otherwise, you do not need transformation, just use
     * {@link raw} function.
     *
     * @template Entity Target entity type
     * @param stmt Select query builder for Entity type
     * @returns Currying function
     */
    export const rough =
        <Entity extends object>(stmt: SelectQueryBuilder<Entity>) =>
        /**
         * @template Raw Raw data type
         * @template Output Output data type
         * @param transformer Transformer function coverting Entity to Output
         * @returns Currying function
         */
        <Raw extends object, Output extends object>(
            transformer: Transformer<Raw, Output>,
        ) =>
        /**
         * @param request Page request info
         * @returns Paginated Output data
         */
        (request: IRequest): Promise<IPage<Output>> =>
            _Paginate(stmt, (stmt) => stmt.getRawMany(), request, transformer);

    /**
     * Pagination from raw data without transformation.
     *
     * Paginate raw data by getting from {@link SelectQueryBuilder.getRawMany}
     * method. Unlink {@link rough}, this function does not transform raw data.
     * Therefore, the *Output* type must be constructed only by raw query.
     *
     * Otherwise you want to transform raw data, use {@link rough} function
     * instead. On contrary, if you want to paginate regular ORM entity instances,
     * use {@link regular} function instead.
     *
     * @template Entity Target entity type
     * @param stmt Select query builder for Entity type
     * @returns Currying function
     */
    export const raw =
        <Entity extends object>(stmt: SelectQueryBuilder<Entity>) =>
        /**
         * @template Output Output data type
         * @param request Page request info
         * @returns Paginated Output data
         */
        <Output extends object>(request: IRequest): Promise<IPage<Output>> =>
            _Paginate(stmt, (stmt) => stmt.getRawMany(), request, undefined);

    /**
     * Add order by statements to query builder.
     *
     * @param stmt Target select query builder
     * @param fieldList List of fields to order with direction
     * @param dictionary Dictionary for real column names if required
     * @param groupped Whether be groupped or not
     * @return Query builder itself
     */
    export function orderBy<
        T,
        Field extends string,
        Sortable extends Array<`-${Field}` | `+${Field}`>,
    >(
        stmt: SelectQueryBuilder<T>,
        fieldList: Sortable,
        dictionary?: Record<Field, string | (() => string)>,
        groupped?: boolean,
    ): SelectQueryBuilder<T> {
        // SPECIALIZATION
        fieldList.forEach((symbol, index) => {
            const direction = symbol[0] !== "-" ? "ASC" : "DESC";
            const field: Field = symbol.substring(1) as Field;

            const key: string = (() => {
                if (dictionary) {
                    const found = dictionary[field];
                    if (found)
                        return typeof found === "string" ? found : found();
                }
                return field;
            })();

            // DO ORDER
            const target = groupped === true ? `MAX(${key})` : key;
            if (index === 0) stmt.orderBy(target, direction);
            else stmt.addOrderBy(target, direction);
        });
        return stmt;
    }

    /**
     * Follow order of source.
     *
     * Sort target array by following the order of source array.
     *
     * @param target Target array to sort
     * @param source Source array to be referenced
     * @param keyGetter Key getter function from any record
     * @return Target array itself
     */
    export function follow<
        Target extends { id: Type },
        Source extends { id: Type },
        Type extends string | number,
    >(
        target: Target[],
        source: Source[],
        keyGetter: (elem: Target) => string | number | null = (elem) => elem.id,
    ): Target[] {
        const dict: HashMap<any, Target> = new HashMap();
        for (const o of target) dict.emplace(keyGetter(o), o);

        source.forEach((item, index) => {
            target[index] = dict.get(item.id);
        });
        return target;
    }

    async function _Paginate<Input extends object>(
        stmt: SelectQueryBuilder<any>,
        accessor: (stmt: SelectQueryBuilder<Input>) => Promise<any[]>,
        request: IRequest,
        postProcess?: Transformer<Input, any>,
    ): Promise<IPage<any>> {
        // NORMALIZE INPUT
        request.limit =
            request.limit !== undefined ? Number(request.limit) : DEFAULT_LIMIT;

        const total_count: number = await stmt.getCount();
        const total_pages: number =
            request.limit !== 0 ? Math.ceil(total_count / request.limit) : 0;

        request.page =
            request.page !== undefined
                ? Math.max(1, Math.min(Number(request.page), total_pages))
                : 1;

        // GET DATA
        const index: SelectQueryBuilder<any> = stmt
            .clone()
            .offset(request.limit * Math.max(request.page - 1, 0))
            .limit(request.limit);

        // GET DATA WITH POST-PROCESSING
        const raw: any[] = await accessor(index);
        const data: any[] =
            postProcess && raw.length !== 0 ? await postProcess(raw) : raw;

        // RETURNS
        return {
            pagination: {
                page: request.page,
                limit: request.limit,
                total_count,
                total_pages,
            },
            data: data,
        };
    }

    export const DEFAULT_LIMIT = 100;
}
