export const scrollToElement = (elementId: string) => (): void => {
  document.getElementById(elementId)?.scrollIntoView({ behavior: "smooth" });
};
