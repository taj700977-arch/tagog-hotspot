import { useEffect, useState } from "react";
import { AppProvider, useApp } from "./context";
import { Header, type View } from "./components/Header";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { Generate } from "./components/Generate";
import { Vouchers } from "./components/Vouchers";
import { Cards } from "./components/Cards";
import { Scripts } from "./components/Scripts";
import { Settings } from "./components/Settings";
import { LicensingFooter } from "./components/Common";
import { routerOs } from "./lib/routeros";

function Shell() {
  const { t } = useApp();
  const [connected, setConnected] = useState(false);
  const [demo, setDemo] = useState(true);
  const [view, setView] = useState<View>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (routerOs.isConnected()) {
      setConnected(true);
      setDemo(routerOs.isDemo());
    }
  }, []);

  function handleConnected() {
    setConnected(true);
    setDemo(routerOs.isDemo());
  }

  function handleDisconnect() {
    routerOs.disconnect();
    setConnected(false);
    setDemo(true);
    setView("dashboard");
  }

  function navigate(v: View) {
    setView(v);
    setMenuOpen(false);
  }

  if (!connected) {
    return (
      <AppProvider>
        <Login onConnected={handleConnected} />
      </AppProvider>
    );
  }

  return (
    <AppProvider>
      <div className="app-layout">
        <Header
          view={view}
          setView={navigate}
          onMenuToggle={() => setMenuOpen((o) => !o)}
          connected={connected}
          demo={demo}
          onDisconnect={handleDisconnect}
        />
        <div className="content-area">
          {view === "dashboard" && <Dashboard />}
          {view === "generate" && <Generate onDone={() => navigate("vouchers")} />}
          {view === "vouchers" && <Vouchers goToCards={() => navigate("cards")} />}
          {view === "cards" && <Cards />}
          {view === "scripts" && <Scripts />}
          {view === "settings" && <Settings onDisconnect={handleDisconnect} />}
        </div>
        <LicensingFooter />
      </div>
    </AppProvider>
  );
}

export default function App() {
  return <Shell />;
}
