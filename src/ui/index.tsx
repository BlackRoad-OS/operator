import { createRoot } from "react-dom/client";
import FileSystem from "./FileSystem";

const root = createRoot(document.getElementById("root")!);
root.render(<FileSystem />);
