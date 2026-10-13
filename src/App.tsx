
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { CursorProvider } from "@/contexts/CursorProvider";
import { SearchButtonProvider } from "@/contexts/SearchButtonProvider";
import { AuthProvider } from "@/contexts/AuthProvider";
import Index from "./pages/Index";
import Movies from "./pages/Movies";
import TVShows from "./pages/TVShows";
import Details from "./pages/Details";
import Watch from "./pages/Watch";
import Search from "./pages/Search";
import Watchlist from "./pages/Watchlist";
import Settings from "./pages/Settings";
import History from "./pages/History";
import ProviderResults from "./pages/ProviderResults";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <CursorProvider>
       <SearchButtonProvider>
        <AuthProvider>
         <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/tv-shows" element={<TVShows />} />
            <Route path="/details/:type/:id" element={<Details />} />
            <Route path="/watch/:type/:id" element={<Watch />} />
            <Route path="/search" element={<Search />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/history" element={<History />} />
            <Route path="/provider/:id" element={<ProviderResults />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
         </TooltipProvider>
        </AuthProvider>
       </SearchButtonProvider>
      </CursorProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
