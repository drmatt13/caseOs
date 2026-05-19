import { useEffect, useState } from "react";

export type WindowWidthCategory = "small" | "Medium" | "large";

const getWindowWidthCategory = (): WindowWidthCategory => {
  if (window.matchMedia("(width >= 64rem)").matches) {
    return "large";
  }

  if (window.matchMedia("(width >= 48rem)").matches) {
    return "Medium";
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
