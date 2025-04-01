import { useThemeStore } from "../store/themeStore";
import { Sun, Moon } from "lucide-react";

const DarkModeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button onClick={toggleTheme} className="p-2 rounded bg-gray-200 dark:bg-gray-800">
      {theme === "light" ? <Moon size={24} /> : <Sun size={24} />}
    </button>
  );
};

export default DarkModeToggle;
