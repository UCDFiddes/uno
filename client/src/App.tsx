import Root from "./components/Root";
import { StateContextProvider } from "./tools/StateManagerContext";

// The main entry point for the application.
export default function App() {
  // Wraps the root component in a context provider.
  return (
    <StateContextProvider>
      <Root />
    </StateContextProvider>
  );
}
