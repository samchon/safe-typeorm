import * as orm from "typeorm";

import { NamingStrategy } from "../NamingStrategy";

import { Enumeration } from "./models/Enumeration";
import { EnumerationGroup } from "./models/EnumerationGroup";
import { SpecialEnumeration } from "./models/SpecialEnumeration";

const LIMIT = 5;

async function create<Entity extends orm.BaseEntity>(factory: () => Entity): Promise<Entity[]>
{
    const ret: Entity[] = [];
    for (let i: number = 0; i < LIMIT; ++i)
    {
        const child: Entity = factory();
        ret.push(await child.save());
    }
    return ret;
}

function store_groups(): Promise<EnumerationGroup[]>
{
    return create(() => new EnumerationGroup());
}

function store_elements(group: EnumerationGroup): Promise<Enumeration[]>
{
    return create(() =>
    {
        const elem: Enumeration = new Enumeration();
        if (Math.random() < .5)
            elem.group.set(group);
        else
            elem.group.id = group.id;
        
        return elem;
    });
}

async function store_special(elem: Enumeration): Promise<SpecialEnumeration>
{
    const special: SpecialEnumeration = new SpecialEnumeration();
    if (Math.random() < .5)
        special.base.set(elem);
    else
        special.base.id = elem.id;

    return await special.save();
}

async function mount(connection: orm.Connection): Promise<void>
{
    await connection.dropDatabase();
    await connection.synchronize();

    const groupList: EnumerationGroup[] = await store_groups();
    const elementList: Enumeration[] = [];
    const specialList: SpecialEnumeration[] = [];

    for (const group of groupList)
        elementList.push(...await store_elements(group));

    for (const elem of elementList)
        if (elem.id % 2 === 0)
            specialList.push(await store_special(elem));
}

async function load(): Promise<void>
{
    const group = await EnumerationGroup.findOne(1);
    if (group === undefined)
        return;

    console.log((await group.children.get()).length);
    
    const child: Enumeration = (await group.children.get())[1];
    console.log(child);
    console.log(await child.group.get());

    const special: SpecialEnumeration | null = await child.special.get();
    if (special === null)
        return;

    console.log(special);
    console.log(await special.base.get());
}

async function main(): Promise<void>
{
    const connection: orm.Connection = await orm.createConnection({
        type: "mariadb",
        host: "127.0.0.1",
        port: 3306,
        username: "root",
        password: "root",
        database: "safe_typeorm_test",
        namingStrategy: new NamingStrategy(),
        entities: [`${__dirname}/models/**/*.${__filename.substr(-2)}`]
    });
    await mount(connection);
    await load();

    await connection.close();
}
main();