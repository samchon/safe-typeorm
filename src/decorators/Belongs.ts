import { BelongsExternalManyToOne } from "./external/BelongsExternalManyToOne";
import { BelongsExternalOneToOne } from "./external/BelongsExternalOneToOne";
import { BelongsManyToOne } from "./internal/BelongsManyToOne";
import { BelongsOneToOne } from "./internal/BelongsOneToOne";

/**
 * Decorators for the "belongs" relationship.
 *
 * `Belongs` is a module containing decorators who can represent the "belongs" relationship.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export namespace Belongs {
    export import ManyToOne = BelongsManyToOne;
    export import OneToOne = BelongsOneToOne;

    export namespace External {
        export import ManyToOne = BelongsExternalManyToOne;
        export import OneToOne = BelongsExternalOneToOne;
    }
}
