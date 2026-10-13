import { lazy, Suspense } from "react";
import Shell from "./components/Shell";
import { useRoute } from "./lib/router";
import Today from "./pages/Today";
import { LoadBoundary, LoadingContent } from "./components/LoadBoundary";
import StorageNotice from "./components/StorageNotice";
const Chapters = lazy(() => import("./pages/Chapters"));
const ChapterPage = lazy(() => import("./pages/Chapter"));
const Practice = lazy(() => import("./pages/Practice"));
const FlashcardsPage = lazy(() => import("./pages/Flashcards"));
const Subnetting = lazy(() => import("./pages/Subnetting"));
const DrillPage = lazy(() => import("./pages/Drill"));
const Tickets = lazy(() => import("./pages/Tickets"));
const Plan = lazy(() => import("./pages/Plan"));
const Blueprint = lazy(() => import("./pages/Blueprint"));
const Settings = lazy(() => import("./pages/Settings"));

export default function App() {
  const route = useRoute();
  let page: React.ReactNode;
  switch (route.path) {
    case "": page = <Today />; break;
    case "chapters": page = <Chapters />; break;
    case "chapter": page = <ChapterPage id={route.parts[0] ?? ""} tab={route.parts[1] ?? "learn"} />; break;
    case "practice": page = <Practice />; break;
    case "cards": page = <FlashcardsPage />; break;
    case "subnetting": page = <Subnetting />; break;
    case "drill": page = <DrillPage />; break;
    case "tickets": page = <Tickets id={route.parts[0]} />; break;
    case "plan": page = <Plan />; break;
    case "blueprint": page = <Blueprint />; break;
    case "settings": page = <Settings />; break;
    default:
      page = (
        <div className="page narrow"><div className="eyebrow">404</div><h1 className="display">Nothing here.</h1><p><a className="btn" href="#/">Back to today</a></p></div>
      );
  }
  return <Shell><StorageNotice /><LoadBoundary key={route.path + "/" + route.parts.join("/")}><Suspense fallback={<LoadingContent />}>{page}</Suspense></LoadBoundary></Shell>;
}
