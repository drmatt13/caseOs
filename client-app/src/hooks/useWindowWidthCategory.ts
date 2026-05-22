import { useEffect, useState } from "react";

export type WindowWidthCategory = "small" | "medium" | "large";

const getWindowWidthCategory = (): WindowWidthCategory => {
  if (window.matchMedia("(width >= 72.5rem)").matches) {
    return "large";
  }

  if (window.matchMedia("(width >= 60rem)").matches) {
    return "medium";
  }

  return "small";
};

const useWindowWidthCategory = () => {
  const [windowWidthCategory, setWindowWidthCategory] =
    useState<WindowWidthCategory>(() => getWindowWidthCategory());

  useEffect(() => {
    const handleResize = () => {
      setWindowWidthCategory(getWindowWidthCategory());
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return windowWidthCategory;
};

export default useWindowWidthCategory;
