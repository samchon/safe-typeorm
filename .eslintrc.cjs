module.exports = {
    root: true,
    plugins: [
        "@typescript-eslint"
    ],
    extends: [
        "plugin:@typescript-eslint/recommended",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: "tsconfig.json"
    },
    overrides: [
        {
            files: ["src/**/*.ts"],
            rules: {
                "@typescript-eslint/ban-types": "off",
                "@typescript-eslint/consistent-type-definitions": "off",
                "@typescript-eslint/no-duplicate-imports": "error",
                "@typescript-eslint/no-empty-function": "off",
                "@typescript-eslint/no-empty-interface": "off",
                "@typescript-eslint/no-explicit-any": "off",
                "@typescript-eslint/no-inferrable-types": "off",
                "@typescript-eslint/no-namespace": "off",
                "@typescript-eslint/no-inferrable-types": "off",
                "@typescript-eslint/no-non-null-assertion": "off",
                "@typescript-eslint/no-unused-vars": "off",
                "@typescript-eslint/no-var-requires": "off",
                "@typescript-eslint/no-floating-promises": "error"
            }
        }
    ]
};