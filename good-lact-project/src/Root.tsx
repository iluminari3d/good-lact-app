import App from './App';
import { useSync } from './sync/context';
import { SyncProvider } from './sync/SyncProvider';

// Quando dal cloud arrivano dati nuovi cambia la key e l'app si rilegge dallo storage.
function VersionedApp() {
  const { version } = useSync();
  return <App key={version} />;
}

export default function Root() {
  return (
    <SyncProvider>
      <VersionedApp />
    </SyncProvider>
  );
}
