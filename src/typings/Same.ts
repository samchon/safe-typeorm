export type Same<X, Y> = X extends Y 
    ? Y extends X
        ? true
        : false
    : false;
