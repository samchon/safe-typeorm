import { HasExternalOneToMany } from "./external/HasExternalOneToMany";
import { HasExternalOneToOne } from "./external/HasExternalOneToOne";
import { HasManyToMany } from "./internal/HasManyToMany";
import { HasOneToMany } from "./internal/HasOneToMany";
import { HasOneToOne } from "./internal/HasOneToOne";

/**
 * Decorators for the "has" relationship.
 *
 * `Has` is a module containing decorators who can represent the "has" relationship.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export namespace Has {
    export import OneToOne = HasOneToOne;
    export import OneToMany = HasOneToMany;
    export import ManyToMany = HasManyToMany;

    export namespace External {
        export import OneToOne = HasExternalOneToOne;
        export import OneToMany = HasExternalOneToMany;
    }
}
