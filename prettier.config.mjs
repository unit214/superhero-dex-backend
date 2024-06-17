/** @type {import('prettier').Config} */
const prettierConfig = {
  singleQuote: true,
  trailingComma: 'all',
  plugins: ['prettier-plugin-embed', 'prettier-plugin-sql'],
};

/** @type {import('prettier-plugin-embed').PrettierPluginEmbedOptions} */
const prettierPluginEmbedConfig = {
  embeddedSqlTags: ['this.prisma.$queryRaw'],
};

/** @type {import('prettier-plugin-sql').SqlBaseOptions} */
const prettierPluginSqlConfig = {
  language: 'postgresql',
  keywordCase: 'upper',
};

const config = {
  ...prettierConfig,
  ...prettierPluginEmbedConfig,
  ...prettierPluginSqlConfig,
};

export default config;
