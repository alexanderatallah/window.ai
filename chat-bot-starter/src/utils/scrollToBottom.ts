export const scrollToBottom = (element: HTMLElement) => {
  element.scroll({
    behavior: "auto",
    top: element.scrollHeight,
  });
};
