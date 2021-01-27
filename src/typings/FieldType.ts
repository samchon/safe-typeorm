import { Belongs } from "../decorators/Belongs";

export type FieldType 
    = number 
    | string 
    | boolean 
    | Date 
    | Belongs.ManyToOne<any> 
    | Belongs.OneToOne<any>
    | null;