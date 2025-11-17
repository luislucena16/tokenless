import EscrowBoard from "./components/EscrowBoard";
import { Toaster } from 'react-hot-toast';
import { logger } from "./main";

function App() {
  return (
    <>
      <EscrowBoard logger={logger} />
      <Toaster />
    </>
  );
}

export default App;

