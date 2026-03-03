import { createRoot } from "react-dom/client";
import FileSystem from "./FileSystem.js";

const root = createRoot(document.getElementById("root")!);
root.render(<FileSystem />);
