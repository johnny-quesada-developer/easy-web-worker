export const uniqueId = (() => {
  let counter = 0;

  return (prefix: string = ''): string => {
    if (counter === Number.MAX_SAFE_INTEGER) counter = 0;

    return prefix + Date.now().toString(36) + (counter++).toString(36);
  };
})();
