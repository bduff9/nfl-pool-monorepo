type SearchParamValue = string | string[] | undefined;

type LoginSearchParams = {
  error?: SearchParamValue;
  register?: SearchParamValue;
  submitted?: SearchParamValue;
};

const firstValue = (value: SearchParamValue): string | undefined => (Array.isArray(value) ? value[0] : value);

export const parseLoginSearchParams = ({ error, register, submitted }: LoginSearchParams) => ({
  errorMessage: firstValue(error),
  hasSubmitted: firstValue(submitted) === "Y",
  isLogin: firstValue(register) !== "Y",
});
