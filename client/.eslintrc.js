module.exports = {
	env: {
		browser: true,
		node: true,
		es2021: true,
	},
	extends: [
		"eslint:recommended",
		"plugin:react/recommended",
		"plugin:@typescript-eslint/recommended",
	],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		ecmaVersion: 12,
		sourceType: "module",
	},
	plugins: ["react", "@typescript-eslint"],
	rules: {
		"no-plusplus": "off",
		"react/jsx-indent-props": "off",
		"react/jsx-indent": "off",
		"react/jsx-filename-extension": "off",
		"react/prop-types": "off",
		"react/jsx-one-expression-per-line": "off",
		"react/jsx-no-props-spreading": "off",
		"import/no-named-as-default": "off",
		"import/no-named-as-default-member": "off",
		"import/extensions": "off",
		"no-unused-expressions": "off",
		"no-use-before-define": "off",
		"prefer-destructuring": "off",
		"jsx-a11y/no-static-element-interactions": "off",
		"jsx-a11y/click-events-have-key-events": "off",
		"no-console": ["warn", { allow: ["warn", "error"] }],
	},
};
